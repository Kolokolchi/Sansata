/**
 * Серверный Rate Limiter в оперативной памяти.
 * Ограничивает количество запросов на IP-адрес за заданное временное окно.
 */
export class RateLimiter {
  constructor(maxRequests = 3, windowMs = 10 * 60 * 1000, maxEntries = 10000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxEntries = maxEntries;
    this.buckets = new Map();

    // Proactive background cleanup every 60s, unref'd so it doesn't hold event loop open
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(Date.now()), 60000);
      timer?.unref?.();
    }
  }

  /**
   * Проверяет, разрешен ли запрос для данного IP (возвращает boolean).
   */
  isAllowed(ip) {
    const now = Date.now();

    const bucket = this.buckets.get(ip);
    if (!bucket || now > bucket.resetTime) {
      if (this.buckets.size >= this.maxEntries) {
        this.cleanup(now);
        // If still full after cleanup, evict oldest entry (FIFO)
        if (this.buckets.size >= this.maxEntries) {
          const oldestKey = this.buckets.keys().next().value;
          if (oldestKey !== undefined) this.buckets.delete(oldestKey);
        }
      }
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
   * Возвращает оставшееся время ожидания в секундах для заголовка Retry-After.
   */
  getRetryAfter(ip) {
    const bucket = this.buckets.get(ip);
    if (!bucket) return 0;
    const now = Date.now();
    return Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
  }

  /**
   * Очищает просроченные записи из памяти.
   */
  cleanup(now) {
    for (const [ip, bucket] of this.buckets) {
      if (now > bucket.resetTime) {
        this.buckets.delete(ip);
      }
    }
  }
}

