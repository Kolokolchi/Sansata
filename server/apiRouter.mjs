import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BitrixAdapter } from './bitrixAdapter.mjs';
import { StatusCache } from './statusCache.mjs';
import { RateLimiter } from './rateLimiter.mjs';
import { getClientIp } from './leads.mjs';

const adapter = new BitrixAdapter();
const statusCache = new StatusCache();
const leadLimiter = new RateLimiter(3, 10 * 60 * 1000); // 3 заявки за 10 минут
const bookingLimiter = new RateLimiter(3, 10 * 60 * 1000); // 3 заявки за 10 минут

function replyJson(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req, limitBytes = 8192) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw) > limitBytes) {
      const err = new Error('Payload Too Large');
      err.code = 413;
      throw err;
    }
  }
  return JSON.parse(raw);
}

function sanitizeString(str) {
  return String(str || '').replace(/[<>'"&]/g, '').trim();
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
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * Единый защищенный маршрутизатор API
 */
export function createApiRouter() {
  return async function apiRouter(req, res, next) {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname;

    // Проверка CORS / Origin
    if (!checkOrigin(req)) {
      return replyJson(res, 403, { error: 'Недопустимый источник запроса (CORS).' });
    }

    // Маршрут: GET /api/apartments/status
    if (path === '/api/apartments/status' && req.method === 'GET') {
      const data = await statusCache.getStatuses(adapter);
      return replyJson(res, 200, data);
    }

    // Маршрут: POST /api/leads (канонический) и POST /api/lead (обратная совместимость)
    if (path === '/api/leads' || path === '/api/lead') {
      if (req.method !== 'POST') return replyJson(res, 405, { error: 'Метод не поддерживается.' });

      const ip = getClientIp(req);
      if (!leadLimiter.isAllowed(ip)) {
        return replyJson(res, 429, { error: 'Слишком много запросов. Лимит: 3 заявки за 10 минут.' });
      }

      try {
        const body = await readJsonBody(req);

        // Honeypot: скрытое поле заполнено ботом (тихий сброс)
        if (body.website) {
          return replyJson(res, 200, {
            success: true,
            ok: true,
            id: randomUUID(),
            mode: 'local',
            message: 'Заявка принята.'
          });
        }

        const name = sanitizeString(body.name);
        const phone = String(body.phone || '').replace(/\D/g, '');

        if (name.length < 2 || name.length > 80) {
          return replyJson(res, 400, { error: 'Имя должно содержать от 2 до 80 символов.' });
        }
        if (!/^[78]\d{10}$/.test(phone)) {
          return replyJson(res, 400, { error: 'Некорректный номер телефона (+7XXXXXXXXXX).' });
        }
        if (body.consent !== true) {
          return replyJson(res, 400, { error: 'Необходимо подтвердить согласие на обработку данных.' });
        }

        const normalizedPhone = '+7' + phone.slice(1);
        const topic = sanitizeString(body.topic || 'Консультация');
        const apartmentId = body.apartmentId ? sanitizeString(body.apartmentId) : undefined;

        const result = await adapter.createLead({
          name,
          phone: normalizedPhone,
          topic,
          apartmentId
        });

        const id = result.id || result.leadId || randomUUID();
        const responseDto = {
          success: Boolean(result.success),
          id,
          leadId: id,
          mode: result.mode || (adapter.isConfigured() ? 'crm' : 'local'),
          message: result.message || 'Заявка успешно зарегистрирована.'
        };

        // В локальном режиме сохраняем в .local/leads.ndjson для надежности
        if (result.success && responseDto.mode === 'local') {
          try {
            const localFile = resolve('.local/leads.ndjson');
            await mkdir(dirname(localFile), { recursive: true });
            await appendFile(
              localFile,
              JSON.stringify({
                id,
                name,
                phone: normalizedPhone,
                topic,
                apartmentId,
                consent: true,
                createdAt: new Date().toISOString()
              }) + '\n',
              { encoding: 'utf8', mode: 0o600 }
            );
          } catch {
            // Local disk fallback silently handled
          }
        }

        return replyJson(res, result.success ? 201 : 502, responseDto);
      } catch (err) {
        if (err.code === 413) return replyJson(res, 413, { error: 'Запрос превышает 8 КБ.' });
        return replyJson(res, 400, { error: 'Некорректный JSON запрос.' });
      }
    }

    // Маршрут: POST /api/booking
    if (path === '/api/booking') {
      if (req.method !== 'POST') return replyJson(res, 405, { error: 'Метод не поддерживается.' });

      const ip = getClientIp(req);
      if (!bookingLimiter.isAllowed(ip)) {
        return replyJson(res, 429, { error: 'Слишком много запросов на бронирование. Попробуйте позднее.' });
      }

      try {
        const body = await readJsonBody(req);

        if (body.website) {
          return replyJson(res, 200, {
            success: true,
            ok: true,
            bookingId: randomUUID(),
            mode: 'local',
            message: 'Бронь принята.'
          });
        }

        const name = sanitizeString(body.name);
        const phone = String(body.phone || '').replace(/\D/g, '');

        if (name.length < 2 || name.length > 80) {
          return replyJson(res, 400, { error: 'Имя должно содержать от 2 до 80 символов.' });
        }
        if (!/^[78]\d{10}$/.test(phone)) {
          return replyJson(res, 400, { error: 'Некорректный номер телефона.' });
        }
        if (body.consent !== true) {
          return replyJson(res, 400, { error: 'Необходимо согласие на обработку данных.' });
        }

        const normalizedPhone = '+7' + phone.slice(1);
        const apartmentId = body.apartmentId ? sanitizeString(body.apartmentId) : undefined;
        const apartmentNumber = body.apartmentNumber ? sanitizeString(body.apartmentNumber) : undefined;

        const result = await adapter.createBooking({
          name,
          phone: normalizedPhone,
          apartmentId,
          apartmentNumber
        });

        const bookingId = result.bookingId || randomUUID();
        const responseDto = {
          success: Boolean(result.success),
          bookingId,
          id: bookingId,
          mode: result.mode || (adapter.isConfigured() ? 'crm' : 'local'),
          message: result.message || 'Квартира успешно забронирована на предварительную консультацию.'
        };

        return replyJson(res, result.success ? 201 : 502, responseDto);
      } catch (err) {
        if (err.code === 413) return replyJson(res, 413, { error: 'Запрос превышает 8 КБ.' });
        return replyJson(res, 400, { error: 'Некорректный JSON запрос.' });
      }
    }

    return next?.();
  };
}

