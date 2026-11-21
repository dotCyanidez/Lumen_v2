import { ENEMY_STATS } from '../../core/Constants.js';
import { clamp, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';
import { steerKiteAndFace } from './EnemyMovement.js';

/**
 * Astral Harbinger (`kind: 'harbinger'`, Elite): bullet-hell kiter alternating an 8-Orb Nova and Twin Gold Lances.
 */
export class HarbingerElite extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    super({
      kind: 'harbinger',
      x,
      y,
      radius: 26,
      spawnDelay: 1.0,
      life: 95,
      speed: 62 * Math.min(1.28, speedScale),
      phase,
      hpBonus,
      hpMul,
      isElite: true,
      label: 'ASTRAL HARBINGER',
    });
    this.angle = 0;
    this.strafeDir = 1;
    this.ringCooldown = 3.3;
    this.ringCharge = 0;
    this.boltCooldown = 1.7;
    this.boltCharge = 0;
    this.boltAngle = 0;
  }

  updateAI(
    dt,
    {
      player,
      time = 0,
      boundsW = 4200,
      boundsH = 3000,
      speedScale = 1,
      spawnProjectile,
      onHarbingerRingTelegraph,
      onHarbingerBoltTelegraph,
    } = {}
  ) {
    if (!this.isActive() || !player) return null;

    const speedMult = this.getSpeedMultiplier();
    const slowFactor = this.ringCharge > 0 ? 0.25 : 1.0;
    steerKiteAndFace(this, player, dt, speedMult * slowFactor, 220, 320, 0.65);
    this.x = clamp(this.x, 48, boundsW - 48);
    this.y = clamp(this.y, 48, boundsH - 48);

    // Mechanic 1: Periodic 8-orb radial Astral Nova
    if (this.ringCharge > 0) {
      this.ringCharge -= dt;
      if (this.ringCharge <= 0) {
        const baseA = time * 0.9 + this.phase;
        const spd = 205 * Math.min(1.25, 0.9 + speedScale * 0.1);
        const projectiles = [];
        for (let k = 0; k < 8; k++) {
          const a = baseA + (k * Math.PI * 2) / 8;
          const proj = {
            x: this.x + Math.cos(a) * 20,
            y: this.y + Math.sin(a) * 20,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            radius: 6.5,
            damage: ENEMY_STATS.harbinger.projectileDamage,
            color: 0xff7eb6,
            life: 4.4,
            sourceKind: 'harbinger',
            kind: 'nova',
          };
          spawnProjectile?.(proj);
          projectiles.push(proj);
        }
        this.ringCooldown = 4.6;
        return { fired: 'nova', projectiles };
      }
    } else {
      this.ringCooldown -= dt;
      if (this.ringCooldown <= 0) {
        this.ringCharge = 0.9;
        this.boltCharge = 0;
        onHarbingerRingTelegraph?.();
      } else if (this.boltCharge > 0) {
        // Mechanic 2: Twin Gold Lances
        this.boltCharge -= dt;
        if (this.boltCharge <= 0) {
          this.boltCooldown = 2.6;
          const spd = 270;
          const projectiles = [];
          for (const off of [-0.18, 0.18]) {
            const a = this.boltAngle + off;
            const proj = {
              x: this.x + Math.cos(a) * 18,
              y: this.y + Math.sin(a) * 18,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              radius: 5.5,
              damage: 18,
              color: 0xffcf7d,
              life: 3.6,
              sourceKind: 'harbinger',
              kind: 'lance',
            };
            spawnProjectile?.(proj);
            projectiles.push(proj);
          }
          return { fired: 'lance', projectiles };
        }
      } else {
        this.boltCooldown -= dt;
        if (this.boltCooldown <= 0) {
          this.boltAngle = Math.atan2(player.y - this.y, player.x - this.x);
          this.boltCharge = 0.55;
          onHarbingerBoltTelegraph?.();
        }
      }
    }

    return null;
  }
}
