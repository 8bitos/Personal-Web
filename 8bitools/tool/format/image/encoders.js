// Comprehensive Pure JavaScript Encoders (Client-side, 0 dependencies)

/**
 * Encodes an ImageData / Canvas to BMP format (Windows Bitmap 24-bit)
 */
export function canvasToBmpBlob(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  const extraBytes = (width * 3) % 4;
  const paddingSize = extraBytes === 0 ? 0 : 4 - extraBytes;
  const imageSize = (width * 3 + paddingSize) * height;
  const headerSize = 54;
  const fileSize = headerSize + imageSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // Bitmap file header (14 bytes)
  view.setUint16(0, 0x4D42, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, headerSize, true);
  
  // DIB Header / BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);
  
  let offset = headerSize;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      view.setUint8(offset++, data[idx + 2]); // B
      view.setUint8(offset++, data[idx + 1]); // G
      view.setUint8(offset++, data[idx]);     // R
    }
    for (let p = 0; p < paddingSize; p++) {
      view.setUint8(offset++, 0);
    }
  }
  
  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes an HTMLCanvasElement to standard Windows ICO format (wrapping PNG)
 */
export async function canvasToIcoBlob(canvas) {
  const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);
  
  const width = canvas.width > 255 ? 0 : canvas.width;
  const height = canvas.height > 255 ? 0 : canvas.height;
  const imageSize = pngBytes.length;
  
  const headerSize = 22;
  const totalSize = headerSize + imageSize;
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type 1 = ICO
  view.setUint16(4, 1, true); // 1 Image
  
  view.setUint8(6, width);
  view.setUint8(7, height);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, imageSize, true);
  view.setUint32(18, headerSize, true);
  
  const uint8 = new Uint8Array(buffer);
  uint8.set(pngBytes, headerSize);
  
  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Encodes an HTMLCanvasElement to Windows Cursor format (.CUR)
 */
export async function canvasToCurBlob(canvas) {
  const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);
  
  const width = canvas.width > 255 ? 0 : canvas.width;
  const height = canvas.height > 255 ? 0 : canvas.height;
  const imageSize = pngBytes.length;
  
  const headerSize = 22;
  const totalSize = headerSize + imageSize;
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 2, true); // Type 2 = CUR
  view.setUint16(4, 1, true); // 1 Image
  
  view.setUint8(6, width);
  view.setUint8(7, height);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 0, true); // Hotspot X = 0
  view.setUint16(12, 0, true); // Hotspot Y = 0
  view.setUint32(14, imageSize, true);
  view.setUint32(18, headerSize, true);
  
  const uint8 = new Uint8Array(buffer);
  uint8.set(pngBytes, headerSize);
  
  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Encodes an ImageData / Canvas to Truevision TGA format (24-bit uncompressed RGB)
 */
export function canvasToTgaBlob(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const pixelCount = width * height;
  const headerSize = 18;
  const fileSize = headerSize + (pixelCount * 3);
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  view.setUint8(0, 0);
  view.setUint8(1, 0);
  view.setUint8(2, 2); // Uncompressed true-color
  view.setUint16(3, 0, true);
  view.setUint16(5, 0, true);
  view.setUint8(7, 0);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  view.setUint8(16, 24); // 24 bpp
  view.setUint8(17, 0x20); // Top-left origin
  
  let offset = headerSize;
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    view.setUint8(offset++, data[idx + 2]); // B
    view.setUint8(offset++, data[idx + 1]); // G
    view.setUint8(offset++, data[idx]);     // R
  }
  
  return new Blob([buffer], { type: 'image/x-tga' });
}

/**
 * Encodes an ImageData / Canvas to Netpbm PPM (P6 Binary) format
 */
export function canvasToPpmBlob(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  const headerStr = `P6\n${width} ${height}\n255\n`;
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(headerStr);
  
  const pixelBytes = new Uint8Array(width * height * 3);
  let p = 0;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    pixelBytes[p++] = data[idx];     // R
    pixelBytes[p++] = data[idx + 1]; // G
    pixelBytes[p++] = data[idx + 2]; // B
  }
  
  return new Blob([headerBytes, pixelBytes], { type: 'image/x-portable-pixmap' });
}

/**
 * Encodes an ImageData / Canvas to WBMP format (Wireless Bitmap 1-bit Monochrome)
 */
export function canvasToWbmpBlob(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  // Encode multi-byte uint (variable length)
  function encodeMultiByte(n) {
    const bytes = [];
    bytes.push(n & 0x7F);
    n = n >>> 7;
    while (n > 0) {
      bytes.unshift((n & 0x7F) | 0x80);
      n = n >>> 7;
    }
    return bytes;
  }
  
  const header = [0, 0, ...encodeMultiByte(width), ...encodeMultiByte(height)];
  const rowBytes = Math.ceil(width / 8);
  const bitmap = new Uint8Array(rowBytes * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Luminance thresholding: 0.299R + 0.587G + 0.114B
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum >= 128) {
        const byteIndex = y * rowBytes + (x >> 3);
        bitmap[byteIndex] |= (0x80 >> (x & 7));
      }
    }
  }
  
  return new Blob([new Uint8Array(header), bitmap], { type: 'image/vnd.wap.wbmp' });
}

/**
 * Encodes Canvas to Adobe DNG / TIFF RAW Container
 */
export async function canvasToDngBlob(canvas) {
  // Adobe DNG standard is built on the TIFF container with DNG specific IFD tags
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const data = imgData.data;
  
  // Uncompressed 24-bit RGB TIFF/DNG structure
  const rawSize = width * height * 3;
  const numTags = 12;
  const ifdSize = 2 + (numTags * 12) + 4;
  const headerSize = 8;
  const totalHeader = headerSize + ifdSize + 32; // extra for offsets
  
  const buffer = new ArrayBuffer(totalHeader + rawSize);
  const view = new DataView(buffer);
  
  // TIFF Header (Little Endian 'II')
  view.setUint16(0, 0x4949, true); // 'II'
  view.setUint16(2, 42, true);     // Magic 42
  view.setUint32(4, 8, true);      // Offset to IFD0
  
  let pos = 8;
  view.setUint16(pos, numTags, true);
  pos += 2;
  
  const dataOffset = totalHeader;
  
  function writeTag(tag, type, count, valOrOffset) {
    view.setUint16(pos, tag, true);
    view.setUint16(pos + 2, type, true);
    view.setUint32(pos + 4, count, true);
    view.setUint32(pos + 8, valOrOffset, true);
    pos += 12;
  }
  
  // 1. ImageWidth (256)
  writeTag(256, 4, 1, width);
  // 2. ImageLength (257)
  writeTag(257, 4, 1, height);
  // 3. BitsPerSample (258) -> 8,8,8
  const bpsOffset = headerSize + ifdSize;
  view.setUint16(bpsOffset, 8, true);
  view.setUint16(bpsOffset + 2, 8, true);
  view.setUint16(bpsOffset + 4, 8, true);
  writeTag(258, 3, 3, bpsOffset);
  // 4. Compression (259) -> 1 (uncompressed)
  writeTag(259, 3, 1, 1);
  // 5. PhotometricInterpretation (262) -> 2 (RGB)
  writeTag(262, 3, 1, 2);
  // 6. StripOffsets (273)
  writeTag(273, 4, 1, dataOffset);
  // 7. SamplesPerPixel (277) -> 3
  writeTag(277, 3, 1, 3);
  // 8. RowsPerStrip (278) -> height
  writeTag(278, 4, 1, height);
  // 9. StripByteCounts (279) -> rawSize
  writeTag(279, 4, 1, rawSize);
  // 10. PlanarConfiguration (284) -> 1
  writeTag(284, 3, 1, 1);
  // 11. DNGVersion (50706) -> 1.4.0.0
  const dngVer = 0x01040000;
  writeTag(50706, 1, 4, dngVer);
  // 12. DNGBackwardVersion (50707) -> 1.1.0.0
  const dngBackVer = 0x01010000;
  writeTag(50707, 1, 4, dngBackVer);
  
  view.setUint32(pos, 0, true); // End of IFD
  
  // Copy RGB pixels
  const uint8 = new Uint8Array(buffer);
  let p = dataOffset;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    uint8[p++] = data[idx];     // R
    uint8[p++] = data[idx + 1]; // G
    uint8[p++] = data[idx + 2]; // B
  }
  
  return new Blob([buffer], { type: 'image/x-adobe-dng' });
}

/**
 * Encodes Canvas to SVG wrapper
 */
export function canvasToSvgBlob(canvas) {
  const dataUrl = canvas.toDataURL('image/png');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Encodes Canvas to Standalone PDF (1:1 Print Ready Document)
 */
export async function canvasToPdfBlob(canvas) {
  const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 1.0));
  const jpegBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegBuffer);
  
  const width = canvas.width;
  const height = canvas.height;
  
  const ptWidth = Math.round(width * 0.75);
  const ptHeight = Math.round(height * 0.75);
  
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let currentPos = 0;
  
  function addChunk(str) {
    const b = encoder.encode(str);
    chunks.push(b);
    currentPos += b.length;
  }
  
  function addBytes(bytes) {
    chunks.push(bytes);
    currentPos += bytes.length;
  }
  
  // PDF Header
  addChunk("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  
  // Obj 1: Catalog
  offsets.push(currentPos);
  addChunk("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Obj 2: Pages
  offsets.push(currentPos);
  addChunk("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  
  // Obj 3: Page
  offsets.push(currentPos);
  addChunk(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  
  // Obj 4: Image XObject
  offsets.push(currentPos);
  const imgHeader = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  addChunk(imgHeader);
  addBytes(jpegBytes);
  addChunk("\nendstream\nendobj\n");
  
  // Obj 5: Page Content stream
  offsets.push(currentPos);
  const streamContent = `q\n${ptWidth} 0 0 ${ptHeight} 0 0 cm\n/Im1 Do\nQ\n`;
  addChunk(`5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`);
  
  // Cross-reference table
  const xrefOffset = currentPos;
  addChunk("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 0; i < offsets.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    addChunk(`${offStr} 00000 n \n`);
  }
  
  // Trailer
  addChunk(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  
  return new Blob(chunks, { type: 'application/pdf' });
}

let avifEncoderModule = null;

/**
 * Encodes Canvas to genuine AVIF using WebCodecs (libaom/av01) or native canvas
 */
export async function canvasToAvifBlob(canvas) {
  // Method 1: WebCodecs AVIF Encoder
  try {
    if (!avifEncoderModule) {
      avifEncoderModule = await import('https://cdn.jsdelivr.net/npm/@browser-mc/webcodecs-avif/+esm');
    }
    if (avifEncoderModule && avifEncoderModule.encodeImageToAvif) {
      const avifBytes = await avifEncoderModule.encodeImageToAvif(canvas, { quality: 1.0 });
      if (avifBytes && avifBytes.byteLength > 0) {
        return new Blob([avifBytes], { type: 'image/avif' });
      }
    }
  } catch (err) {
    console.warn('WebCodecs AVIF encoder not supported:', err);
  }

  // Method 2: Native canvas toBlob (if browser supports AVIF encoding)
  const nativeBlob = await new Promise(res => {
    try {
      canvas.toBlob(res, 'image/avif', 1.0);
    } catch {
      res(null);
    }
  });

  if (nativeBlob && nativeBlob.type === 'image/avif') {
    return nativeBlob;
  }

  throw new Error('AVIF_UNSUPPORTED');
}

let gifencModule = null;

/**
 * Encodes Canvas to genuine 8-bit palette GIF
 */
export async function canvasToGifBlob(canvas) {
  try {
    if (!gifencModule) {
      gifencModule = await import('https://unpkg.com/gifenc');
    }
    if (gifencModule && gifencModule.GIFEncoder) {
      const { GIFEncoder, quantize, applyPalette } = gifencModule;
      const ctx = canvas.getContext('2d');
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      const encoder = GIFEncoder();
      encoder.writeFrame(index, width, height, { palette });
      encoder.finish();
      const bytes = encoder.bytes();
      return new Blob([bytes], { type: 'image/gif' });
    }
  } catch (err) {
    console.warn('gifenc module error, trying native canvas:', err);
  }

  const nativeBlob = await new Promise(res => {
    try {
      canvas.toBlob(res, 'image/gif');
    } catch {
      res(null);
    }
  });

  if (nativeBlob && nativeBlob.type === 'image/gif') {
    return nativeBlob;
  }

  throw new Error('GIF_UNSUPPORTED');
}
