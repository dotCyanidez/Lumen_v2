import { ENEMY_STATS, PLAYER_CONFIG } from '../../core/Constants.js';
import { clamp, damp, lerp, randRange } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Polymorphic Boss subclass for the Eclipse Core (`kind: 'core'`).
 * Overrides `takeDamage()` for 10-HP-per-petal shield mechanics and handles
 * the telegraphed shockwave ring + Void Parry counterplay without PixiJS imports.
 */
export class EclipseCoreBoss extends BaseEnemy {
  constructor({
    x,
    y,
    speedScale = 1,
    extraShields = 0,
    petalHp = 60,
    phase = randRange(0, Math.PI * 2),
  }) {
    super({
      kind: 'core',
      x,
      y,
      radius: 26,
      spawnDelay: 1.0,
      life: 40,
      speed: 74 * Math.min(1.3, speedScale),
      phase,
      isElite: false,
      label: 'ECLIPSE CORE',
    });
    this.petalHp = Math.max(10, Math.round(petalHp));
    this.shields = (3 + Math.max(0, extraShields)) * this.petalHp;
    this.maxShields = this.shields;
    this.drawnShields = this.getPetalCount();
    this.guardCooldown = 3.0;
    this.guardCharge = 0;
    this.guardRingAge = -1;
    this.guardRingParried = false;
    this.guardRingHit = false;
    this.guardOriginX = x;
    this.guardOriginY = y;
  }

  getPetalCount() {
    return Math.max(0, Math.ceil((this.shields - 0.001) / this.petalHp));
  }

  getTotalPetalSlots() {
    return Math.max(
      3,
      Math.ceil((this.maxShields || this.petalHp * 3) / this.petalHp),
      this.drawnShields || 3
    );
  }

  /** Solar Dash direct smash (`purgeNear`) cracks 1 full petal if >1 petal remains. */
  smashDashShield() {
    if (this.shields > this.petalHp) {
      this.shields -= this.petalHp;
      this.drawnShields = this.getPetalCount();
      return true;
    }
    return false;
  }

  takeDamage(
    amount = 10,
    { isDot = false, sourceAbility = null } = {}
  ) {
    if (!this.isActive()) return null;
    const wasMarked = (this.markTimer || 0) > 0;
    const effAmount =
      wasMarked && (this.markMul || 1) > 1 ? +(amount * this.markMul).toFixed(3) : amount;
    const isCrit = wasMarked || effAmount >= 20;
    const dealt = Math.min(effAmount, Math.max(0, this.shields));

    this.shields -= effAmount;
    this.slowTimer = Math.max(this.slowTimer || 0, 0.35);
    this.hitFlashTimer = 0.14;
    const petalRem = this.getPetalCount();
    this.drawnShields = petalRem;

    if (this.shields <= 0.001) {
      return {
        killed: true,
        cracked: false,
        petalRem: 0,
        kind: 'core',
        isElite: false,
        x: this.x,
        y: this.y,
        dealt,
        effAmount,
        isDot: Boolean(isDot),
        isCrit,
        wasMarked,
        sourceAbility,
      };
    }

    return {
      killed: false,
      cracked: true,
      petalRem,
      kind: 'core',
      isElite: false,
      x: this.x,
      y: this.y,
      dealt,
      effAmount,
      isDot: Boolean(isDot),
      isCrit,
      wasMarked,
      sourceAbility,
    };
  }

  updateAI(dt, { player, time = 0, boundsW = 4200, boundsH = 3000, onCoreTelegraph, onVoidParry, onHitPlayer } = {}) {
    const speedMult = this.getSpeedMultiplier();
    const orbitX = player.x + Math.cos(time * 0.45 + this.phase) * 185;
    const orbitY = player.y + Math.sin(time * 0.35 + this.phase) * 140;
    const angle = Math.atan2(orbitY - this.y, orbitX - this.x);
    this.vx = damp(this.vx, Math.cos(angle) * this.speed * speedMult, 2.8, dt);
    this.vy = damp(this.vy, Math.sin(angle) * this.speed * speedMult, 2.8, dt);
    this.x = clamp(this.x + this.vx * dt, 70, boundsW - 70);
    this.y = clamp(this.y + this.vy * dt, 70, boundsH - 70);

    if (!this.isActive()) return null;

    const RING_CHARGE = 0.85;
    const RING_DUR = 0.9;
    const RING_MAX_R = 230;

    if (this.guardRingAge >= 0) {
      this.guardRingAge += dt;
      const rt = this.guardRingAge / RING_DUR;
      if (rt >= 1) {
        this.guardRingAge = -1;
        this.guardCooldown = 3.8;
      } else {
        const ringR = lerp(32, RING_MAX_R, rt);
        const distRing = Math.hypot(player.x - this.guardOriginX, player.y - this.guardOriginY);
        if (
          !this.guardRingParried &&
          !this.guardRingHit &&
          Math.abs(distRing - ringR) <= PLAYER_CONFIG.hitRadius + 10
        ) {
          if ((player.dashTimer || 0) > 0) {
            this.guardRingParried = true;
            this.guardRingAge = -1;
            this.guardCooldown = 4.6;
            onVoidParry?.(this);
            return { event: 'void_parry' };
          } else if (!player.isInvulnerable) {
            this.guardRingHit = true;
            onHitPlayer?.(player.x, player.y, ENEMY_STATS.core.damage, 'core');
          }
        }
      }
    } else if (this.guardCharge > 0) {
      this.guardCharge += dt * speedMult;
      if (this.guardCharge >= RING_CHARGE) {
        this.guardCharge = 0;
        this.guardRingAge = 0;
        this.guardRingParried = false;
        this.guardRingHit = false;
        this.guardOriginX = this.x;
        this.guardOriginY = this.y;
      }
    } else {
      this.guardCooldown -= dt * speedMult;
      if (this.guardCooldown <= 0) {
        this.guardCharge = 0.001;
        onCoreTelegraph?.();
      }
    }
    return null;
  }
}
