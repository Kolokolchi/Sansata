import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { BitrixAdapter } from './bitrixAdapter.mjs';
import { StatusCache } from './statusCache.mjs';
import { RateLimiter } from './rateLimiter.mjs';
import { getClientIp, validateLead, validateBooking } from './leads.mjs';
import { API_CONFIG, API_PATHS, HTTP_STATUS } from './apiConfig.mjs';

const JSON_RESPONSE_HEADERS = Object.freeze({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
});
const REQUEST_BASE_URL = 'http://localhost';
const LOCAL_ORIGIN_HOSTS = new Set(['localhost', '127.0.0.1']);
const JSON_MEDIA_TYPE = 'application/json';
const FORBIDDEN_JSON_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);
const ALLOWED_METHODS = 'GET, POST, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, X-Request-ID';
const METHOD = Object.freeze({ get: 'GET', post: 'POST', options: 'OPTIONS' });
const ALLOW = Object.freeze({ status: 'GET, OPTIONS', submission: 'POST, OPTIONS' });
const SUCCESS_MODE = Object.freeze({ crm: 'crm', local: 'local' });
const REQUEST_KIND = Object.freeze({ lead: 'lead', booking: 'booking' });
const SOLD_STATUS = 'sold';
const FINGERPRINT_ALGORITHM = 'sha256';
const TEXT_ENCODING = 'utf8';
const MESSAGES = Object.freeze({
  invalidOrigin: 'Недопустимый источник запроса (CORS).',
  invalidMethod: 'Метод не поддерживается.',
  invalidContentType: 'Требуется Content-Type: application/json.',
  invalidJson: 'Некорректный JSON запрос.',
  oversizedBody: `Запрос превышает ${API_CONFIG.bodyLimitKib} КБ.`,
  duplicateId: 'Идентификатор запроса уже использован для другой заявки.',
  statusRateLimit: 'Слишком много запросов статусов.',
  leadRateLimit: `Слишком много запросов. Лимит: ${API_CONFIG.leadRequestsPerWindow} заявки за ${API_CONFIG.submissionWindowMinutes} минут.`,
  bookingRateLimit: 'Слишком много запросов на бронирование. Попробуйте позднее.',
  soldApartment: 'Данная квартира уже продана.',
  leadAccepted: 'Заявка принята.',
  bookingAccepted: 'Бронь принята.',
  leadCreated: 'Заявка успешно зарегистрирована.',
  leadStored: 'Заявка сохранена на локальном сервере.',
  bookingCreated: 'Запрос на консультацию зарегистрирован.',
  leadFailed: 'Не удалось зарегистрировать заявку.',
  bookingFailed: 'Не удалось зарегистрировать запрос.',
  leadStoreFailed: 'Не удалось сохранить заявку. Попробуйте позже.',
  bookingStoreFailed: 'Не удалось сохранить запрос. Попробуйте позже.'
});
const INTERNAL_ERRORS = Object.freeze({
  emptyPayload: 'Empty payload',
  invalidPayload: 'Invalid JSON payload',
  prototypePollution: 'Prototype pollution attempt',
  oversizedPayload: 'Payload Too Large'
});

function replyJson(res, code, body, extraHeaders = {}) {
  res.statusCode = code;
  for (const [name, value] of Object.entries(JSON_RESPONSE_HEADERS)) res.setHeader(name, value);

  for (const [k, v] of Object.entries(extraHeaders)) {
    if (v) res.setHeader(k, v);
  }

  res.end(JSON.stringify(body));
}

function invalidPayload(message, code = HTTP_STATUS.badRequest) {
  return Object.assign(new Error(message), { code });
}

/** Pure JSON shape validation, separate from stream I/O. */
function parseJsonObject(raw) {
  if (!raw.trim()) throw invalidPayload(INTERNAL_ERRORS.emptyPayload);
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw invalidPayload(INTERNAL_ERRORS.invalidPayload);
  }
  if (FORBIDDEN_JSON_KEYS.some((key) => Object.hasOwn(parsed, key))) {
    throw invalidPayload(INTERNAL_ERRORS.prototypePollution);
  }
  return parsed;
}

async function readJsonBody(req, limitBytes = API_CONFIG.bodyLimitBytes) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > limitBytes) {
      throw invalidPayload(INTERNAL_ERRORS.oversizedPayload, HTTP_STATUS.payloadTooLarge);
    }
    chunks.push(chunk);
  }

  return parseJsonObject(Buffer.concat(chunks).toString(TEXT_ENCODING));
}

/**
 * Проверяет происхождение запроса (CORS / CSRF)
 */
function checkOrigin(origin, reqHost, allowedOrigin) {
  if (!origin) return true;

  if (allowedOrigin && origin === allowedOrigin) return true;

  try {
    const parsedOrigin = new URL(origin);
    const originHost = parsedOrigin.host;
    if (originHost === reqHost) return true;

    // Локальное окружение / тесты: localhost и 127.0.0.1
    const originHostname = parsedOrigin.hostname;
    const reqHostname = reqHost?.split(':')[0];
    if (
      LOCAL_ORIGIN_HOSTS.has(originHostname) &&
      LOCAL_ORIGIN_HOSTS.has(reqHostname)
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function applyCorsHeaders(res, origin) {
  if (!origin) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', String(API_CONFIG.corsMaxAgeSeconds));
  res.setHeader('Vary', 'Origin');
}

function rejectMethod(res, allowed) {
  res.setHeader('Allow', allowed);
  return replyJson(res, HTTP_STATUS.methodNotAllowed, { error: MESSAGES.invalidMethod });
}

function rejectRateLimit(res, limiter, ip, message) {
  return replyJson(res, HTTP_STATUS.tooManyRequests, { error: message }, {
    'Retry-After': String(limiter.getRetryAfter(ip))
  });
}

function isSold(statuses, apartmentId) {
  return !!apartmentId && statuses?.[apartmentId.toLowerCase()] === SOLD_STATUS;
}

/** Pure request identity helpers. Both routes share the same validation result shape. */
function requestFingerprint(value) {
  const { createdAt, ...identity } = value;
  return createHash(FINGERPRINT_ALGORITHM).update(JSON.stringify(identity)).digest('hex');
}

function requestCacheKey(kind, ip, requestId) {
  if (!requestId) return '';
  return kind === REQUEST_KIND.booking ? `booking:${ip}:${requestId}` : `${ip}:${requestId}`;
}

function isJsonRequest(req) {
  const contentType = req.headers['content-type'] || '';
  return !contentType || contentType.includes(JSON_MEDIA_TYPE);
}

function honeypotReceipt(kind, id) {
  return kind === REQUEST_KIND.lead
    ? { success: true, ok: true, id, mode: SUCCESS_MODE.local, message: MESSAGES.leadAccepted }
    : { success: true, ok: true, bookingId: id, mode: SUCCESS_MODE.local, message: MESSAGES.bookingAccepted };
}

function publicReceipt(kind, id, mode) {
  return kind === REQUEST_KIND.lead
    ? { success: true, id, leadId: id, mode, message: mode === SUCCESS_MODE.crm ? MESSAGES.leadCreated : MESSAGES.leadStored }
    : { success: true, bookingId: id, id, mode, message: MESSAGES.bookingCreated };
}

function localRecord(kind, id, data) {
  return kind === REQUEST_KIND.lead
    ? { id, name: data.name, phone: data.phone, topic: data.topic, apartmentId: data.apartmentId, consent: true, createdAt: data.createdAt }
    : { bookingId: id, name: data.name, phone: data.phone, apartmentId: data.apartmentId, apartmentNumber: data.apartmentNumber, consent: true, createdAt: data.createdAt };
}

function adapterInput(kind, data) {
  return kind === REQUEST_KIND.lead
    ? { name: data.name, phone: data.phone, topic: data.topic, apartmentId: data.apartmentId }
    : { name: data.name, phone: data.phone, apartmentId: data.apartmentId, apartmentNumber: data.apartmentNumber };
}

function localFile(kind) {
  return resolve(kind === REQUEST_KIND.lead ? API_CONFIG.localLeadFile : API_CONFIG.localBookingFile);
}

async function appendLocalRecord(file, record) {
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, { encoding: TEXT_ENCODING, mode: API_CONFIG.localFileMode });
}

export const MAX_RECEIVED_REQUESTS = API_CONFIG.maxReceivedRequests;

/**
 * Единый защищенный маршрутизатор API (BFF)
 */
export function createApiRouter({
  adapter = new BitrixAdapter(),
  statusCache = new StatusCache(),
  leadLimiter = new RateLimiter(API_CONFIG.leadRequestsPerWindow, API_CONFIG.submissionWindowMs),
  bookingLimiter = new RateLimiter(API_CONFIG.bookingRequestsPerWindow, API_CONFIG.submissionWindowMs),
  statusLimiter = new RateLimiter(API_CONFIG.statusRequestsPerWindow, API_CONFIG.statusWindowMs),
  maxReceivedRequests = MAX_RECEIVED_REQUESTS
} = {}) {
  // Normal insertions are time ordered. Map keeps O(1) average key lookup and
  // FIFO capacity eviction without a second queue or heap.
  const receivedRequests = new Map();
  const submissionPolicies = {
    [REQUEST_KIND.lead]: {
      limiter: leadLimiter,
      validate: validateLead,
      rateMessage: MESSAGES.leadRateLimit
    },
    [REQUEST_KIND.booking]: {
      limiter: bookingLimiter,
      validate: validateBooking,
      rateMessage: MESSAGES.bookingRateLimit
    }
  };

  function cleanReceivedRequests() {
    const expiryBoundary = Date.now() - API_CONFIG.receivedRequestTtlMs;
    for (const [key, item] of receivedRequests) {
      if (item.time < expiryBoundary) receivedRequests.delete(key);
    }
  }

  function pruneOldestReceivedRequests() {
    const expiryBoundary = Date.now() - API_CONFIG.receivedRequestTtlMs;
    for (const [key, item] of receivedRequests) {
      if (item.time >= expiryBoundary) break;
      receivedRequests.delete(key);
    }
  }

  function saveReceivedRequest(key, item) {
    if (!key) return;
    if (receivedRequests.size >= maxReceivedRequests) {
      const oldestKey = receivedRequests.keys().next().value;
      if (oldestKey !== undefined) receivedRequests.delete(oldestKey);
    }
    receivedRequests.set(key, item);
  }

  async function executeSubmission(kind, data) {
    const failureMessage = kind === REQUEST_KIND.lead ? MESSAGES.leadFailed : MESSAGES.bookingFailed;
    let result;
    try {
      const input = adapterInput(kind, data);
      result = kind === REQUEST_KIND.lead
        ? await adapter.createLead(input)
        : await adapter.createBooking(input);
    } catch {
      return { success: false, message: failureMessage };
    }
    if (!result?.success) return { success: false, message: failureMessage };

    // Adapter identifiers may be internal CRM IDs; only expose a new public UUID.
    const id = randomUUID();
    const mode = adapter.isConfigured() ? SUCCESS_MODE.crm : SUCCESS_MODE.local;
    const receipt = publicReceipt(kind, id, mode);
    if (mode === SUCCESS_MODE.local) {
      try {
        await appendLocalRecord(localFile(kind), localRecord(kind, id, data));
      } catch {
        const message = kind === REQUEST_KIND.lead ? MESSAGES.leadStoreFailed : MESSAGES.bookingStoreFailed;
        return { success: false, message };
      }
    }
    return receipt;
  }

  async function processIdempotentSubmission(kind, ip, requestId, data) {
    const key = requestCacheKey(kind, ip, requestId);
    const fingerprint = key ? requestFingerprint(data) : '';
    pruneOldestReceivedRequests();

    let existing = key ? receivedRequests.get(key) : undefined;
    if (existing && Date.now() - existing.time > API_CONFIG.receivedRequestTtlMs) {
      receivedRequests.delete(key);
      existing = undefined;
    }
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        return { status: HTTP_STATUS.conflict, body: { error: MESSAGES.duplicateId } };
      }
      const body = await existing.result;
      return { status: body.success ? HTTP_STATUS.ok : HTTP_STATUS.badGateway, body };
    }

    const resultPromise = executeSubmission(kind, data);
    if (key) saveReceivedRequest(key, { time: Date.now(), fingerprint, result: resultPromise });
    const body = await resultPromise;
    if (!body.success && key) receivedRequests.delete(key);
    return { status: body.success ? HTTP_STATUS.created : HTTP_STATUS.badGateway, body };
  }

  async function handleStatus(req, res) {
    if (req.method !== METHOD.get) return rejectMethod(res, ALLOW.status);
    const ip = getClientIp(req);
    if (!statusLimiter.isAllowed(ip)) {
      return rejectRateLimit(res, statusLimiter, ip, MESSAGES.statusRateLimit);
    }
    return replyJson(res, HTTP_STATUS.ok, await statusCache.getStatuses(adapter));
  }

  async function handleSubmission(req, res, kind) {
    if (req.method !== METHOD.post) return rejectMethod(res, ALLOW.submission);
    const policy = submissionPolicies[kind];
    const ip = getClientIp(req);
    if (!policy.limiter.isAllowed(ip)) {
      return rejectRateLimit(res, policy.limiter, ip, policy.rateMessage);
    }

    try {
      if (!isJsonRequest(req)) {
        return replyJson(res, HTTP_STATUS.unsupportedMediaType, { error: MESSAGES.invalidContentType });
      }
      const body = await readJsonBody(req);
      if (body.website) return replyJson(res, HTTP_STATUS.ok, honeypotReceipt(kind, randomUUID()));

      const validation = policy.validate(body);
      if (validation.error) return replyJson(res, HTTP_STATUS.badRequest, { error: validation.error });
      const data = validation.value;

      if (kind === REQUEST_KIND.booking && data.apartmentId) {
        const statuses = await statusCache.getStatuses(adapter);
        if (isSold(statuses.statuses, data.apartmentId)) {
          return replyJson(res, HTTP_STATUS.conflict, { error: MESSAGES.soldApartment });
        }
      }

      const outcome = await processIdempotentSubmission(kind, ip, body.requestId, data);
      return replyJson(res, outcome.status, outcome.body);
    } catch (error) {
      if (error?.code === HTTP_STATUS.payloadTooLarge) {
        return replyJson(res, HTTP_STATUS.payloadTooLarge, { error: MESSAGES.oversizedBody });
      }
      if (error?.code === HTTP_STATUS.unsupportedMediaType) {
        return replyJson(res, HTTP_STATUS.unsupportedMediaType, { error: MESSAGES.invalidContentType });
      }
      return replyJson(res, HTTP_STATUS.badRequest, { error: MESSAGES.invalidJson });
    }
  }

  const apiRouter = async function apiRouter(req, res, next) {
    const path = new URL(req.url || '/', REQUEST_BASE_URL).pathname;
    const origin = req.headers.origin;
    if (!checkOrigin(origin, req.headers.host, process.env.ALLOWED_ORIGIN)) {
      return replyJson(res, HTTP_STATUS.forbidden, { error: MESSAGES.invalidOrigin });
    }
    applyCorsHeaders(res, origin);
    if (req.method === METHOD.options) {
      res.statusCode = HTTP_STATUS.noContent;
      return res.end();
    }

    if (path === API_PATHS.statuses) return handleStatus(req, res);
    if (path === API_PATHS.leads) {
      return handleSubmission(req, res, REQUEST_KIND.lead);
    }
    if (path === API_PATHS.booking) return handleSubmission(req, res, REQUEST_KIND.booking);
    return next?.();
  };

  apiRouter.receivedRequests = receivedRequests;
  apiRouter.maxReceivedRequests = maxReceivedRequests;
  apiRouter.cleanReceivedRequests = cleanReceivedRequests;
  return apiRouter;
}
