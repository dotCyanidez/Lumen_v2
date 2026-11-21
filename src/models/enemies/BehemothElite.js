import { ENEMY_STATS } from '../../core/Constants.js';
import { clamp, damp, seededRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Umbral Dreadnought (`kind: 'behemoth'`, Elite): armored charge-slam juggernaut releasing a 6-bomb burst on impact.
 */
export class BehemothElite extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    speedScale = 1,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    super({
      kind: 'behemoth',
      x,
      y,
      radius: 30,
      spawnDelay: 1.0,
      life: 100,
      speed: 52 * Math.min(1.28, speedScale),
      phase,
      hpBonus,
      hpMul,
      isElite: true,
      label: 'UMBRAL DREADNOUGHT',
    });
    this.dashCooldown = 3.0;
    this.dashCharge = 0;
    this.dashActive = 0;
    this.dashAngle = 0;
  }

  updateAI(
    dt,
    { player, boundsW = 4200, boundsH = 3000, speedScale = 1, spawnProjectile, onBehemothTelegraph } = {}
  ) {
    if (!this.isActive() || !player) return null;

    const speedMult = this.getSpeedMultiplier();

    if (this.dashCharge > 0) {
      this.dashCharge -= dt;
      this.vx = damp(this.vx, 0, 8, dt);
      this.vy = damp(this.vy, 0, 8, dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.dashCharge <= 0) {
        this.dashActive = 0.56;
        const dashSpd = 330 * Math.min(1.25, 0.9 + speedScale * 0.12);
        this.vx = Math.cos(this.dashAngle) * dashSpd;
        this.vy = Math.sin(this.dashAngle) * dashSpd;
      }
    } else if (this.dashActive > 0) {
      this.dashActive -= dt;
      this.x = clamp(this.x + this.vx * dt, 48, boundsW - 48);
      this.y = clamp(this.y + this.vy * dt, 48, boundsH - 48);
      if (this.dashActive <= 0) {
        const slamSpd = 178;
        const projectiles = [];
        for (let k = 0; k < 6; k++) {
          const a = this.dashAngle + (k * Math.PI * 2) / 6;
          const proj = {
            x: this.x + Math.cos(a) * 24,
            y: this.y + Math.sin(a) * 24,
            vx: Math.cos(a) * slamSpd,
            vy: Math.sin(a) * slamSpd,
            radius: 7,
            damage: ENEMY_STATS.behemoth.projectileDamage,
            color: 0xff5d6c,
            life: 4.0,
            sourceKind: 'behemoth',
            kind: 'bomb',
          };
          spawnProjectile?.(proj);
          projectiles.push(proj);
        }
        this.dashCooldown = 4.1;
        return { fired: 'slam', projectiles };
      }
    } else {
      const ang = Math.atan2(player.y - this.y, player.x - this.x);
      this.vx = damp(this.vx, Math.cos(ang) * this.speed * speedMult, 3.2, dt);
      this.vy = damp(this.vy, Math.sin(ang) * this.speed * speedMult, 3.2, dt);
      this.x = clamp(this.x + this.vx * dt, 48, boundsW - 48);
      this.y = clamp(this.y + this.vy * dt, 48, boundsH - 48);
      this.dashCooldown -= dt;
      if (this.dashCooldown <= 0) {
        this.dashAngle = ang;
        this.dashCharge = 0.92;
        onBehemothTelegraph?.();
      }
    }

    return null;
  }
}
