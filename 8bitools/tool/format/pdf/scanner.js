/**
 * 8BitDoc - Smart Document Scanner & Image Processor Engine
 * 100% Client-Side Projective Homography, Corner Detection & Document Filters
 */

// Solve 8x8 linear system using Gaussian Elimination
function solveLinearSystem(A, b) {
  const n = 8;
  // Augmented matrix
  const M = new Array(n);
  for (let i = 0; i < n; i++) {
    M[i] = new Float64Array(n + 1);
    for (let j = 0; j < n; j++) M[i][j] = A[i][j];
    M[i][n] = b[i];
  }

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const tmp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = tmp;

    if (Math.abs(M[i][i]) < 1e-12) continue; // Singular or near-singular

    // Eliminate below & above
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  const res = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    res[i] = M[i][n] / M[i][i];
  }
  return res;
}

/**
 * Compute 3x3 Projective Homography Matrix mapping target (u, v) -> source (x, y)
 * dstCorners: [{x:0, y:0}, {x:w, y:0}, {x:w, y:h}, {x:0, y:h}]
 * srcCorners: [{x, y}, {x, y}, {x, y}, {x, y}] (TL, TR, BR, BL in source image)
 */
export function getHomographyMatrix(dstCorners, srcCorners) {
  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const u = dstCorners[i].x;
    const v = dstCorners[i].y;
    const x = srcCorners[i].x;
    const y = srcCorners[i].y;

    // x equation: u*h00 + v*h01 + h02 - u*x*h20 - v*x*h21 = x
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);

    // y equation: u*h10 + v*h11 + h12 - u*y*h20 - v*y*h21 = y
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }

  const h = solveLinearSystem(A, b);
  // Matrix format [h00, h01, h02, h10, h11, h12, h20, h21, 1]
  return [
    h[0], h[1], h[2],
    h[3], h[4], h[5],
    h[6], h[7], 1.0
  ];
}

/**
 * Warp quadrilateral to flat rectangle using bilinear interpolation
 * @param {HTMLCanvasElement|ImageBitmap|ImageData} sourceCanvas
 * @param {Array<{x: number, y: number}>} corners [TL, TR, BR, BL] in source pixel coordinates
 * @param {number} [targetWidth]
 * @param {number} [targetHeight]
 * @returns {HTMLCanvasElement}
 */
export function perspectiveWarp(sourceCanvas, corners, targetWidth, targetHeight) {
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const srcData = srcCtx.getImageData(0, 0, sw, sh);
  const srcPixels = srcData.data;

  // Auto calculate target dimension if not provided
  const tl = corners[0];
  const tr = corners[1];
  const br = corners[2];
  const bl = corners[3];

  const topW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const botW = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);

  const dw = Math.max(10, Math.round(targetWidth || Math.max(topW, botW)));
  const dh = Math.max(10, Math.round(targetHeight || Math.max(leftH, rightH)));

  const dstCorners = [
    { x: 0, y: 0 },
    { x: dw, y: 0 },
    { x: dw, y: dh },
    { x: 0, y: dh }
  ];

  const H = getHomographyMatrix(dstCorners, corners);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = dw;
  outCanvas.height = dh;
  const outCtx = outCanvas.getContext('2d');
  const outData = outCtx.createImageData(dw, dh);
  const outPixels = outData.data;

  const h00 = H[0], h01 = H[1], h02 = H[2];
  const h10 = H[3], h11 = H[4], h12 = H[5];
  const h20 = H[6], h21 = H[7];

  let outIdx = 0;
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const wPrime = h20 * x + h21 * y + 1.0;
      const invW = 1.0 / (Math.abs(wPrime) < 1e-7 ? 1e-7 : wPrime);
      const srcX = (h00 * x + h01 * y + h02) * invW;
      const srcY = (h10 * x + h11 * y + h12) * invW;

      if (srcX >= 0 && srcX < sw - 1 && srcY >= 0 && srcY < sh - 1) {
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const wx1 = srcX - x0;
        const wx0 = 1.0 - wx1;
        const wy1 = srcY - y0;
        const wy0 = 1.0 - wy1;

        const idx00 = (y0 * sw + x0) * 4;
        const idx10 = (y0 * sw + x1) * 4;
        const idx01 = (y1 * sw + x0) * 4;
        const idx11 = (y1 * sw + x1) * 4;

        outPixels[outIdx] = Math.round(
          (srcPixels[idx00] * wx0 + srcPixels[idx10] * wx1) * wy0 +
          (srcPixels[idx01] * wx0 + srcPixels[idx11] * wx1) * wy1
        );
        outPixels[outIdx + 1] = Math.round(
          (srcPixels[idx00 + 1] * wx0 + srcPixels[idx10 + 1] * wx1) * wy0 +
          (srcPixels[idx01 + 1] * wx0 + srcPixels[idx11 + 1] * wx1) * wy1
        );
        outPixels[outIdx + 2] = Math.round(
          (srcPixels[idx00 + 2] * wx0 + srcPixels[idx10 + 2] * wx1) * wy0 +
          (srcPixels[idx01 + 2] * wx0 + srcPixels[idx11 + 2] * wx1) * wy1
        );
        outPixels[outIdx + 3] = 255;
      } else if (srcX >= -1 && srcX <= sw && srcY >= -1 && srcY <= sh) {
        // Clamp boundary
        const cx = Math.max(0, Math.min(sw - 1, Math.round(srcX)));
        const cy = Math.max(0, Math.min(sh - 1, Math.round(srcY)));
        const cIdx = (cy * sw + cx) * 4;
        outPixels[outIdx] = srcPixels[cIdx];
        outPixels[outIdx + 1] = srcPixels[cIdx + 1];
        outPixels[outIdx + 2] = srcPixels[cIdx + 2];
        outPixels[outIdx + 3] = 255;
      } else {
        outPixels[outIdx] = 255;
        outPixels[outIdx + 1] = 255;
        outPixels[outIdx + 2] = 255;
        outPixels[outIdx + 3] = 255;
      }

      outIdx += 4;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

/**
 * Auto-detect document corners by scanning edges with luminance & gradient
 * Returns [TL, TR, BR, BL] coordinates
 */
export function autoDetectDocumentCorners(canvas) {
  const w = canvas.width;
  const h = canvas.height;

  // Downsample to max 250px for instant analysis
  const scale = Math.min(1.0, 250 / Math.max(w, h));
  const sw = Math.max(20, Math.round(w * scale));
  const sh = Math.max(20, Math.round(h * scale));

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sCtx = sampleCanvas.getContext('2d');
  sCtx.drawImage(canvas, 0, 0, sw, sh);

  const imgData = sCtx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // Grayscale map
  const gray = new Float32Array(sw * sh);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Find center brightness as reference paper/doc luminance
  let centerSum = 0;
  let centerCount = 0;
  const cx0 = Math.floor(sw * 0.35);
  const cx1 = Math.floor(sw * 0.65);
  const cy0 = Math.floor(sh * 0.35);
  const cy1 = Math.floor(sh * 0.65);
  for (let y = cy0; y <= cy1; y++) {
    for (let x = cx0; x <= cx1; x++) {
      centerSum += gray[y * sw + x];
      centerCount++;
    }
  }
  const avgCenterLuminance = centerSum / Math.max(1, centerCount);

  // Scan inwards from 4 borders to detect document boundary
  const thresholdDiff = 28;
  const maxScanX = Math.floor(sw * 0.3);
  const maxScanY = Math.floor(sh * 0.3);

  let topEdge = Math.floor(sh * 0.05);
  for (let y = 0; y < maxScanY; y++) {
    let rowDiff = 0;
    for (let x = Math.floor(sw * 0.2); x < Math.floor(sw * 0.8); x += 2) {
      if (Math.abs(gray[y * sw + x] - avgCenterLuminance) < thresholdDiff) rowDiff++;
    }
    if (rowDiff > (sw * 0.6) * 0.4) {
      topEdge = Math.max(2, y);
      break;
    }
  }

  let botEdge = sh - 1 - Math.floor(sh * 0.05);
  for (let y = sh - 1; y > sh - 1 - maxScanY; y--) {
    let rowDiff = 0;
    for (let x = Math.floor(sw * 0.2); x < Math.floor(sw * 0.8); x += 2) {
      if (Math.abs(gray[y * sw + x] - avgCenterLuminance) < thresholdDiff) rowDiff++;
    }
    if (rowDiff > (sw * 0.6) * 0.4) {
      botEdge = Math.min(sh - 3, y);
      break;
    }
  }

  let leftEdge = Math.floor(sw * 0.05);
  for (let x = 0; x < maxScanX; x++) {
    let colDiff = 0;
    for (let y = Math.floor(sh * 0.2); y < Math.floor(sh * 0.8); y += 2) {
      if (Math.abs(gray[y * sw + x] - avgCenterLuminance) < thresholdDiff) colDiff++;
    }
    if (colDiff > (sh * 0.6) * 0.4) {
      leftEdge = Math.max(2, x);
      break;
    }
  }

  let rightEdge = sw - 1 - Math.floor(sw * 0.05);
  for (let x = sw - 1; x > sw - 1 - maxScanX; x--) {
    let colDiff = 0;
    for (let y = Math.floor(sh * 0.2); y < Math.floor(sh * 0.8); y += 2) {
      if (Math.abs(gray[y * sw + x] - avgCenterLuminance) < thresholdDiff) colDiff++;
    }
    if (colDiff > (sh * 0.6) * 0.4) {
      rightEdge = Math.min(sw - 3, x);
      break;
    }
  }

  // Convert back to original coordinates with 5% safety margin
  const invScale = 1.0 / scale;
  return [
    { x: Math.round(leftEdge * invScale), y: Math.round(topEdge * invScale) },
    { x: Math.round(rightEdge * invScale), y: Math.round(topEdge * invScale) },
    { x: Math.round(rightEdge * invScale), y: Math.round(botEdge * invScale) },
    { x: Math.round(leftEdge * invScale), y: Math.round(botEdge * invScale) }
  ];
}

/**
 * Apply arbitrary angle rotation (-45° to +45° or 90/180/270) & flips
 */
export function rotateAndFlipCanvas(canvas, angleDeg = 0, flipH = false, flipV = false) {
  if (angleDeg === 0 && !flipH && !flipV) return canvas;

  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const origW = canvas.width;
  const origH = canvas.height;

  // New bounding dimensions
  const newW = Math.round(origW * cos + origH * sin);
  const newH = Math.round(origW * sin + origH * cos);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = newW;
  outCanvas.height = newH;
  const ctx = outCanvas.getContext('2d');

  // Fill white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newW, newH);

  ctx.save();
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(canvas, -origW / 2, -origH / 2);
  ctx.restore();

  return outCanvas;
}

/**
 * Apply document filters:
 * - 'original'
 * - 'magic' (CamScanner-grade contrast, whitened paper background, crisp dark text, vibrant ink)
 * - 'bw' (Clean B&W adaptive scanner thresholding)
 * - 'gray' (Smooth high-contrast grayscale scan)
 * - 'soft' (Subtle whitened background for pencil / clean print)
 * - 'vivid' (Vibrant contrast for IDs, certificates, logos)
 */
export function applyDocumentFilter(canvas, filterType = 'magic', options = {}) {
  const brightness = options.brightness ?? 0;   // -100 .. 100
  const contrast = options.contrast ?? 0;       // -100 .. 100
  const sharpen = options.sharpen ?? 25;        // 0 .. 100
  const threshold = options.threshold ?? 50;    // 0 .. 100

  const w = canvas.width;
  const h = canvas.height;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const len = d.length;

  // Contrast multiplier
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const bAdd = (brightness / 100) * 128;

  if (filterType === 'original' && brightness === 0 && contrast === 0 && sharpen === 0) {
    return outCanvas;
  }

  // Pre-calculate luminance histogram / local background estimate
  if (filterType === 'magic') {
    // CamScanner-style Magic Color
    // 1. Whitens background (removes grayish/yellow shadows)
    // 2. Darkens text strokes
    // 3. Saturates signatures and stamps
    const whitenessLift = 1.0 + (threshold / 100) * 0.45;

    for (let i = 0; i < len; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Adaptive contrast curve:
      // Paper background (lum > 140) pushed towards 255
      // Dark text (lum < 110) pushed darker
      let factor;
      if (lum > 145) {
        // Upper paper region
        const t = (lum - 145) / (255 - 145);
        factor = 1.0 + t * 0.45 * whitenessLift;
      } else if (lum < 110) {
        // Text ink region
        const t = (110 - lum) / 110;
        factor = 1.0 - t * 0.35;
      } else {
        factor = 1.0;
      }

      r = Math.min(255, Math.max(0, r * factor + bAdd));
      g = Math.min(255, Math.max(0, g * factor + bAdd));
      b = Math.min(255, Math.max(0, b * factor + bAdd));

      // Global contrast
      r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128));

      // Color saturation boost for stamps/signatures
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const satDiff = maxC - minC;
      if (satDiff > 25 && lum > 60 && lum < 220) {
        // Boost color saturation
        r = Math.min(255, r + (r - lum) * 0.3);
        g = Math.min(255, g + (g - lum) * 0.3);
        b = Math.min(255, b + (b - lum) * 0.3);
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  } else if (filterType === 'bw') {
    // Pure Clean Document B&W Scanner with adaptive thresholding
    const threshVal = 128 + ((threshold - 50) / 50) * 55;

    for (let i = 0; i < len; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b + bAdd;
      const v = lum >= threshVal ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  } else if (filterType === 'gray') {
    // High-contrast clean Grayscale Scan
    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Paper background lift
      let v = lum > 150 ? lum * 1.15 : lum * 0.9;
      v = cFactor * (v - 128) + 128 + bAdd;
      v = Math.min(255, Math.max(0, v));
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  } else if (filterType === 'soft') {
    // Soft Whitened Document (keeps pencil / faint ink)
    for (let i = 0; i < len; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const lift = lum > 120 ? (lum - 120) * 0.4 : 0;
      d[i] = Math.min(255, Math.max(0, r + lift + bAdd));
      d[i + 1] = Math.min(255, Math.max(0, g + lift + bAdd));
      d[i + 2] = Math.min(255, Math.max(0, b + lift + bAdd));
    }
  } else if (filterType === 'vivid') {
    // Vivid colors for certificates, cards, posters
    for (let i = 0; i < len; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      const avg = (r + g + b) / 3;
      r = Math.min(255, Math.max(0, r + (r - avg) * 0.45));
      g = Math.min(255, Math.max(0, g + (g - avg) * 0.45));
      b = Math.min(255, Math.max(0, b + (b - avg) * 0.45));
      r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128 + bAdd));
      g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128 + bAdd));
      b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128 + bAdd));
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  } else {
    // Standard adjustments for Original or unknown
    for (let i = 0; i < len; i += 4) {
      d[i] = Math.min(255, Math.max(0, cFactor * (d[i] - 128) + 128 + bAdd));
      d[i + 1] = Math.min(255, Math.max(0, cFactor * (d[i + 1] - 128) + 128 + bAdd));
      d[i + 2] = Math.min(255, Math.max(0, cFactor * (d[i + 2] - 128) + 128 + bAdd));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply Sharpening filter if requested (> 0)
  if (sharpen > 0 && filterType !== 'bw') {
    const sharpCanvas = applySharpen(outCanvas, sharpen);
    return sharpCanvas;
  }

  return outCanvas;
}

/**
 * 3x3 Convolution Unsharp Mask for Crisp Text
 */
function applySharpen(canvas, strength = 25) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const src = ctx.getImageData(0, 0, w, h);
  const srcData = src.data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  const out = outCtx.createImageData(w, h);
  const outData = out.data;

  // Normalized weight based on strength (0 .. 100)
  const k = (strength / 100) * 0.8;
  const centerWeight = 1.0 + 4 * k;
  const edgeWeight = -k;

  for (let y = 0; y < h; y++) {
    const yAbove = Math.max(0, y - 1);
    const yBelow = Math.min(h - 1, y + 1);

    for (let x = 0; x < w; x++) {
      const xLeft = Math.max(0, x - 1);
      const xRight = Math.min(w - 1, x + 1);

      const idx = (y * w + x) * 4;
      const idxT = (yAbove * w + x) * 4;
      const idxB = (yBelow * w + x) * 4;
      const idxL = (y * w + xLeft) * 4;
      const idxR = (y * w + xRight) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          srcData[idx + c] * centerWeight +
          (srcData[idxT + c] + srcData[idxB + c] + srcData[idxL + c] + srcData[idxR + c]) * edgeWeight;
        outData[idx + c] = Math.min(255, Math.max(0, val));
      }
      outData[idx + 3] = srcData[idx + 3];
    }
  }

  outCtx.putImageData(out, 0, 0);
  return outCanvas;
}
