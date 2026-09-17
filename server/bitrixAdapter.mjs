import { randomUUID } from 'node:crypto';

/**
 * Изолированный адаптер взаимодействия с Bitrix24 REST API.
 * Все вызовы выполняются строго на сервере.
 */
export class BitrixAdapter {
  constructor() {
    this.webhookUrl = process.env.BITRIX_WEBHOOK_URL || '';
    this.categoryId = Number(process.env.BITRIX_DEAL_CATEGORY_ID || 0);
  }

  /**
   * Проверяет, настроен ли реальный вебхук Bitrix24
   */
  isConfigured() {
    return (
      Boolean(this.webhookUrl) &&
      !this.webhookUrl.includes('your-domain.bitrix24.ru') &&
      !this.webhookUrl.includes('secret_token')
    );
  }

  /**
   * Отправка лида в Bitrix24 (crm.lead.add)
   */
  async createLead(leadData) {
    const leadId = randomUUID();

    if (!this.isConfigured()) {
      // Режим локальной фиксации согласно AGENTS.md
      return {
        success: true,
        leadId,
        mode: 'local',
        message: 'Заявка принята в обработку (локальный режим консультации).'
      };
    }

    const payload = {
      fields: {
        TITLE: `Заявка с сайта: ${leadData.name}`,
        NAME: leadData.name,
        PHONE: [{ VALUE: leadData.phone, VALUE_TYPE: 'WORK' }],
        COMMENTS: leadData.topic || 'Консультация по проекту',
        SOURCE_ID: 'WEB',
        CATEGORY_ID: this.categoryId
      }
    };

    try {
      const response = await fetch(`${this.webhookUrl.replace(/\/+$/, '')}/crm.lead.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return { success: false, message: 'CRM временно недоступна.' };
      }

      const data = await response.json();
      if (data?.result) {
        // Очищенный публичный DTO без внутренних CRM ID
        return {
          success: true,
          leadId,
          message: 'Заявка успешно зарегистрирована.'
        };
      }

      return { success: false, message: 'Не удалось зарегистрировать заявку.' };
    } catch {
      return { success: false, message: 'Ошибка связи с сервером CRM.' };
    }
  }

  /**
   * Фиксация временной брони квартиры (crm.deal.add)
   */
  async createBooking(bookingData) {
    const bookingId = randomUUID();

    if (!this.isConfigured()) {
      return {
        success: true,
        bookingId,
        mode: 'local',
        message: 'Запрос на бронирование зафиксирован (режим консультации).'
      };
    }

    const payload = {
      fields: {
        TITLE: `Бронь квартиры ${bookingData.apartmentNumber || ''} (${bookingData.name})`,
        NAME: bookingData.name,
        PHONE: [{ VALUE: bookingData.phone, VALUE_TYPE: 'WORK' }],
        CATEGORY_ID: this.categoryId,
        STAGE_ID: 'C:NEW',
        COMMENTS: `Квартира ID: ${bookingData.apartmentId || 'не указан'}`
      }
    };

    try {
      const response = await fetch(`${this.webhookUrl.replace(/\/+$/, '')}/crm.deal.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return { success: false, message: 'Сервис бронирования временно недоступен.' };
      }

      const data = await response.json();
      if (data?.result) {
        return {
          success: true,
          bookingId,
          message: 'Квартира успешно забронирована на предварительную консультацию.'
        };
      }

      return { success: false, message: 'Не удалось создать бронь.' };
    } catch {
      return { success: false, message: 'Ошибка связи с сервером бронирования.' };
    }
  }

  /**
   * Получение актуальных статусов квартир из CRM для периодического кэша
   */
  async fetchApartmentStatuses() {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(`${this.webhookUrl.replace(/\/+$/, '')}/crm.item.list.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityTypeId: 1 }), // каталог объектов
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data?.result?.items) ? data.result.items : [];
    } catch {
      return [];
    }
  }
}
