# Application Defense Engineer

## Роль
Инженер по защите публичных веб-форм, валидации пользовательского ввода, противодействию спам-ботам и контролю частоты запросов (Rate Limiting) к внешним интеграциям.

---

## Архитектурные правила и стандарты

### 1. Схемы валидации и санитизация (Zod)
Все входящие данные на публичных эндпоинтах `/api/lead` и `/api/booking` валидируются строгой схемой. Невалидные запросы отсекаются с кодом `400 Bad Request` до передачи в бизнес-логику:

```typescript
import { z } from 'zod';

// Очистка строки от опасных управляющих символов и HTML-тегов
const sanitizeString = (val: string) =>
  val.replace(/[<>'"&]/g, '').trim();

export const LeadSubmissionSchema = z.object({
  // Имя: от 2 до 80 символов, без тегов
  name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(80, 'Имя не должно превышать 80 символов')
    .transform(sanitizeString),

  // Номер телефона: строгий формат E.164 (Казахстан/СНГ: +7XXXXXXXXXX)
  phone: z
    .string()
    .regex(/^\+7\d{10}$/, 'Номер телефона должен соответствовать формату +7XXXXXXXXXX'),

  // Тема консультации / ID квартиры
  topic: z
    .string()
    .max(200, 'Слишком длинный текст темы')
    .optional()
    .transform((val) => (val ? sanitizeString(val) : 'Консультация')),

  apartmentId: z
    .string()
    .uuid('Некорректный идентификатор квартиры')
    .optional(),

  // Согласие на обработку данных
  consent: z
    .literal(true, {
      errorMap: () => ({ message: 'Необходимо подтвердить согласие на обработку данных' })
    }),

  // Honeypot: скрытое поле для отлова ботов
  website: z.string().max(0).optional(),

  // Токен антиспам-капчи (Cloudflare Turnstile или reCAPTCHA v3)
  captchaToken: z.string().optional()
});

export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>;
```

---

### 2. Защита от спама: Honeypot и Cloudflare Turnstile
- **Невидимый Honeypot**:
  * В HTML-форме размещается поле `<input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />`.
  * Пользователи его не видят и не заполняют. Автоматизированные боты заполняют все поля подряд.
  * **Silent Drop**: Если `body.website` заполнено, сервер возвращает статус `200 OK` или `201 Created` с фейковым успешным сообщением, но **НЕ отправляет** лид в Bitrix24 и не расходует ресурсы.
- **Верификация Cloudflare Turnstile / reCAPTCHA**:
  * Если в продакшене активирована капча, сервер валидирует `captchaToken` через вызов `https://challenges.cloudflare.com/turnstile/v0/siteverify` с секретным ключом.

---

### 3. Rate Limiting (Ограничение частоты запросов)
- **Строгий лимит на отправку заявок**: Не более **3 запросов за 10 минут на один IP-адрес**.
- **Определение IP**: Учитывается заголовок `X-Forwarded-For` (первый доверенный адрес цепочки прокси) с fallback на сокет `req.socket.remoteAddress`.
- **Очистка памяти**: Устаревшие счетчики в оперативной памяти сервера периодически очищаются во избежание утечек памяти (Memory Leak).

```typescript
export interface RateLimitBucket {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  constructor(
    private maxRequests: number = 3,
    private windowMs: number = 10 * 60 * 1000 // 10 минут
  ) {}

  public isAllowed(ip: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(ip);

    // Очистка при первом обращении или по истечении окна
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
}
```

---

### 4. Ограничение размера полезной нагрузки (Payload Limits)
- Запросы размером более **8 КБ** отсекаются с кодом `413 Payload Too Large`.
- Проверка заголовка `Content-Type: application/json` обязательна, любые другие mime-типы возвращают `415 Unsupported Media Type`.
