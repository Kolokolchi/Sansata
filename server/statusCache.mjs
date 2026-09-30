import { readFileSync } from 'node:fs';

const snapshot = JSON.parse(readFileSync(new URL('../src/data/saf-stock-snapshot.json', import.meta.url), 'utf8'));
const publicApartmentIds = new Set(snapshot.observations.map(unit => unit.id));

/** Match public SAF IDs only; raw CRM IDs and unregistered titles never enter the DTO. */
function getPublicApartmentId(item) {
  if (!item || typeof item !== 'object') return null;
  for (const value of [item.publicId, item.xmlId, item.code, item.lotId, item.lotCode, item.title]) {
    if (typeof value !== 'string') continue;
    const id = value.trim().toLowerCase();
    if (publicApartmentIds.has(id)) return id;
  }
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
    this.inFlight = null;
  }

  /**
   * Возвращает актуальную карту статусов квартир { [apartmentId]: 'available' | 'reserved' | 'sold' }
   */
  async getStatuses(adapter) {
    const now = Date.now();
    const snapshot = () => ({
      updatedAt: new Date(this.lastUpdated || now).toISOString(),
      statuses: { ...this.cachedData }
    });

    // Если кэш свежий, отдаем немедленно (включая валидное пустое состояние)
    if (this.lastUpdated > 0 && now - this.lastUpdated < this.ttlMs) {
      return snapshot();
    }

    // During a cold load there is no stale snapshot to serve: share the pending result.
    if (this.inFlight) {
      return this.lastUpdated > 0 ? snapshot() : this.inFlight;
    }

    this.inFlight = (async () => {
      try {
        const rawItems = await adapter.fetchApartmentStatuses();
        const newMap = Object.create(null);

        if (Array.isArray(rawItems)) {
          for (const item of rawItems) {
            const publicId = getPublicApartmentId(item);
            if (publicId && publicId !== '__proto__' && publicId !== 'constructor' && publicId !== 'prototype') {
              // Missing CRM status must never be presented as available stock.
              let status = 'unknown';
              const stage = String(item.stageId || '').toUpperCase();
              const itemStatus = String(item.status || '').toLowerCase();
              if (stage === 'RESERVED' || stage.endsWith(':RESERVED') || itemStatus === 'reserved') {
                status = 'reserved';
              } else if (stage === 'SOLD' || stage.endsWith(':SOLD') || itemStatus === 'sold') {
                status = 'sold';
              } else if (stage === 'AVAILABLE' || stage.endsWith(':AVAILABLE') || itemStatus === 'available') {
                status = 'available';
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
      }
      return snapshot();
    })();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }
}
