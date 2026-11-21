import { ENEMY_STATS } from '../../core/Constants.js';
import { clamp, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';
import { steerKiteAndFace } from './EnemyMovement.js';

/**
 * Artillery (`kind: 'artillery'`): heavy ranged kiter firing 3-bolt Tri-Spread Volleys.
 */
export class ArtilleryEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    super({
      kind: 'artillery',
      x,
      y,
      radius: 17,
      spawnDelay: 0.85,
      life: 28,
      speed: seededRange(44, 58) * speedScale,
      phase,
      hpBonus,
      hpMul,
    });
    this.angle = 0;
    this.strafeDir = 1;
    this.fireCooldown = seededRange(2.2, 3.2);
    this.fireCharge = 0;
    this.aimAngle = 0;
  }

  updateAI(
    dt,
    { player, boundsW = 4200, boundsH = 3000, speedScale = 1, spawnProjectile, onArtilleryTelegraph } = {}
  ) {
    if (!player) return null;

    const speedMult = this.getSpeedMultiplier();
    const distToPlayer = steerKiteAndFace(this, player, dt, speedMult, 270, 390, 0.35);
    this.x = clamp(this.x, 34, boundsW - 34);
    this.y = clamp(this.y, 34, boundsH - 34);

    if (!this.isActive() || distToPlayer > 560) return null;

    if (this.fireCharge > 0) {
      this.fireCharge -= dt;
      if (this.fireCharge <= 0) {
        const spd = 224 * Math.min(1.3, 0.86 + speedScale * 0.14);
        const projDmg = ENEMY_STATS.artillery.projectileDamage;
        const projectiles = [];
        for (const offset of [-0.28, 0, 0.28]) {
          const a = this.aimAngle + offset;
          const proj = {
            x: this.x + Math.cos(a) * 16,
            y: this.y + Math.sin(a) * 16,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            radius: 5.5,
            damage: projDmg,
            color: 0xc77dff,
            life: 4.2,
            sourceKind: 'artillery',
            kind: 'tri',
          };
          spawnProjectile?.(proj);
          projectiles.push(proj);
        }
        this.fireCooldown = seededRange(3.6, 4.6);
        return { fired: true, projectiles };
      }
    } else {
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.fireCharge = 0.85;
        onArtilleryTelegraph?.();
      }
    }
    return null;
  }
}
