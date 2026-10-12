import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';
import { DB_PATH } from './config.js';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase } from './seed.js';

/*
 * SQLite access layer.
 *
 * We use sql.js — the official SQLite engine compiled to WebAssembly — so that
 * `npm install` never needs a C++ compiler or a separate database application.
 * The database is loaded from server/data/books.db at startup, and every
 * successful write is saved straight back to that same file, so all data
 * survives page refreshes and server restarts.
 */

const require = createRequire(import.meta.url);

// PRAGMA user_version is a free integer slot in the SQLite file header.
// We set it to 1 once the sample books are inserted, so seeding happens
// exactly once — even if every sample book is later deleted.
const SEEDED_VERSION = 1;

let db = null;
let inTransaction = false;

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  });

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const fileExists = fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 0;

  try {
    db = fileExists ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
    enableForeignKeys();
    db.exec(SCHEMA_SQL);
  } catch (error) {
    throw new Error(
      `The database file at ${DB_PATH} could not be opened (${error.message}). ` +
        'Run "npm run reset-db" to recreate it with fresh sample data.',
    );
  }

  const { user_version: version } = get('PRAGMA user_version');
  let seeded = false;
  if (version < SEEDED_VERSION) {
    transaction(() => {
      seedDatabase({ run, get });
      db.exec(`PRAGMA user_version = ${SEEDED_VERSION}`);
    });
    seeded = true;
  } else {
    save(); // makes sure the schema (e.g. a newly added index) is on disk
  }

  const { count } = get('SELECT COUNT(*) AS count FROM Books');
  return { path: DB_PATH, created: !fileExists, seeded, bookCount: count };
}

function enableForeignKeys() {
  // SQLite leaves foreign-key enforcement OFF unless asked, per connection.
  db.exec('PRAGMA foreign_keys = ON');
}

/** Writes the in-memory database to disk (temp file + rename = no half-written file). */
function save() {
  const data = db.export();
  // sql.js re-opens the connection during export(), which resets PRAGMAs.
  enableForeignKeys();

  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, data);
  try {
    fs.renameSync(tempPath, DB_PATH);
  } catch {
    // Some Windows antivirus tools briefly lock files; fall back to a direct write.
    fs.writeFileSync(DB_PATH, data);
    fs.rmSync(tempPath, { force: true });
  }
}

// sql.js only accepts null (not undefined) for SQL NULL.
const toParams = (params) => params.map((value) => (value === undefined ? null : value));

/** Runs a SELECT and returns every row as a plain object. Always parameterized. */
export function all(sql, params = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(toParams(params));
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

/** Runs a SELECT and returns the first row, or null. */
export function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

/** Runs an INSERT / UPDATE / DELETE and saves the database file. */
export function run(sql, params = []) {
  db.run(sql, toParams(params));
  const changes = db.getRowsModified();
  const { id } = get('SELECT last_insert_rowid() AS id');
  if (!inTransaction) save();
  return { changes, lastInsertRowid: id };
}

/** Runs several statements atomically: either all of them are saved or none are. */
export function transaction(work) {
  if (inTransaction) return work();
  db.exec('BEGIN');
  inTransaction = true;
  try {
    const result = work();
    db.exec('COMMIT');
    inTransaction = false;
    save();
    return result;
  } catch (error) {
    inTransaction = false;
    db.exec('ROLLBACK');
    throw error;
  }
}

export function nowIso() {
  return new Date().toISOString();
}
