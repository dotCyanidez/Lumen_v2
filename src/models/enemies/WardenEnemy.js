import { damp, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Warden (`kind: 'warden'`): armored splitter bruiser that bursts into 2 fast Stalker Wisps on death.
 */
export class WardenEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    super({
      kind: 'warden',
      x,
      y,
      radius: 21,
      spawnDelay: 0.78,
      life: 26,
      speed: seededRange(66, 92) * speedScale,
      phase,
      hpBonus,
      hpMul,
    });
  }

  getSplitWispConfigs() {
    const configs = [];
    for (let k = 0; k < 2; k++) {
      const a = seededRange(0, Math.PI * 2) + k * Math.PI;
      configs.push({
        x: this.x + Math.cos(a) * 14,
        y: this.y + Math.sin(a) * 14,
        vx: Math.cos(a) * 185,
        vy: Math.sin(a) * 185,
        angle: a,
        speedScale: 1.15,
        spawnDelay: 0.28,
        life: 14,
        splitWisp: true,
      });
    }
    return configs;
  }

  updateAI(dt, { player } = {}) {
    if (!this.isActive() || !player) return null;

    const speedMult = this.getSpeedMultiplier();
    const ang = Math.atan2(player.y - this.y, player.x - this.x);
    this.vx = damp(this.vx, Math.cos(ang) * this.speed * speedMult, 3.6, dt);
    this.vy = damp(this.vy, Math.sin(ang) * this.speed * speedMult, 3.6, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return null;
  }
}
