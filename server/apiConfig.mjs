/** Local API policy. Keep these values separate from request flow and DTO mapping. */
const BYTES_PER_KIB = 1024;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const BODY_LIMIT_KIB = 8;
const SUBMISSION_WINDOW_MINUTES = 10;

export const API_CONFIG = Object.freeze({
  bodyLimitKib: BODY_LIMIT_KIB,
  bodyLimitBytes: BODY_LIMIT_KIB * BYTES_PER_KIB,
  receivedRequestTtlMs: 60 * MILLISECONDS_PER_MINUTE,
  maxReceivedRequests: 10000,
  leadRequestsPerWindow: 3,
  bookingRequestsPerWindow: 3,
  submissionWindowMinutes: SUBMISSION_WINDOW_MINUTES,
  submissionWindowMs: SUBMISSION_WINDOW_MINUTES * MILLISECONDS_PER_MINUTE,
  statusRequestsPerWindow: 60,
  statusWindowMs: MILLISECONDS_PER_MINUTE,
  corsMaxAgeSeconds: 24 * 60 * 60,
  localFileMode: 0o600,
  localLeadFile: '.local/leads.ndjson',
  localBookingFile: '.local/bookings.ndjson'
});

export const API_PATHS = Object.freeze({
  statuses: '/api/apartments/status',
  leads: '/api/leads',
  booking: '/api/booking'
});

export const HTTP_STATUS = Object.freeze({
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  forbidden: 403,
  methodNotAllowed: 405,
  conflict: 409,
  payloadTooLarge: 413,
  unsupportedMediaType: 415,
  tooManyRequests: 429,
  badGateway: 502
});
