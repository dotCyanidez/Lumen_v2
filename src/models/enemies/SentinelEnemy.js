import { easeOutCubic, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Sentinel (`kind: 'sentinel'`): roaming arena bouncer emitting periodic Void Pulse Rings.
 */
export class SentinelEnemy extends BaseEnemy {
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
      kind: 'sentinel',
      x,
      y,
      vx: vx * speedScale,
      vy: vy * speedScale,
      radius: 20,
      spawnDelay: 0.75,
      life: 24,
      speed: Math.hypot(vx, vy) * speedScale,
      phase,
      hpBonus,
      hpMul,
    });
    this.pulseCooldown = seededRange(2.4, 3.8);
    this.pulseCharge = 0;
    this.pulseWaveAge = -1;
  }

  getEffectiveHitRadius() {
    if (this.pulseWaveAge >= 0) {
      const waveT = this.pulseWaveAge / 0.55;
      return Math.max(this.radius, this.radius + easeOutCubic(waveT) * 50);
    }
    return this.radius;
  }

  updateAI(dt, { boundsW = 4200, boundsH = 3000 } = {}) {
    if (!this.isActive()) return null;

    const speedMult = this.getSpeedMultiplier();
    this.x += this.vx * speedMult * dt;
    this.y += this.vy * speedMult * dt;

    const pad = 34;
    if (this.x < pad && this.vx < 0) this.vx *= -1;
    else if (this.x > boundsW - pad && this.vx > 0) this.vx *= -1;
    if (this.y < pad && this.vy < 0) this.vy *= -1;
    else if (this.y > boundsH - pad && this.vy > 0) this.vy *= -1;

    if (this.pulseWaveAge >= 0) {
      this.pulseWaveAge += dt;
      if (this.pulseWaveAge / 0.55 >= 1) {
        this.pulseWaveAge = -1;
      }
    } else if (this.pulseCharge > 0) {
      this.pulseCharge -= dt;
      if (this.pulseCharge <= 0) {
        this.pulseWaveAge = 0;
        this.pulseCooldown = seededRange(3.4, 4.8);
      }
    } else {
      this.pulseCooldown -= dt;
      if (this.pulseCooldown <= 0) {
        this.pulseCharge = 0.85;
      }
    }

    return null;
  }
}
