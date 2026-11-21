import { seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Vortex (`kind: 'vortex'`): drifting singularity hazard exerting gravitational pull on Lumen.
 */
export class VortexEnemy extends BaseEnemy {
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
    super({
      kind: 'vortex',
      x,
      y,
      vx: vx * speedScale,
      vy: vy * speedScale,
      radius: 19,
      spawnDelay: 0.9,
      life: 21,
      speed: Math.hypot(vx, vy) * speedScale,
      phase,
      hpBonus,
      hpMul,
    });
    this.pullRadius = 230;
    this.pullStrength = 165;
  }

  getGravitySource() {
    if (!this.isActive()) return null;
    return {
      x: this.x,
      y: this.y,
      radius: this.pullRadius,
      strength: this.pullStrength,
    };
  }

  updateAI(dt, { boundsW = 4200, boundsH = 3000 } = {}) {
    if (!this.isActive()) return null;

    const speedMult = this.getSpeedMultiplier();
    this.x += this.vx * speedMult * dt;
    this.y += this.vy * speedMult * dt;

    const pad = 64;
    if (this.x < pad && this.vx < 0) this.vx *= -1;
    else if (this.x > boundsW - pad && this.vx > 0) this.vx *= -1;
    if (this.y < pad && this.vy < 0) this.vy *= -1;
    else if (this.y > boundsH - pad && this.vy > 0) this.vy *= -1;
    return null;
  }
}
