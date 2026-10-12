// Unit tests for the image checks used by `npm run covers:download`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageInfo, rejectReason } from '../scripts/download-covers.js';

function jpeg(width, height, { complete = true, padding = 2000 } = {}) {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03]);
  const parts = [Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14), sof, Buffer.alloc(padding, 0x55)];
  if (complete) parts.push(Buffer.from([0xff, 0xd9]));
  return Buffer.concat(parts);
}

function png(width, height) {
  const header = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const size = Buffer.alloc(8);
  size.writeUInt32BE(width, 0);
  size.writeUInt32BE(height, 4);
  return Buffer.concat([header, size, Buffer.alloc(600, 1), Buffer.from('IEND')]);
}

test('reads JPEG and PNG dimensions', () => {
  assert.deepEqual(imageInfo(jpeg(300, 450)), { type: 'jpeg', width: 300, height: 450 });
  assert.deepEqual(imageInfo(png(260, 400)), { type: 'png', width: 260, height: 400 });
  assert.equal(imageInfo(Buffer.from('<html>Not found</html>')), null);
});

test('accepts real covers and rejects everything else', () => {
  assert.equal(rejectReason(jpeg(300, 450)), null);
  assert.equal(rejectReason(png(260, 400)), null);
  assert.match(rejectReason(Buffer.alloc(0)), /too small/);
  assert.match(rejectReason(Buffer.from(`<!doctype html>${' '.repeat(2000)}`)), /not a JPEG or PNG/);
  assert.match(rejectReason(jpeg(1, 1)), /placeholder/);
  assert.match(rejectReason(jpeg(300, 450, { complete: false })), /cut off/);
});
