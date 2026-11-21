import { Texture } from 'pixi.js';

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeRadialGlow(size, stops) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const [offset, color] of stops) {
    grad.addColorStop(offset, color);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

function makeSparkStar(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  // Soft outer halo
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c * 0.85);
  halo.addColorStop(0, 'rgba(255,255,255,0.95)');
  halo.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Crisp 4-point star flare
  ctx.save();
  ctx.translate(c, c);
  ctx.fillStyle = '#ffffff';
  for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    ctx.moveTo(0, -c * 0.92);
    ctx.quadraticCurveTo(c * 0.08, -c * 0.08, c * 0.92, 0);
    ctx.quadraticCurveTo(c * 0.08, c * 0.08, 0, c * 0.92);
    ctx.quadraticCurveTo(-c * 0.08, c * 0.08, -c * 0.92, 0);
    ctx.quadraticCurveTo(-c * 0.08, -c * 0.08, 0, -c * 0.92);
    ctx.fill();
    ctx.rotate(Math.PI / 4);
    ctx.scale(0.55, 0.55);
  }
  ctx.restore();

  return Texture.from(canvas);
}

function makeDiamondFacet(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  ctx.save();
  ctx.translate(c, c);

  // Outer crystal silhouette
  ctx.beginPath();
  ctx.moveTo(0, -c * 0.84);
  ctx.lineTo(c * 0.62, 0);
  ctx.lineTo(0, c * 0.84);
  ctx.lineTo(-c * 0.62, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-c * 0.5, -c * 0.7, c * 0.5, c * 0.7);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, 'rgba(235, 255, 255, 0.92)');
  grad.addColorStop(1, 'rgba(180, 240, 255, 0.7)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner sharp highlight
  ctx.beginPath();
  ctx.moveTo(0, -c * 0.55);
  ctx.lineTo(c * 0.3, 0);
  ctx.lineTo(0, c * 0.55);
  ctx.lineTo(-c * 0.3, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();

  ctx.restore();
  return Texture.from(canvas);
}

function makeRing(size, lineWidth = 4) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const r = c - lineWidth * 2;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = lineWidth * 2.2;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.stroke();

  return Texture.from(canvas);
}

function makeTrailRibbon(width = 256, height = 48) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Horizontal fade: index 0 (head near player) bright white -> tail fades out smoothly
  // Note: MeshRope maps UV.x from 0 at points[0] to 1 at points[n-1]
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let x = 0; x < width; x++) {
    const u = x / (width - 1);
    // Point 0 is head (brightest), point N-1 is tail (fades to 0)
    const along = Math.pow(1 - u, 1.55);
    // Taper thickness smoothly toward tail
    const halfWidth = 0.08 + 0.92 * Math.pow(1 - u, 0.85);

    for (let y = 0; y < height; y++) {
      const v = (y / (height - 1)) * 2 - 1;
      const dist = Math.abs(v) / halfWidth;
      let radial = 0;
      if (dist < 1) {
        radial = Math.pow(Math.cos((dist * Math.PI) / 2), 1.7);
      }

      const alpha = Math.max(0, Math.min(1, along * radial));
      // Warm white core shifting into luminous aqua-cyan along tail
      const r = Math.round(255 * (1 - u * 0.48));
      const g = Math.round(255 * (1 - u * 0.05));
      const b = 255;

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return Texture.from(canvas);
}

function makeInkPuff(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255,255,255,0.92)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.48)');
  grad.addColorStop(0.8, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

function makeStreak(width = 96, height = 24) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const cy = height / 2;

  const grad = ctx.createLinearGradient(0, cy, width, cy);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.65)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.quadraticCurveTo(width * 0.65, 2, width, cy);
  ctx.quadraticCurveTo(width * 0.65, height - 2, 0, cy);
  ctx.fill();

  return Texture.from(canvas);
}

export function createTextures() {
  return {
    glowSoft: makeRadialGlow(128, [
      [0, 'rgba(255,255,255,1)'],
      [0.2, 'rgba(255,255,255,0.72)'],
      [0.52, 'rgba(255,255,255,0.22)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    glowTight: makeRadialGlow(64, [
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,255,255,0.85)'],
      [0.7, 'rgba(255,255,255,0.18)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    orbCore: makeRadialGlow(64, [
      [0, 'rgba(255,255,255,1)'],
      [0.45, 'rgba(255,255,255,0.96)'],
      [0.72, 'rgba(255,255,255,0.35)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    sparkStar: makeSparkStar(64),
    diamond: makeDiamondFacet(64),
    ring: makeRing(128, 3.5),
    trailRibbon: makeTrailRibbon(256, 44),
    inkPuff: makeInkPuff(64),
    streak: makeStreak(96, 20),
  };
}
