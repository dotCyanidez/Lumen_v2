import { clamp, damp, seededRange, wrapAngle } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Manta (`kind: 'manta'`): sinusoidal weaving chaser leaving a shadow ribbon trail.
 */
export class MantaEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    const initAngle = Math.atan2(vy, vx);
    const speed = Math.hypot(vx, vy) * speedScale;
    super({
      kind: 'manta',
      x,
      y,
      vx: vx * speedScale,
      vy: vy * speedScale,
      radius: 17,
      spawnDelay: 0.4,
      life: 24,
      speed,
      phase,
      hpBonus,
      hpMul,
    });
    this.baseAngle = initAngle;
    this.angle = initAngle;
    this.turnRate = 1.55;
    this.trail = [{ x, y }];
  }

  updateAI(dt, { player, time = 0 } = {}) {
    if (this.isActive() && player) {
      const speedMult = this.getSpeedMultiplier();
      const desiredAngle = Math.atan2(player.y - this.y, player.x - this.x);
      const diff = wrapAngle(desiredAngle - this.baseAngle);
      this.baseAngle += clamp(diff, -this.turnRate * dt, this.turnRate * dt);

      const spd = this.speed * speedMult;
      const wave = Math.sin(time * 3.1 + this.phase) * 34 * speedMult;
      const perpX = -Math.sin(this.baseAngle);
      const perpY = Math.cos(this.baseAngle);

      this.vx = damp(this.vx, Math.cos(this.baseAngle) * spd, 4.8, dt);
      this.vy = damp(this.vy, Math.sin(this.baseAngle) * spd, 4.8, dt);
      this.x += (this.vx + perpX * wave) * dt;
      this.y += (this.vy + perpY * wave) * dt;
      this.angle = Math.atan2(this.vy + perpY * wave, this.vx + perpX * wave);
    }

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.pop();
    return null;
  }
}
