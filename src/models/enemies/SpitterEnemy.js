import { ENEMY_STATS } from '../../core/Constants.js';
import { clamp, rand, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';
import { steerKiteAndFace } from './EnemyMovement.js';

/**
 * Spitter (`kind: 'spitter'`): agile ranged kiter firing converging Spine Dart projectiles.
 */
export class SpitterEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    super({
      kind: 'spitter',
      x,
      y,
      radius: 14,
      spawnDelay: 0.7,
      life: 25,
      speed: seededRange(76, 94) * speedScale,
      phase,
      hpBonus,
      hpMul,
    });
    this.angle = 0;
    this.strafeDir = rand() < 0.5 ? 1 : -1;
    this.fireCooldown = seededRange(1.7, 2.5);
    this.fireCharge = 0;
    this.aimAngle = 0;
  }

  updateAI(
    dt,
    { player, boundsW = 4200, boundsH = 3000, speedScale = 1, spawnProjectile, onSpitterTelegraph } = {}
  ) {
    if (!player) return null;

    const speedMult = this.getSpeedMultiplier();
    const distToPlayer = steerKiteAndFace(this, player, dt, speedMult, 210, 310, 0.55);
    this.x = clamp(this.x, 28, boundsW - 28);
    this.y = clamp(this.y, 28, boundsH - 28);

    if (!this.isActive() || distToPlayer > 500) return null;

    if (this.fireCharge > 0) {
      this.fireCharge -= dt;
      if (this.fireCharge <= 0) {
        const aimX = Math.cos(this.aimAngle);
        const aimY = Math.sin(this.aimAngle);
        const spd = 258 * Math.min(1.35, 0.88 + speedScale * 0.14);
        const proj = {
          x: this.x + aimX * 14,
          y: this.y + aimY * 14,
          vx: aimX * spd,
          vy: aimY * spd,
          radius: 6,
          damage: ENEMY_STATS.spitter.projectileDamage,
          color: 0xff52b8,
          life: 3.8,
          sourceKind: 'spitter',
          kind: 'dart',
        };
        spawnProjectile?.(proj);
        this.fireCooldown = seededRange(2.4, 3.3);
        return { fired: true, projectiles: [proj] };
      }
    } else {
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.fireCharge = 0.62;
        onSpitterTelegraph?.();
      }
    }
    return null;
  }
}
