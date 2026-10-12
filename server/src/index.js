import { createApp } from './app.js';
import { initDatabase } from './db.js';
import { PORT, UPLOADS_DIR } from './config.js';

async function main() {
  let info;
  try {
    info = await initDatabase();
  } catch (error) {
    console.error('\n✖ Could not initialise the SQLite database.');
    console.error(`  ${error.message}\n`);
    process.exit(1);
  }

  console.log(`✔ SQLite database ready: ${info.path}`);
  if (info.seeded) console.log(`  First run — created tables and inserted ${info.bookCount} sample books.`);
  else console.log(`  Loaded existing data (${info.bookCount} books).`);
  console.log(`  Cover uploads folder: ${UPLOADS_DIR}`);

  const server = createApp().listen(PORT, () => {
    console.log(`✔ API server running at http://localhost:${PORT}/api`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n✖ Port ${PORT} is already in use.`);
      console.error('  The server may already be running in another terminal — stop it first,');
      console.error('  or start on another port, e.g.  PORT=4001 npm run dev\n');
    } else {
      console.error('\n✖ The server could not start:', error.message);
    }
    process.exit(1);
  });
}

main();
