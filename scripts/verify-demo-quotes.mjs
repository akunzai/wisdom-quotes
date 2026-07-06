import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'public/demo-quotes.json'), 'utf8'));

if (!raw || typeof raw !== 'object') {
  console.error('demo-quotes.json: root must be an object');
  process.exit(1);
}

if (!Array.isArray(raw.quotes) || raw.quotes.length < 50) {
  console.error(`demo-quotes.json: expected >= 50 quotes, got ${raw.quotes?.length ?? 0}`);
  process.exit(1);
}

for (const [index, quote] of raw.quotes.entries()) {
  if (!quote?.id || !quote?.text || !quote?.createdAt || !quote?.updatedAt) {
    console.error(`demo-quotes.json: quote[${index}] missing required fields`);
    process.exit(1);
  }
}

console.log(`demo-quotes.json OK (${raw.quotes.length} quotes)`);