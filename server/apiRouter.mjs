import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { BitrixAdapter } from './bitrixAdapter.mjs';
import { StatusCache } from './statusCache.mjs';
import { RateLimiter } from './rateLimiter.mjs';
import { getClientIp, validateLead, validateBooking } from './leads.mjs';

function replyJson(res, code, body, extraHeaders = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  for (const [k, v] of Object.entries(extraHeaders)) {
    if (v) res.setHeader(k, v);
  }

  res.end(JSON.stringify(body));
}

async function readJsonBody(req, limitBytes = 8192) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > limitBytes) {
      const err = new Error('Payload Too Large');
      err.code = 413;
      throw err;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    const err = new Error('Empty payload');
    err.code = 400;
    throw err;
  }

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const err = new Error('Invalid JSON payload');
    err.code = 400;
    throw err;
  }

  // Защита от прототипного загрязнения
  if (Object.prototype.hasOwnProperty.call(parsed, '__proto__') ||
      Object.prototype.hasOwnProperty.call(parsed, 'constructor') ||
      Object.prototype.hasOwnProperty.call(parsed, 'prototype')) {
    const err = new Error('Prototype pollution attempt');
    err.code = 400;
    throw err;
  }

  return parsed;
}

/**
 * Проверяет происхождение запроса (CORS / CSRF)
 */
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && origin === allowedOrigin) return true;

  try {
    const originHost = new URL(origin).host;
    const reqHost = req.headers.host;
    if (originHost === reqHost) return true;

    // Локальное окружение / тесты: localhost и 127.0.0.1
    const originHostname = new URL(origin).hostname;
    const reqHostname = reqHost?.split(':')[0];
    if (
      (originHostname === 'localhost' || originHostname === '127.0.0.1') &&
      (reqHostname === 'localhost' || reqHostname === '127.0.0.1')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export const MAX_RECEIVED_REQUESTS = 10000;

/**
 * Единый защищенный маршрутизатор API (BFF)
 */
export function createApiRouter({
  adapter = new BitrixAdapter(),
  statusCache = new StatusCache(),
  leadLimiter = new RateLimiter(3, 10 * 60 * 1000),
  bookingLimiter = new RateLimiter(3, 10 * 60 * 1000),
  statusLimiter = new RateLimiter(60, 60 * 1000),
  maxReceivedRequests = MAX_RECEIVED_REQUESTS
} = {}) {
  // Кэш дедупликации и идемпотентности по requestId (хранение до 1 часа, максимум 10000 записей)
  const receivedRequests = new Map();

  function cleanReceivedRequests() {
    const now = Date.now();
    for (const [key, item] of receivedRequests) {
      if (now - item.time > 3600000) {
        receivedRequests.delete(key);
      }
    }
  }

  function saveReceivedRequest(key, item) {
    if (!key) return;
    cleanReceivedRequests();
    if (receivedRequests.size >= maxReceivedRequests) {
      const oldestKey = receivedRequests.keys().next().value;
      receivedRequests.delete(oldestKey);
    }
    receivedRequests.set(key, item);
  }

  if (typeof setInterval !== 'undefined') {
    const timer = setInterval(() => cleanReceivedRequests(), 60000);
    timer?.unref?.();
  }

  const apiRouter = async function apiRouter(req, res, next) {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    // Проверка CORS / Origin
    const origin = req.headers.origin;
    if (!checkOrigin(req)) {
      return replyJson(res, 403, { error: 'Недопустимый источник запроса (CORS).' });
    }

    // CORS preflight и заголовки для разрешенного Origin
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    // Маршрут: GET /api/apartments/status
    if (path === '/api/apartments/status') {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        return replyJson(res, 405, { error: 'Метод не поддерживается.' });
      }

      const ip = getClientIp(req);
      if (!statusLimiter.isAllowed(ip)) {
        const retryAfter = statusLimiter.getRetryAfter(ip);
        return replyJson(res, 429, { error: 'Слишком много запросов статусов.' }, { 'Retry-After': String(retryAfter) });
      }

      const data = await statusCache.getStatuses(adapter);
      return replyJson(res, 200, data);
    }

    // Маршрут: POST /api/leads (канонический) и POST /api/lead (обратная совместимость)
    if (path === '/api/leads' || path === '/api/lead') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return replyJson(res, 405, { error: 'Метод не поддерживается.' });
      }

      const ip = getClientIp(req);
      if (!leadLimiter.isAllowed(ip)) {
        const retryAfter = leadLimiter.getRetryAfter(ip);
        return replyJson(
          res,
          429,
          { error: 'Слишком много запросов. Лимит: 3 заявки за 10 минут.' },
          { 'Retry-After': String(retryAfter) }
        );
      }

      try {
        const contentType = req.headers['content-type'] || '';
        if (contentType && !contentType.includes('application/json')) {
          return replyJson(res, 415, { error: 'Требуется Content-Type: application/json.' });
        }

        const body = await readJsonBody(req);

        // Honeypot: скрытое поле заполнено ботом (тихий сброс без сохранения)
        if (body.website) {
          return replyJson(res, 200, {
            success: true,
            ok: true,
            id: randomUUID(),
            mode: 'local',
            message: 'Заявка принята.'
          });
        }

        const validation = validateLead(body);
        if (validation.error) {
          return replyJson(res, 400, { error: validation.error });
        }

        const leadData = validation.value;
        const key = body.requestId ? `${ip}:${body.requestId}` : '';
        const { createdAt, ...identity } = leadData;
        const fingerprint = createHash('sha256').update(JSON.stringify(identity)).digest('hex');

        // Идемпотентность по requestId
        cleanReceivedRequests();
        if (key && receivedRequests.has(key)) {
          const existing = receivedRequests.get(key);
          if (existing.fingerprint !== fingerprint) {
            return replyJson(res, 409, { error: 'Идентификатор запроса уже использован для другой заявки.' });
          }
          return replyJson(res, 200, await existing.result);
        }

        const executeLead = async () => {
          const result = await adapter.createLead({
            name: leadData.name,
            phone: leadData.phone,
            topic: leadData.topic,
            apartmentId: leadData.apartmentId
          });

          const id = result.id || result.leadId || randomUUID();
          const responseDto = {
            success: Boolean(result.success),
            id,
            leadId: id,
            mode: result.mode || (adapter.isConfigured() ? 'crm' : 'local'),
            message: result.message || 'Заявка успешно зарегистрирована.'
          };

          // В локальном режиме сохраняем в .local/leads.ndjson
          if (result.success && responseDto.mode === 'local') {
            try {
              const localFile = resolve('.local/leads.ndjson');
              await mkdir(dirname(localFile), { recursive: true });
              await appendFile(
                localFile,
                JSON.stringify({
                  id,
                  name: leadData.name,
                  phone: leadData.phone,
                  topic: leadData.topic,
                  apartmentId: leadData.apartmentId,
                  consent: true,
                  createdAt: leadData.createdAt
                }) + '\n',
                { encoding: 'utf8', mode: 0o600 }
              );
            } catch {
              // Local disk fallback
            }
          }

          return responseDto;
        };

        const resultPromise = executeLead();
        if (key) {
          saveReceivedRequest(key, { time: Date.now(), fingerprint, result: resultPromise });
        }

        const responseDto = await resultPromise;
        return replyJson(res, responseDto.success ? 201 : 502, responseDto);
      } catch (err) {
        if (err.code === 413) return replyJson(res, 413, { error: 'Запрос превышает 8 КБ.' });
        if (err.code === 415) return replyJson(res, 415, { error: 'Требуется Content-Type: application/json.' });
        return replyJson(res, 400, { error: 'Некорректный JSON запрос.' });
      }
    }

    // Маршрут: POST /api/booking
    if (path === '/api/booking') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return replyJson(res, 405, { error: 'Метод не поддерживается.' });
      }

      const ip = getClientIp(req);
      if (!bookingLimiter.isAllowed(ip)) {
        const retryAfter = bookingLimiter.getRetryAfter(ip);
        return replyJson(
          res,
          429,
          { error: 'Слишком много запросов на бронирование. Попробуйте позднее.' },
          { 'Retry-After': String(retryAfter) }
        );
      }

      try {
        const contentType = req.headers['content-type'] || '';
        if (contentType && !contentType.includes('application/json')) {
          return replyJson(res, 415, { error: 'Требуется Content-Type: application/json.' });
        }

        const body = await readJsonBody(req);

        // Honeypot: скрытое поле заполнено ботом (тихий сброс)
        if (body.website) {
          return replyJson(res, 200, {
            success: true,
            ok: true,
            bookingId: randomUUID(),
            mode: 'local',
            message: 'Бронь принята.'
          });
        }

        const validation = validateBooking(body);
        if (validation.error) {
          return replyJson(res, 400, { error: validation.error });
        }

        const bookingData = validation.value;

        // BOLA / Availability check: проверка, не продана ли квартира
        if (bookingData.apartmentId) {
          const currentStatuses = await statusCache.getStatuses(adapter);
          const status = currentStatuses.statuses?.[bookingData.apartmentId.toLowerCase()];
          if (status === 'sold') {
            return replyJson(res, 409, { error: 'Данная квартира уже продана.' });
          }
        }

        const key = body.requestId ? `${ip}:${body.requestId}` : '';
        const { createdAt, ...identity } = bookingData;
        const fingerprint = createHash('sha256').update(JSON.stringify(identity)).digest('hex');

        // Идемпотентность по requestId
        cleanReceivedRequests();
        if (key && receivedRequests.has(key)) {
          const existing = receivedRequests.get(key);
          if (existing.fingerprint !== fingerprint) {
            return replyJson(res, 409, { error: 'Идентификатор запроса уже использован для другой заявки.' });
          }
          return replyJson(res, 200, await existing.result);
        }

        const executeBooking = async () => {
          const result = await adapter.createBooking({
            name: bookingData.name,
            phone: bookingData.phone,
            apartmentId: bookingData.apartmentId,
            apartmentNumber: bookingData.apartmentNumber
          });

          const bookingId = result.bookingId || randomUUID();
          const responseDto = {
            success: Boolean(result.success),
            bookingId,
            id: bookingId,
            mode: result.mode || (adapter.isConfigured() ? 'crm' : 'local'),
            message: result.message || 'Квартира успешно забронирована на предварительную консультацию.'
          };

          // В локальном режиме сохраняем бронь в .local/bookings.ndjson, чтобы данные не терялись
          if (result.success && responseDto.mode === 'local') {
            try {
              const localBookings = resolve('.local/bookings.ndjson');
              await mkdir(dirname(localBookings), { recursive: true });
              await appendFile(
                localBookings,
                JSON.stringify({
                  bookingId,
                  name: bookingData.name,
                  phone: bookingData.phone,
                  apartmentId: bookingData.apartmentId,
                  apartmentNumber: bookingData.apartmentNumber,
                  consent: true,
                  createdAt: bookingData.createdAt
                }) + '\n',
                { encoding: 'utf8', mode: 0o600 }
              );
            } catch {
              // Local disk fallback
            }
          }

          return responseDto;
        };

        const resultPromise = executeBooking();
        if (key) {
          saveReceivedRequest(key, { time: Date.now(), fingerprint, result: resultPromise });
        }

        const responseDto = await resultPromise;
        return replyJson(res, responseDto.success ? 201 : 502, responseDto);
      } catch (err) {
        if (err.code === 413) return replyJson(res, 413, { error: 'Запрос превышает 8 КБ.' });
        if (err.code === 415) return replyJson(res, 415, { error: 'Требуется Content-Type: application/json.' });
        return replyJson(res, 400, { error: 'Некорректный JSON запрос.' });
      }
    }

    return next?.();
  };

  apiRouter.receivedRequests = receivedRequests;
  apiRouter.maxReceivedRequests = maxReceivedRequests;
  apiRouter.cleanReceivedRequests = cleanReceivedRequests;

  return apiRouter;
}


