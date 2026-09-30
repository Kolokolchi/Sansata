import { randomUUID } from 'node:crypto';

const BITRIX_CLOUD_DOMAINS = ['bitrix24.kz', 'bitrix24.ru', 'bitrix24.com', 'bitrix24.eu'];

/**
 * Изолированный адаптер взаимодействия с Bitrix24 REST API.
 * Все вызовы выполняются строго на сервере.
 */
export class BitrixAdapter {
  constructor() {
    this.webhookUrl = process.env.BITRIX_WEBHOOK_URL || '';
  }

  /**
   * Проверяет, настроен ли реальный вебхук Bitrix24 и защищает от SSRF
   */
  isConfigured() {
    if (!this.webhookUrl || typeof this.webhookUrl !== 'string') return false;
    if (this.webhookUrl.includes('your-domain.bitrix24.ru') || this.webhookUrl.includes('secret_token')) {
      return false;
    }

    try {
      const parsed = new URL(this.webhookUrl);
      // Разрешен https (или http строго для локальных тестов на 127.0.0.1 / localhost)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      if (parsed.protocol === 'http:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
        return false;
      }

      const host = parsed.hostname.toLowerCase();
      const localTestHost = parsed.protocol === 'http:' && (host === '127.0.0.1' || host === 'localhost');
      const cloudHost = BITRIX_CLOUD_DOMAINS.some(domain => host.endsWith(`.${domain}`));
      const customHosts = (process.env.BITRIX_ALLOWED_WEBHOOK_HOSTS || '').split(',').map(value => value.trim().toLowerCase());
      if (!localTestHost && !cloudHost && !customHosts.includes(host)) return false;
      if (parsed.username || parsed.password || parsed.search || parsed.hash) return false;
      if (!localTestHost && parsed.port) return false;
      if (!/^\/rest\/\d+\/[a-zA-Z0-9_-]+\/?$/.test(parsed.pathname)) return false;

      return true;
    } catch {
      return false;
    }
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
        id: leadId,
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
        SOURCE_ID: 'WEB'
      }
    };

    try {
      const response = await fetch(`${this.webhookUrl.replace(/\/+$/, '')}/crm.lead.add.json`, {
        method: 'POST',
        redirect: 'error',
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
   * Запрос консультации о бронировании. Без проверенного реестра нельзя
   * создавать CRM Deal и обещать резерв конкретной квартиры.
   */
  async createBooking(bookingData) {
    const requestedPlan = bookingData.apartmentId || bookingData.apartmentNumber || 'не указан';
    const lead = await this.createLead({
      name: bookingData.name,
      phone: bookingData.phone,
      topic: `Запрос консультации о планировке: ${requestedPlan}. Наличие и возможность бронирования требуют подтверждения.`
    });
    if (!lead.success) return { success: false, message: 'Не удалось зарегистрировать запрос.' };
    return {
      success: true,
      bookingId: randomUUID(),
      mode: this.isConfigured() ? 'crm' : 'local',
      message: 'Запрос на консультацию зарегистрирован.'
    };
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
        redirect: 'error',
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
