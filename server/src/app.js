import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import booksRouter from './routes/books.js';
import requestsRouter from './routes/requests.js';
import { CLIENT_DIST, UPLOADS_DIR } from './config.js';
import { BOOK_STATUSES, EXCHANGE_PREFERENCES, GENRES, OWNERS, REQUEST_STATUSES, REQUEST_TYPES } from './constants.js';
import { HttpError } from './http.js';
import { MAX_UPLOAD_MB, UploadError } from './upload.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Uploaded cover images, e.g. /uploads/1712345678-ab12cd.jpg
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', fallthrough: false }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Lists the UI needs (mock owners, categories, ...). Not stored in the database.
  app.get('/api/meta', (req, res) => {
    res.json({
      owners: OWNERS,
      genres: GENRES,
      exchangePreferences: EXCHANGE_PREFERENCES,
      bookStatuses: BOOK_STATUSES,
      requestTypes: REQUEST_TYPES,
      requestStatuses: REQUEST_STATUSES,
      maxUploadMb: MAX_UPLOAD_MB,
    });
  });

  app.use('/api/books', booksRouter);
  app.use('/api/requests', requestsRouter);
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

  // `npm start` serves the built React app from the same server.
  if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*path}', (req, res) => {
      // A missing file (e.g. a cover image not downloaded yet) is a real 404,
      // so the browser shows the fallback cover instead of receiving HTML.
      if (path.extname(req.path)) return res.status(404).json({ error: 'File not found.' });
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  // Central error handler: friendly JSON messages, never stack traces.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    if (err instanceof UploadError) {
      return res.status(400).json({ error: err.message, details: { coverImage: err.message } });
    }
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `Cover image must be smaller than ${MAX_UPLOAD_MB} MB.`
        : 'The uploaded file could not be processed.';
      return res.status(400).json({ error: message, details: { coverImage: message } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'The request body is not valid JSON.' });
    }
    if (err.status === 404 || err.statusCode === 404) {
      return res.status(404).json({ error: 'File not found.' });
    }
    if (/constraint failed/i.test(err.message ?? '')) {
      return res.status(409).json({ error: 'That change conflicts with existing data. Please refresh and try again.' });
    }
    console.error('[server] Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
  });

  return app;
}
