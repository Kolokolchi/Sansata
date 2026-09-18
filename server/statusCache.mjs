/**
 * Извлекает строгий публичный идентификатор лота или планировки (например, 'shattyq-1').
 * Категорически запрещено передавать внутренний числовой item.id из CRM или Deal ID в публичный DTO.
 */
function getPublicApartmentId(item) {
  if (!item || typeof item !== 'object') return null;

  const candidates = [item.publicId, item.xmlId, item.code, item.lotId, item.lotCode, item.title];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      // Разрешены строго публичные идентификаторы каталога Shattyq или лотов
      if (/^shattyq-[a-zA-Z0-9_-]{1,64}$/i.test(trimmed)) {
        return trimmed.toLowerCase();
      }
      // Дополнительно разрешены канонические селекторы вида s{section}-f{floor}-u{unit}
      if (/^s\d+-f\d+-u\d+$/i.test(trimmed)) {
        return trimmed.toLowerCase();
      }
    }
  }

  // Внутренние CRM/Deal ID (числовые, префиксы CRM_, DEAL_, STAGE_ и т.д.) отсекаются
  return null;
}

/**
 * Серверный кэш актуальных статусов квартир.
 * Предотвращает превышение лимитов Bitrix24 REST API при посещении сайта пользователями.
 */
export class StatusCache {
  constructor(ttlMs = 5 * 60 * 1000, negativeTtlMs = 30 * 1000) {
    this.ttlMs = ttlMs;
    this.negativeTtlMs = negativeTtlMs;
    this.cachedData = Object.create(null);
    this.lastUpdated = 0;
    this.isFetching = false;
  }

  /**
   * Возвращает актуальную карту статусов квартир { [apartmentId]: 'available' | 'reserved' | 'sold' }
   */
  async getStatuses(adapter) {
    const now = Date.now();

    // Если кэш свежий, отдаем немедленно (включая валидное пустое состояние)
    if (this.lastUpdated > 0 && now - this.lastUpdated < this.ttlMs) {
      return {
        updatedAt: new Date(this.lastUpdated).toISOString(),
        statuses: { ...this.cachedData }
      };
    }

    // Если обновление уже идет другим запросом, отдаем текущие данные
    if (this.isFetching) {
      return {
        updatedAt: new Date(this.lastUpdated || now).toISOString(),
        statuses: { ...this.cachedData }
      };
    }

    this.isFetching = true;
    try {
      const rawItems = await adapter.fetchApartmentStatuses();
      const newMap = Object.create(null);

      if (Array.isArray(rawItems)) {
        for (const item of rawItems) {
          const publicId = getPublicApartmentId(item);
          if (publicId && publicId !== '__proto__' && publicId !== 'constructor' && publicId !== 'prototype') {
            let status = 'available';
            const stage = String(item.stageId || '').toUpperCase();
            const itemStatus = String(item.status || '').toLowerCase();
            if (stage.includes('RESERVED') || itemStatus === 'reserved') {
              status = 'reserved';
            } else if (stage.includes('SOLD') || itemStatus === 'sold') {
              status = 'sold';
            }
            newMap[publicId] = status;
          }
        }
      }

      this.cachedData = newMap;
      this.lastUpdated = now;
    } catch {
      // Negative caching cooldown: при ошибке внешнего сервиса CRM
      // выдерживаем паузу negativeTtlMs перед следующей попыткой
      this.lastUpdated = now - this.ttlMs + this.negativeTtlMs;
    } finally {
      this.isFetching = false;
    }

    return {
      updatedAt: new Date(this.lastUpdated || now).toISOString(),
      statuses: { ...this.cachedData }
    };
  }
}

