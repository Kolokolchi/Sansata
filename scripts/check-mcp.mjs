import { spawn } from 'node:child_process';

// Minimal JSON-RPC stdio probe: no global configuration or browser sessions modified.
const packages = {
  context7: ['@upstash/context7-mcp@latest'],
  playwright: ['@playwright/mcp@latest', '--headless', '--isolated'],
  'chrome-devtools': ['chrome-devtools-mcp@latest', '--headless', '--isolated', '--no-usage-statistics']
};
const name = process.argv[2];
if (!packages[name]) throw new Error('Choose context7, playwright or chrome-devtools');
const child = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npx',
  [...(process.platform === 'win32' ? ['/d', '/c', 'npx'] : []), '-y', ...packages[name]],
  { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
let sequence = 0, buffer = '';
const pending = new Map();
child.stderr.on('data', () => {}); // Package diagnostics may contain connection details.
child.stdout.on('data', chunk => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
    try {
      const message = JSON.parse(line);
      const request = pending.get(message.id);
      if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
    } catch { /* Non-protocol startup output. */ }
  }
});
function rpc(method, params) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 110000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
try {
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sansata-check', version: '1.0.0' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const list = await rpc('tools/list', {});
  console.log(JSON.stringify({ server: name, info: init.serverInfo, tools: list.tools.map(t => ({ name: t.name, ...(process.env.MCP_SCHEMAS === '1' ? { inputSchema: t.inputSchema } : {}) })) }));
  if (process.argv[3]) console.log(JSON.stringify(await rpc('tools/call', { name: process.argv[3], arguments: JSON.parse(process.argv[4] || '{}') })));
} finally {
  child.stdin.end();
  for (const item of pending.values()) clearTimeout(item.timer);
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  else child.kill();
}
