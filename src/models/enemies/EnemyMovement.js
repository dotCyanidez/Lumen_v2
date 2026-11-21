import { damp } from '../../core/MathUtils.js';

/**
 * Shared kiting and facing steering helper for ranged enemy models (Spitter, Artillery, Harbinger).
 * Pure math, zero PixiJS or DOM imports.
 */
export function steerKiteAndFace(enemy, player, dt, speedMult, minDist, maxDist, strafeWeight = 0.5) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  enemy.angle = Math.atan2(dy, dx);
  if (!enemy.isActive()) return dist;

  const nx = dx / dist;
  const ny = dy / dist;
  const px = -ny * (enemy.strafeDir || 1);
  const py = nx * (enemy.strafeDir || 1);
  let radial = 0;
  if (dist > maxDist) radial = 1;
  else if (dist < minDist) radial = -0.85;

  const dirX = nx * radial + px * strafeWeight;
  const dirY = ny * radial + py * strafeWeight;
  const mag = Math.max(0.01, Math.hypot(dirX, dirY));
  const spd = enemy.speed * speedMult;
  enemy.vx = damp(enemy.vx, (dirX / mag) * spd, 4.2, dt);
  enemy.vy = damp(enemy.vy, (dirY / mag) * spd, 4.2, dt);
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  return dist;
}
