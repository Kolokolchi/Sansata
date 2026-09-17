/**
 * Извлекает публичный идентификатор лота или планировки (например, 'shattyq-1').
 * Категорически запрещено передавать внутренний числовой item.id из CRM в публичный DTO.
 */
function getPublicApartmentId(item) {
  if (!item || typeof item !== 'object') return null;

  const candidates = [item.publicId, item.xmlId, item.code, item.lotId, item.lotCode];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !/^\d+$/.test(c.trim())) {
      return c.trim();
    }
  }

  if (typeof item.title === 'string' && item.title.startsWith('shattyq-')) {
    return item.title.trim();
  }

  // Внутренние числовые идентификаторы Bitrix24 отсекаются для защиты периметра
  return null;
}

/**
 * Серверный кэш актуальных статусов квартир.
 * Предотвращает превышение лимитов Bitrix24 REST API при посещении сайта пользователями.
 */
export class StatusCache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.cachedData = {};
    this.lastUpdated = 0;
    this.isFetching = false;
  }

  /**
   * Возвращает актуальную карту статусов квартир { [apartmentId]: 'available' | 'reserved' | 'sold' }
   */
  async getStatuses(adapter) {
    const now = Date.now();

    // Если кэш свежий, отдаем немедленно
    if (now - this.lastUpdated < this.ttlMs && Object.keys(this.cachedData).length > 0) {
      return {
        updatedAt: new Date(this.lastUpdated).toISOString(),
        statuses: this.cachedData
      };
    }

    // Если обновление уже идет другим запросом, отдаем текущие данные
    if (this.isFetching) {
      return {
        updatedAt: new Date(this.lastUpdated || now).toISOString(),
        statuses: this.cachedData
      };
    }

    this.isFetching = true;
    try {
      const rawItems = await adapter.fetchApartmentStatuses();
      const newMap = {};

      for (const item of rawItems) {
        const publicId = getPublicApartmentId(item);
        if (publicId) {
          // Маппинг CRM-статуса на строгий публичный DTO
          let status = 'available';
          if (item.stageId?.includes('RESERVED') || item.status === 'reserved') {
            status = 'reserved';
          } else if (item.stageId?.includes('SOLD') || item.status === 'sold') {
            status = 'sold';
          }
          newMap[publicId] = status;
        }
      }

      if (Object.keys(newMap).length > 0 || !this.lastUpdated) {
        this.cachedData = newMap;
        this.lastUpdated = now;
      }
    } catch {
      // При ошибке сохраняем старый кэш
    } finally {
      this.isFetching = false;
    }

    return {
      updatedAt: new Date(this.lastUpdated || now).toISOString(),
      statuses: this.cachedData
    };
  }
}
