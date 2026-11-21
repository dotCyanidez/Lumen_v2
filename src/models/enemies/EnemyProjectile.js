import { COLORS, PLAYER_CONFIG } from '../../core/Constants.js';

/**
 * Pure Domain Model for an Enemy Projectile (dart, tri, nova, lance, bomb).
 * Zero PixiJS or DOM imports.
 */
export class EnemyProjectile {
  constructor({
    x,
    y,
    vx,
    vy,
    radius = 6,
    life = 3.8,
    color = COLORS.shadowCrimson,
    kind = 'dart',
    damage = 18,
    sourceKind = 'spitter',
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.age = 0;
    this.life = life;
    this.color = color;
    this.kind = kind;
    this.damage = damage;
    this.sourceKind = sourceKind;
    this.phase = Math.random() * Math.PI * 2;
    this.view = null;
  }

  update(dt, boundsW, boundsH, player) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (
      this.age >= this.life ||
      this.x < -80 ||
      this.x > boundsW + 80 ||
      this.y < -80 ||
      this.y > boundsH + 80
    ) {
      return { expired: true, hitPlayer: false };
    }

    if (player && (player.dashTimer || 0) <= 0) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const hitDist = PLAYER_CONFIG.hitRadius + this.radius;
      if (dist <= hitDist) {
        return {
          expired: true,
          hitPlayer: !player.isInvulnerable,
          x: this.x,
          y: this.y,
          damage: this.damage,
          sourceKind: this.sourceKind,
        };
      }
    }

    return { expired: false, hitPlayer: false };
  }
}
