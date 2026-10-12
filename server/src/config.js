import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Folder layout:  server/src (code), server/data (SQLite file), server/uploads (cover images)
export const SERVER_ROOT = path.resolve(here, '..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

export const PORT = Number(process.env.PORT) || 4000;

// Environment overrides exist so the automated tests can use a throwaway database.
export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(SERVER_ROOT, 'data', 'books.db');

export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(SERVER_ROOT, 'uploads');

// Downloaded sample covers (npm run covers:download), served at /images/books/<isbn>.jpg
// by Vite in development and from client/dist by Express in production.
export const SEED_COVERS_DIR = process.env.COVERS_DIR
  ? path.resolve(process.env.COVERS_DIR)
  : path.join(PROJECT_ROOT, 'client', 'public', 'images', 'books');

// Built React app, served by Express when you run `npm start`.
export const CLIENT_DIST = path.join(PROJECT_ROOT, 'client', 'dist');
