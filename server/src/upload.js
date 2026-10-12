import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { UPLOADS_DIR } from './config.js';

// Cover images are stored as files in server/uploads; SQLite only stores the
// relative URL (e.g. "/uploads/1712345678-ab12cd.jpg"), never the image bytes.

export const MAX_UPLOAD_MB = 3;
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${unique}${ALLOWED[file.mimetype]}`);
  },
});

export class UploadError extends Error {}

export const uploadCover = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new UploadError('Cover image must be a JPG, PNG, WEBP or GIF file.'));
  },
}).single('coverFile');

export const publicPathFor = (file) => `/uploads/${file.filename}`;

/**
 * Deletes a previously uploaded cover. Ignores external URLs, seeded
 * /images/ paths and missing files. Returns a promise that resolves once the
 * file is gone (never rejects), so callers can wait for it when it matters.
 */
export function removeUploadedFile(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/')) return Promise.resolve();
  const filePath = path.join(UPLOADS_DIR, path.basename(publicPath));
  return fs.promises.rm(filePath, { force: true }).catch(() => {});
}
