import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSinglePagePdfFromJpegBytes,
  dataUrlToBlob,
  dataUrlToUint8Array,
  isImageDataUrl,
  isPdfDataUrl,
  sanitizePdfFilename,
} from './pdfCertificate';

test('dataUrlToUint8Array and dataUrlToBlob decode base64 PDF data URLs accurately', async () => {
  const sample = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n';
  const base64 = Buffer.from(sample, 'utf8').toString('base64');
  const dataUrl = `data:application/pdf;base64,${base64}`;

  assert.equal(isPdfDataUrl(dataUrl), true);
  assert.equal(isImageDataUrl(dataUrl), false);

  const decoded = dataUrlToUint8Array(dataUrl);
  assert.ok(decoded);
  assert.equal(decoded?.mimeType, 'application/pdf');
  assert.equal(Buffer.from(decoded!.bytes).toString('utf8'), sample);

  const blob = dataUrlToBlob(dataUrl);
  assert.ok(blob);
  assert.equal(blob?.type, 'application/pdf');
  assert.equal(await blob?.text(), sample);
});

test('buildSinglePagePdfFromJpegBytes generates a valid %PDF-1.4 container with xref and %%EOF', () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
  const pdfBytes = buildSinglePagePdfFromJpegBytes(fakeJpeg, 1240, 1754);
  const text = Buffer.from(pdfBytes).toString('latin1');

  assert.ok(text.startsWith('%PDF-1.4\n'));
  assert.ok(text.includes('/Type /XObject /Subtype /Image /Width 1240 /Height 1754'));
  assert.ok(text.includes('/Filter /DCTDecode /Length 8'));
  assert.ok(text.includes('xref\n0 6\n'));
  assert.ok(text.trimEnd().endsWith('%%EOF'));
});

test('sanitizePdfFilename normalizes extensions and unsafe filesystem characters', () => {
  assert.equal(sanitizePdfFilename('KSA License: #12.pdf'), 'KSA-License--#12.pdf');
  assert.equal(sanitizePdfFilename('   '), 'abc-gulf-license.pdf');
});
