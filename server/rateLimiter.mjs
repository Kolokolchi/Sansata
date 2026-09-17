/**
 * Серверный Rate Limiter в оперативной памяти.
 * Ограничивает количество запросов на IP-адрес за заданное временное окно.
 */
export class RateLimiter {
  constructor(maxRequests = 3, windowMs = 10 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  /**
   * Проверяет, разрешен ли запрос для данного IP
   */
  isAllowed(ip) {
    const now = Date.now();
    this.cleanup(now);

    const bucket = this.buckets.get(ip);
    if (!bucket || now > bucket.resetTime) {
      this.buckets.set(ip, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (bucket.count >= this.maxRequests) {
      return false;
    }

    bucket.count += 1;
    return true;
  }

  /**
   * Очищает просроченные записи из памяти
   */
  cleanup(now) {
    if (this.buckets.size > 5000) {
      for (const [ip, bucket] of this.buckets) {
        if (now > bucket.resetTime) {
          this.buckets.delete(ip);
        }
      }
    }
  }
}
