import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

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
 * Default strictly to req.socket.remoteAddress. Only evaluate X-Forwarded-For
 * when process.env.TRUST_PROXY === 'true'.
 * Validates IP string format to prevent header injection attacks.
 */
export function getClientIp(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp && /^[0-9a-fA-F:.]+$/.test(firstIp) && firstIp.length <= 45) {
        return firstIp;
      }
    }
  }
  return req.socket?.remoteAddress || 'local';
}


/**
 * Express / Node HTTP Middleware для приема заявок.
 */
export function leadMiddleware({ file = resolve('.local/leads.ndjson'), rateLimit = 3, windowMs = 600000 } = {}) {
  const limits = new Map();
  const received = new Map();

  return async function (req, res, next) {
    if (req.url?.split('?')[0] !== '/api/leads') {
      return next?.();
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    const reply = (code, body) => {
      res.statusCode = code;
      res.end(JSON.stringify(body));
    };

    if (req.method !== 'POST') {
      return reply(405, { error: 'Используйте POST.' });
    }

    // Защита от межсайтовой подделки запросов (CSRF)
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          return reply(403, { error: 'Недопустимый источник запроса.' });
        }
      } catch {
        return reply(403, { error: 'Недопустимый источник запроса.' });
      }
    }

    if (!req.headers['content-type']?.includes('application/json')) {
      return reply(415, { error: 'Требуется JSON.' });
    }

    // Bound transient local state. Public deployments need shared durable storage.
    const now = Date.now();
    for (const [k, v] of limits) {
      if (now - v.start >= windowMs) limits.delete(k);
    }
    for (const [k, v] of received) {
      if (now - v.time > 3600000) received.delete(k);
    }

    const ip = getClientIp(req);
    const chunks = [];
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 8192) {
          return reply(413, { error: 'Запрос слишком большой.' });
        }
        chunks.push(chunk);
      }

      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return reply(400, { error: 'Некорректная заявка.' });
      }

      if (body.website) {
        return reply(200, {
          ok: true,
          success: true,
          id: randomUUID(),
          mode: 'local',
          message: 'Заявка принята.'
        });
      }

      const parsed = validateLead(body);
      if (parsed.error) {
        return reply(400, { error: parsed.error });
      }

      const key = body.requestId ? `${ip}:${body.requestId}` : '';
      const { createdAt, ...identity } = parsed.value;
      const fingerprint = createHash('sha256').update(JSON.stringify({ ...identity, website: body.website || '' })).digest('hex');

      // Идемпотентность: возврат сохраненного ответа при повторе
      if (key && received.has(key)) {
        const existing = received.get(key);
        if (existing.fingerprint !== fingerprint) return reply(409, { error: 'Идентификатор уже использован для другой заявки.' });
        return reply(200, await existing.result);
      }

      // Reserve the slot synchronously BEFORE filesystem awaits to resist parallel requests.
      const currentTime = Date.now();
      const stored = limits.get(ip);
      const limit = stored && currentTime - stored.start < windowMs ? stored : { start: currentTime, count: 0 };
      if (limit.count >= rateLimit) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((limit.start + windowMs - currentTime) / 1000))));
        return reply(429, { error: 'Слишком много запросов. Попробуйте позднее.' });
      }
      if (limits.size >= 10000 || received.size >= 10000) return reply(503, { error: 'Сервис временно занят.' });
      limits.set(ip, { ...limit, count: limit.count + 1 });

      const save = async () => {
        const lead = { id: randomUUID(), ...parsed.value };
        // Match the normal receipt, but never store a honeypot submission.
        if (!body.website) {
          await mkdir(dirname(file), { recursive: true });
          await appendFile(file, JSON.stringify(lead) + '\n', { encoding: 'utf8', mode: 0o600 });
        }
        return { id: lead.id, mode: 'local', message: 'Заявка сохранена на локальном сервере. В отдел продаж Sensata она не отправлена.' };
      };
      const result = save();
      if (key) received.set(key, { time: currentTime, fingerprint, result });

      try { return reply(201, await result); }
      catch (error) { if (key) received.delete(key); throw error; }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return reply(400, { error: 'Некорректный JSON.' });
      }
      return reply(500, { error: 'Не удалось сохранить заявку. Попробуйте позже или позвоните 700.' });
    }
  };
}
