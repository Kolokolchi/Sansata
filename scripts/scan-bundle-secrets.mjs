import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const SUSPICIOUS_PATTERNS = [
  {
    name: 'Bitrix Webhook URL with Secret Token',
    regex: /https?:\/\/[a-zA-Z0-9.-]+\.bitrix24\.[a-z]+\/rest\/[0-9]+\/[a-zA-Z0-9_-]{10,}/i
  },
  {
    name: 'Exposed CRM Secret Key / Token',
    regex: /(?:webhook_token|crm_secret|b24_token|bitrix_key)[\s:=]+['"][a-zA-Z0-9_\-]{16,}['"]/i
  },
  {
    name: 'Internal CRM Userfield Leak',
    regex: /UF_CRM_[0-9]+/i
  }
];

async function scanDirectory(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Директория ${dir} отсутствует. Запустите сначала 'npm run build'.`);
      return false;
    }
    throw err;
  }

  let foundLeak = false;

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await scanDirectory(fullPath);
      if (nested) foundLeak = true;
    } else if (['.js', '.html', '.json', '.css'].includes(extname(entry.name))) {
      const content = await readFile(fullPath, 'utf8');
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(`❌ [SECURITY ALERT] Обнаружен возможный секрет в ${fullPath}: совпадение "${pattern.name}"`);
          foundLeak = true;
        }
      }
    }
  }

  return foundLeak;
}

console.log('🔍 Запуск сканирования клиентского бандла на утечки секретов CRM...');
const targetDir = resolve('dist');
const hasLeaks = await scanDirectory(targetDir);

if (hasLeaks) {
  console.error('\n❌ Сканирование безопасности НЕ пройдено: обнаружены подозрительные секреты или токены в бандле!');
  process.exit(1);
} else {
  console.log('\n✅ Сканирование завершено: секретов CRM и внутренних идентификаторов Bitrix24 в бандле не обнаружено.');
  process.exit(0);
}
