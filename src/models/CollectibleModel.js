import { PLAYER_CONFIG } from '../core/Constants.js';
import { clamp, damp, seededRange as randRange } from '../core/MathUtils.js';

/**
 * Pure Domain Model for a collectible arena item (`mote`, `prism`, `shard`, `star`).
 * Pooled and updated with zero PixiJS imports (fixes Audit Finding #4).
 */
export class CollectibleModel {
  constructor() {
    this.active = false;
    this.type = 'mote';
    this.isGolden = false;
    this.constellationId = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 13;
    this.age = 0;
    this.life = 15;
    this.phase = 0;
    this.magnetized = false;
    this.baseValue = 50;
    this.lumAmount = 0;
    this.lumValue = 0;
    this.view = null;
  }

  get root() {
    return this.view?.root ?? null;
  }

  get halo() {
    return this.view?.halo ?? null;
  }

  get ring() {
    return this.view?.ring ?? null;
  }

  get core() {
    return this.view?.core ?? null;
  }

  get glint() {
    return this.view?.glint ?? null;
  }

  init({
    type = 'mote',
    isGolden = false,
    constellationId = 0,
    x = 0,
    y = 0,
    vx = randRange(-14, 14),
    vy = randRange(-14, 14),
    radius = 13,
    life = 15,
    baseValue = 50,
    lumAmount = 0,
    lumValue = 0,
  }) {
    this.active = true;
    this.type = type;
    this.isGolden = Boolean(isGolden);
    this.constellationId = constellationId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.age = 0;
    this.life = life;
    this.phase = randRange(0, Math.PI * 2);
    this.magnetized = false;
    this.baseValue = baseValue;
    const lum = lumValue || lumAmount;
    this.lumAmount = lum;
    this.lumValue = lum;
    return this;
  }

  step(dt, player, boundsW, boundsH, pullSources = [], magnetMul = 1, starPull = false) {
    this.age += dt;
    if (this.age >= this.life) {
      return { expired: true, collected: false };
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    const isDash = (player.dashTimer || 0) > 0;
    const baseMag = PLAYER_CONFIG.magnetRadius * (isDash ? 1.55 : 1.0) * magnetMul;
    const canMagnetStar = this.type !== 'star' || starPull || isDash;
    const magnetRange =
      this.type === 'shard'
        ? baseMag * 1.45
        : this.type === 'star'
          ? starPull
            ? baseMag * 1.15
            : isDash
              ? baseMag * 0.85
              : 0
          : baseMag;

    if (canMagnetStar && dist < magnetRange) {
      this.magnetized = true;
    }

    if (this.magnetized && dist > 1) {
      const pullSpeed = isDash ? 880 : 620;
      const nx = dx / dist;
      const ny = dy / dist;
      this.vx = damp(this.vx, nx * pullSpeed, 14, dt);
      this.vy = damp(this.vy, ny * pullSpeed, 14, dt);
    } else {
      for (let s = 0; s < pullSources.length; s++) {
        const src = pullSources[s];
        const sdx = src.x - this.x;
        const sdy = src.y - this.y;
        const sd = Math.hypot(sdx, sdy);
        if (sd < src.radius && sd > 8) {
          const f = (1 - sd / src.radius) * src.strength * 0.35;
          this.vx += (sdx / sd) * f * dt;
          this.vy += (sdy / sd) * f * dt;
        }
      }
      this.vx = damp(this.vx, 0, 1.8, dt);
      this.vy = damp(this.vy, 0, 1.8, dt);
    }

    this.x = clamp(this.x + this.vx * dt, 24, boundsW - 24);
    this.y = clamp(this.y + this.vy * dt, 24, boundsH - 24);

    const pickupRadius = PLAYER_CONFIG.radius + this.radius + (isDash ? 12 : 4);
    if (dist <= pickupRadius) {
      return { expired: false, collected: true, dist, magnetRange };
    }
    return { expired: false, collected: false, dist, magnetRange };
  }
}
