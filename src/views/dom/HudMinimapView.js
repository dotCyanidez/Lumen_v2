import { hexToCss } from './DomIcons.js';

export function renderMinimap(canvas, ctx, m) {
  if (!ctx || !canvas || !m) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const pad = 8;
  const mapW = cw - pad * 2;
  const mapH = ch - pad * 2;
  const sx = mapW / Math.max(1, m.worldW);
  const sy = mapH / Math.max(1, m.worldH);

  ctx.clearRect(0, 0, cw, ch);

  // Subtle deep background fill + world perimeter rectangle
  ctx.fillStyle = 'rgba(4, 10, 26, 0.65)';
  ctx.fillRect(pad, pad, mapW, mapH);

  // Subtle quadrant guide lines
  ctx.strokeStyle = 'rgba(95, 247, 235, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + mapW * 0.5, pad);
  ctx.lineTo(pad + mapW * 0.5, pad + mapH);
  ctx.moveTo(pad, pad + mapH * 0.5);
  ctx.lineTo(pad + mapW, pad + mapH * 0.5);
  ctx.stroke();

  // World outer border
  ctx.strokeStyle = 'rgba(95, 247, 235, 0.34)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, pad, mapW, mapH);

  // Camera viewport frame clamped gently visually while preserving world-relative box
  const vx = pad + (m.camX - m.viewW * 0.5) * sx;
  const vy = pad + (m.camY - m.viewH * 0.5) * sy;
  const vw = m.viewW * sx;
  const vh = m.viewH * sy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, mapW, mapH);
  ctx.clip();
  ctx.fillStyle = 'rgba(95, 247, 235, 0.06)';
  ctx.fillRect(vx, vy, vw, vh);
  ctx.strokeStyle = 'rgba(190, 255, 248, 0.28)';
  ctx.lineWidth = 1.25;
  ctx.strokeRect(vx, vy, vw, vh);
  ctx.restore();

  // Collectibles (motes, prisms, shards, constellation stars)
  const stars = [];
  for (const item of m.items) {
    const ix = pad + item.x * sx;
    const iy = pad + item.y * sy;
    if (item.type === 'star') {
      stars.push({ x: ix, y: iy, cid: item.constellationId });
    } else if (item.type === 'prism') {
      ctx.fillStyle = '#9efff5';
      ctx.beginPath();
      ctx.moveTo(ix, iy - 4.5);
      ctx.lineTo(ix + 4.5, iy);
      ctx.lineTo(ix, iy + 4.5);
      ctx.lineTo(ix - 4.5, iy);
      ctx.closePath();
      ctx.fill();
    } else if (item.type === 'shard') {
      ctx.fillStyle = '#e2a6ff';
      ctx.beginPath();
      ctx.arc(ix, iy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = item.isGolden ? 'rgba(255, 227, 143, 0.85)' : 'rgba(125, 249, 255, 0.58)';
      ctx.beginPath();
      ctx.arc(ix, iy, item.isGolden ? 2.4 : 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (stars.length > 0) {
    if (stars.length > 1) {
      ctx.strokeStyle = 'rgba(255, 228, 147, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        const s2 = stars[(i + 1) % stars.length];
        if (s1.cid === s2.cid) {
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe599';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Enemies (highlight Eclipse Core boss prominently)
  for (const e of m.enemies) {
    if (e.x < -30 || e.x > m.worldW + 30 || e.y < -30 || e.y > m.worldH + 30) continue;
    const ex = pad + e.x * sx;
    const ey = pad + e.y * sy;
    if (e.kind === 'core' || e.isElite) {
      ctx.strokeStyle = e.isElite ? '#ffcf7d' : '#ff6b95';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ex, ey, 6.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = e.isElite ? '#ff4fa8' : '#ff2e6a';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const isSpecial =
        e.kind === 'warden' ||
        e.kind === 'vortex' ||
        e.kind === 'spitter' ||
        e.kind === 'artillery';
      ctx.fillStyle =
        e.kind === 'spitter' || e.kind === 'artillery'
          ? 'rgba(218, 120, 255, 0.88)'
          : isSpecial
            ? 'rgba(255, 118, 92, 0.85)'
            : 'rgba(255, 62, 112, 0.72)';
      ctx.beginPath();
      ctx.arc(ex, ey, isSpecial ? 2.6 : 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Spirit (Player) marker
  const px = pad + m.playerX * sx;
  const py = pad + m.playerY * sy;
  const spiritCss = hexToCss(m.spiritHex || 0x5ff7eb);
  ctx.fillStyle = spiritCss;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py, 4.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = spiritCss;
  ctx.lineWidth = 2;
  ctx.stroke();
}
