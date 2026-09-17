# DevSecOps & Secrets Guard

## Роль
Специалист по автоматическому аудиту безопасности кодовой базы, предотвращению утечек конфиденциальных данных, контролю артефактов сборки и защите ключей API от случайной публикации.

---

## Архитектурные правила и стандарты

### 1. Контроль файлов окружения в Git (.gitignore)
- **Полная изоляция конфигурационных файлов**:
  Все файлы с префиксом `.env` обязаны игнорироваться системой контроля версий Git. Единственным исключением является шаблонный файл `.env.example`, содержащий исключительно плейсхолдеры.
- **Стандарт секции `.gitignore`**:
  ```gitignore
  # Изоляция секретов окружения
  .env
  .env.*
  .env.local
  .env.production
  !.env.example
  ```
- **Правило аудита**: Если в репозитории случайно обнаруживается реальный ключ, он считается скомпрометированным и подлежит немедленной ротации в панели Bitrix24/провайдера.

---

### 2. Валидация сборки: Post-Build Secret Scanner
Перед деплоем клиентского бандла обязателен запуск сканирования скомпилированных файлов в папке `dist/`. Скрипт анализирует минифицированные JS/CSS/HTML файлы на наличие опасных паттернов:

```javascript
// scripts/scan-bundle-secrets.mjs
import { readdir, readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const SUSPICIOUS_PATTERNS = [
  { name: 'Bitrix Webhook URL', regex: /https?:\/\/[a-zA-Z0-9.-]+\.bitrix24\.[a-z]+\/rest\/[0-9]+\/[a-zA-Z0-9_-]+/i },
  { name: 'Generic Secret Token', regex: /(?:webhook|secret_key|api_key|token)[\s:=]+['"][a-zA-Z0-9_\-]{16,}['"]/i },
  { name: 'Bitrix Identifier Leaks', regex: /UF_CRM_[0-9]+/i },
  { name: 'Direct B24 Endpoint', regex: /['"][a-zA-Z0-9.-]+\.bitrix24\.[a-z]+['"]/i }
];

export async function scanDirectory(dir = 'dist') {
  const entries = await readdir(dir, { withFileTypes: true });
  let hasLeak = false;

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      const nestedLeak = await scanDirectory(fullPath);
      if (nestedLeak) hasLeak = true;
    } else if (['.js', '.html', '.json'].includes(extname(entry.name))) {
      const content = await readFile(fullPath, 'utf-8');
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(`[SECURITY ALERT] Possible secret leak found in ${entry.name}: matched "${pattern.name}"`);
          hasLeak = true;
        }
      }
    }
  }

  return hasLeak;
}
```

- Интеграция в `package.json`:
  ```json
  {
    "scripts": {
      "build": "tsc && vite build",
      "security:scan": "node scripts/scan-bundle-secrets.mjs",
      "ci": "npm run build && npm run security:scan"
    }
  }
  ```

---

### 3. Регламент работы с секретами
- **Запрет хардкода**: Никаких "временных" токенов в комментариях, коде тестов или фикстурах.
- **Маскирование в тестах**: В мок-тестах использовать строго синтетические токены формата `test_token_placeholder_00000`.
- **Проверка истории коммитов**: Перед выкаткой в продакшн проверяется история git на предмет случайных коммитов с секретами через `git log -S "bitrix24"`.
