import { isIP } from 'node:net';

/**
 * Проверка отсутствия прототипного загрязнения.
 */
function hasPrototypePollution(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
         Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
         Object.prototype.hasOwnProperty.call(obj, 'prototype');
}

/**
 * Валидация входящей заявки на консультацию.
 */
export function validateLead(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || hasPrototypePollution(value)) {
    return { error: 'Некорректная заявка.' };
  }

  const allowed = new Set(['name', 'phone', 'topic', 'consent', 'requestId', 'website', 'apartmentId']);
  if (Object.keys(value).some(key => !allowed.has(key)) ||
      typeof value.name !== 'string' || typeof value.phone !== 'string' ||
      ['topic', 'requestId', 'website', 'apartmentId'].some(key => value[key] !== undefined && typeof value[key] !== 'string') ||
      (value.website?.length || 0) > 200 ||
      (value.requestId !== undefined && !/^[a-zA-Z0-9-]{8,80}$/.test(value.requestId)) ||
      (value.apartmentId !== undefined && !/^[a-zA-Z0-9_-]{1,64}$/.test(value.apartmentId))) {
    return { error: 'Некорректная заявка.' };
  }

  const name = String(value.name || '').trim();
  const phone = value.phone.replace(/[\s()+-]/g, '');
  const topic = String(value.topic || 'Консультация').trim();

  if (name.length < 2 || name.length > 80 || /[<>\x00-\x1f]/.test(name)) {
    return { error: 'Введите имя от 2 до 80 символов.' };
  }

  if (!/^[78]\d{10}$/.test(phone)) {
    return { error: 'Укажите номер в формате +7 и 10 цифр.' };
  }

  if (value.consent !== true) {
    return { error: 'Подтвердите согласие на локальное сохранение заявки.' };
  }

  if (topic.length > 600 || /[<>\x00-\x1f]/.test(topic)) {
    return { error: 'Слишком длинный запрос.' };
  }

  return {
    value: {
      name,
      phone: '+7' + phone.slice(1),
      topic,
      apartmentId: value.apartmentId ? value.apartmentId.trim() : undefined,
      consent: true,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Валидация входящего запроса на бронирование квартиры.
 */
export function validateBooking(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || hasPrototypePollution(value)) {
    return { error: 'Некорректный запрос на бронирование.' };
  }

  const allowed = new Set(['name', 'phone', 'apartmentId', 'apartmentNumber', 'consent', 'requestId', 'website']);
  if (Object.keys(value).some(key => !allowed.has(key)) ||
      typeof value.name !== 'string' || typeof value.phone !== 'string' ||
      ['apartmentId', 'apartmentNumber', 'requestId', 'website'].some(key => value[key] !== undefined && typeof value[key] !== 'string') ||
      (value.website?.length || 0) > 200 ||
      (value.requestId !== undefined && !/^[a-zA-Z0-9-]{8,80}$/.test(value.requestId))) {
    return { error: 'Некорректный запрос на бронирование.' };
  }

  const name = String(value.name || '').trim();
  const phone = value.phone.replace(/[\s()+-]/g, '');

  if (name.length < 2 || name.length > 80 || /[<>\x00-\x1f]/.test(name)) {
    return { error: 'Имя должно содержать от 2 до 80 символов.' };
  }

  if (!/^[78]\d{10}$/.test(phone)) {
    return { error: 'Некорректный номер телефона (+7XXXXXXXXXX).' };
  }

  if (value.consent !== true) {
    return { error: 'Необходимо согласие на обработку данных.' };
  }

  if (value.apartmentId && !/^[a-zA-Z0-9_-]{1,64}$/.test(value.apartmentId)) {
    return { error: 'Некорректный идентификатор квартиры.' };
  }

  if (value.apartmentNumber && !/^[0-9a-zA-Z\s-]{1,20}$/.test(value.apartmentNumber)) {
    return { error: 'Некорректный номер квартиры.' };
  }

  return {
    value: {
      name,
      phone: '+7' + phone.slice(1),
      apartmentId: value.apartmentId ? value.apartmentId.trim() : undefined,
      apartmentNumber: value.apartmentNumber ? value.apartmentNumber.trim() : undefined,
      consent: true,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Direct local server: forwarded headers are untrusted client input.
 * Default strictly to req.socket.remoteAddress. Evaluate X-Forwarded-For
 * only when the socket peer is an explicitly trusted proxy. Walk the
 * forwarded chain from the right so client-supplied leftmost entries cannot
 * bypass rate limiting when a proxy appends to an existing header.
 */
export function getClientIp(req) {
  const peer = req.socket?.remoteAddress || 'local';
  const trusted = new Set((process.env.TRUSTED_PROXY_IPS || '').split(',').map(ip => ip.trim()).filter(ip => isIP(ip)));
  if (process.env.TRUST_PROXY !== 'true' || !trusted.has(peer)) return peer;

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded !== 'string') return peer;
  const chain = forwarded.split(',').map(ip => ip.trim());
  if (chain.length > 20 || chain.some(ip => !isIP(ip))) return peer;
  for (let i = chain.length - 1; i >= 0; i--) {
    if (!trusted.has(chain[i])) return chain[i];
  }
  return peer;
}
