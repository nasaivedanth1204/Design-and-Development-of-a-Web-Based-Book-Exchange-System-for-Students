// Deletes the SQLite database and uploaded covers. The next server start
// recreates the tables and the sample books automatically.
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, PORT, UPLOADS_DIR } from '../src/config.js';

// The running server keeps the database in memory and would write the old
// data straight back on its next save, so it must be stopped first.
const serverRunning = await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(1500) })
  .then((response) => response.ok)
  .catch(() => false);

if (serverRunning) {
  console.error(`✖ The server is still running on port ${PORT}.`);
  console.error('  Stop it first (press Ctrl + C in the terminal running "npm run dev"), then run "npm run reset-db" again.');
  process.exit(1);
}

for (const file of [DB_PATH, `${DB_PATH}.tmp`]) fs.rmSync(file, { force: true });

let removed = 0;
if (fs.existsSync(UPLOADS_DIR)) {
  for (const name of fs.readdirSync(UPLOADS_DIR)) {
    if (name === '.gitkeep') continue;
    fs.rmSync(path.join(UPLOADS_DIR, name), { force: true, recursive: true });
    removed += 1;
  }
}

console.log(`✔ Removed ${DB_PATH}`);
console.log(`✔ Removed ${removed} uploaded cover image(s)`);
console.log('  Run "npm run dev" — the database and sample books will be recreated.');
