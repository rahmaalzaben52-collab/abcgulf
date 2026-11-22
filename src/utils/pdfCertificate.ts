import type { LicenseRecord, LicenseRegionMeta } from './siteStore';
import type { Language } from './i18n';

export function isPdfDataUrl(dataUrl?: string | null): boolean {
  return typeof dataUrl === 'string' && /^data:application\/pdf(?:;[^,]*)?,/i.test(dataUrl);
}

export function isImageDataUrl(dataUrl?: string | null): boolean {
  return typeof dataUrl === 'string' && /^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(dataUrl);
}

export function sanitizePdfFilename(rawName: string): string {
  const cleaned = rawName
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');
  return `${cleaned || 'abc-gulf-license'}.pdf`;
}

export function dataUrlToUint8Array(dataUrl: string): { mimeType: string; bytes: Uint8Array } | null {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1 || !dataUrl.startsWith('data:')) return null;

  const header = dataUrl.slice(5, commaIdx);
  const payload = dataUrl.slice(commaIdx + 1);
  const isBase64 = /;base64$/i.test(header) || /;base64;/i.test(header);
  const mimeType = header.split(';')[0] || 'application/octet-stream';

  try {
    if (isBase64) {
      const binaryStr = atob(payload);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return { mimeType, bytes };
    }
    const decoded = decodeURIComponent(payload);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return { mimeType, bytes };
  } catch {
    return null;
  }
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const decoded = dataUrlToUint8Array(dataUrl);
  if (!decoded) return null;
  const copy = new Uint8Array(decoded.bytes.length);
  copy.set(decoded.bytes);
  return new Blob([copy.buffer], { type: decoded.mimeType });
}

/**
 * Wraps raw JPEG bytes into a single-page valid %PDF-1.4 document scaled to A4 portrait (595.28 x 841.89 pt).
 */
export function buildSinglePagePdfFromJpegBytes(
  jpegBytes: Uint8Array,
  imageWidthPx: number,
  imageHeightPx: number,
): Uint8Array {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const safeW = Math.max(1, Math.round(imageWidthPx));
  const safeH = Math.max(1, Math.round(imageHeightPx));

  const contentStream = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  const encoder = new TextEncoder();

  const header = encoder.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const obj1 = encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  const obj2 = encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  const obj3 = encoder.encode(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );

  const obj4Prefix = encoder.encode(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${safeW} /Height ${safeH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  const obj4Suffix = encoder.encode('\nendstream\nendobj\n');

  const obj5Bytes = encoder.encode(contentStream);
  const obj5 = encoder.encode(
    `5 0 obj\n<< /Length ${obj5Bytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
  );

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let cursor = 0;

  const pushChunk = (chunk: Uint8Array) => {
    chunks.push(chunk);
    cursor += chunk.length;
  };

  pushChunk(header);

  offsets.push(cursor);
  pushChunk(obj1);

  offsets.push(cursor);
  pushChunk(obj2);

  offsets.push(cursor);
  pushChunk(obj3);

  offsets.push(cursor);
  pushChunk(obj4Prefix);
  pushChunk(jpegBytes);
  pushChunk(obj4Suffix);

  offsets.push(cursor);
  pushChunk(obj5);

  const xrefOffset = cursor;
  const xrefLines = ['xref', '0 6', '0000000000 65535 f '];
  for (let i = 1; i <= 5; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `);
  }
  const trailer = `\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pushChunk(encoder.encode(`${xrefLines.join('\n')}${trailer}`));

  const out = new Uint8Array(cursor);
  let writePos = 0;
  for (const c of chunks) {
    out.set(c, writePos);
    writePos += c.length;
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load attachment image'));
    img.src = src;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export async function generateLicensePdfBlob(
  license: LicenseRecord,
  regionMeta: LicenseRegionMeta,
  lang: Language,
  companyName: string,
): Promise<Blob> {
  if (isPdfDataUrl(license.attachmentDataUrl) && license.attachmentDataUrl) {
    const decodedBlob = dataUrlToBlob(license.attachmentDataUrl);
    if (decodedBlob) {
      return decodedBlob;
    }
  }

  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Deep obsidian editorial sheet with gold architectural frame
  ctx.fillStyle = '#0D0F16';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#DFAF5A';
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.strokeStyle = 'rgba(223, 175, 90, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, width - 128, height - 128);

  const isRtl = lang === 'ar';
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const anchorX = isRtl ? width - 110 : 110;
  const oppX = isRtl ? 110 : width - 110;
  const contentWidth = width - 220;

  // Header brand + region tag
  ctx.fillStyle = '#DFAF5A';
  ctx.font = '700 26px Cairo, Outfit, sans-serif';
  ctx.fillText(companyName, anchorX, 138);

  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillStyle = '#F6DDA7';
  ctx.font = '700 22px Outfit, Cairo, sans-serif';
  ctx.fillText(
    `${regionMeta.code} · ${isRtl ? regionMeta.labelAr : regionMeta.labelEn}`,
    oppX,
    138,
  );

  // Horizontal rule
  ctx.strokeStyle = 'rgba(223, 175, 90, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 172);
  ctx.lineTo(width - 110, 172);
  ctx.stroke();

  // Document kicker
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillStyle = '#DFAF5A';
  ctx.font = '600 22px Cairo, Outfit, sans-serif';
  ctx.fillText(
    isRtl ? 'وثيقة اعتماد وترخيص رسمي' : 'Official Accreditation & License Record',
    anchorX,
    235,
  );

  // License Title
  ctx.fillStyle = '#F8F9FA';
  ctx.font = '700 42px Cairo, Outfit, sans-serif';
  const titleLines = wrapLines(ctx, license.title, contentWidth, 3);
  let y = 300;
  for (const line of titleLines) {
    ctx.fillText(line, anchorX, y);
    y += 58;
  }

  // Metadata grid box
  y += 26;
  const rows: Array<[string, string]> = [
    [isRtl ? 'الدولة / المنطقة' : 'Country / Region', isRtl ? regionMeta.labelAr : regionMeta.labelEn],
    [isRtl ? 'الجهة المانحة' : 'Issuing Authority', license.authority],
    [isRtl ? 'المجال / الفئة' : 'Category', license.category],
    [isRtl ? 'رقم الترخيص' : 'License Number', license.licenseNumber],
    [isRtl ? 'تاريخ الإصدار' : 'Issue Date', license.issueDate],
    [isRtl ? 'تاريخ الانتهاء' : 'Expiry Date', license.expiryDate],
  ];

  const boxHeight = rows.length * 76 + 32;
  ctx.fillStyle = '#141722';
  ctx.fillRect(110, y, contentWidth, boxHeight);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(110, y, contentWidth, boxHeight);

  let rowY = y + 58;
  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '600 22px Cairo, Outfit, sans-serif';
    ctx.fillText(label, anchorX - (isRtl ? 28 : -28), rowY);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillStyle = i === 3 ? '#F6DDA7' : '#F8F9FA';
    ctx.font = '600 24px Cairo, Outfit, monospace';
    ctx.fillText(value, oppX + (isRtl ? 28 : -28), rowY);

    if (i < rows.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(138, rowY + 26);
      ctx.lineTo(width - 138, rowY + 26);
      ctx.stroke();
    }
    rowY += 76;
  }

  y += boxHeight + 48;

  // Notes section
  if (license.notes) {
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#DFAF5A';
    ctx.font = '700 22px Cairo, Outfit, sans-serif';
    ctx.fillText(isRtl ? 'التفاصيل والملاحظات' : 'Scope & Notes', anchorX, y);
    y += 40;
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '400 24px Cairo, Outfit, sans-serif';
    const noteLines = wrapLines(ctx, license.notes, contentWidth, 4);
    for (const line of noteLines) {
      ctx.fillText(line, anchorX, y);
      y += 38;
    }
    y += 24;
  }

  // Embedded image attachment if provided
  if (isImageDataUrl(license.attachmentDataUrl) && license.attachmentDataUrl) {
    try {
      const img = await loadImage(license.attachmentDataUrl);
      const availH = height - y - 140;
      if (availH > 180) {
        const scale = Math.min(contentWidth / img.width, availH / img.height, 1);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = (width - drawW) / 2;
        ctx.drawImage(img, drawX, y, drawW, drawH);
      }
    } catch {
      // ignore unloadable attachment image
    }
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8E95A5';
  ctx.font = '500 18px Outfit, Cairo, sans-serif';
  ctx.fillText(
    'Abc Gulf Productions · Erbil - Boulevard - B2-12-253 · Abc.productions2030@gmail.com',
    width / 2,
    height - 92,
  );

  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!jpegBlob) {
    throw new Error('Failed to encode certificate canvas to JPEG');
  }

  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdfBytes = buildSinglePagePdfFromJpegBytes(jpegBytes, width, height);
  const copy = new Uint8Array(pdfBytes.length);
  copy.set(pdfBytes);
  return new Blob([copy.buffer], { type: 'application/pdf' });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizePdfFilename(filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}
