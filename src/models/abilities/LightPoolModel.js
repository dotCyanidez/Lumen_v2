import { COLORS } from '../../core/Constants.js';

/**
 * Pure Domain Model for a persistent bioluminescent hazard pool (Starbloom Mist zone).
 */
export class LightPoolModel {
  constructor({
    x,
    y,
    radius = 56,
    duration = 2.6,
    dps = 6,
    slow = 0.35,
    tint = COLORS.lumenCyan,
    sourceAbility = 'resonant_volley',
  }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.age = 0;
    this.life = duration;
    this.dps = dps;
    this.slow = slow;
    this.tint = tint;
    this.sourceAbility = sourceAbility;
    this.tickTimer = 0.06;
  }

  step(dt, dotPoolMul = 1) {
    this.age += dt;
    if (this.age >= this.life) {
      return { expired: true, tickDamage: 0 };
    }
    this.tickTimer -= dt;
    if (this.tickTimer <= 0) {
      this.tickTimer = 0.25;
      return {
        expired: false,
        tickDamage: +(this.dps * 0.25 * dotPoolMul).toFixed(3),
      };
    }
    return { expired: false, tickDamage: 0 };
  }
}
