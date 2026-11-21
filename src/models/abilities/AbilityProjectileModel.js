import { COLORS } from '../../core/Constants.js';
import { clamp, wrapAngle } from '../../core/MathUtils.js';

/**
 * Pure Domain Model for an Ability Projectile (`bolt`, `seeker`, `spark`).
 * Pooled and updated without PixiJS dependencies; `view` holds the attached sprite in `AbilityCanvasRenderer`.
 */
export class AbilityProjectileModel {
  constructor() {
    this.active = false;
    this.kind = 'bolt';
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.speed = 600;
    this.rotation = 0;
    this.damage = 10;
    this.pierceLeft = 0;
    this.ricochetLeft = 0;
    this.ricochetMul = 0.7;
    this.turnRate = 0;
    this.age = 0;
    this.life = 1.2;
    this.targetRef = null;
    this.hitRefs = new Set();
    this.tint = COLORS.lumenCyan;
    this.scaleX = 0.44;
    this.scaleY = 0.2;
    this.splitOnKill = 0;
    this.impactSparks = 0;
    this.splashOnHit = 0;
    this.splashRadius = 48;
    this.burnDps = 0;
    this.burnDuration = 0;
    this.burnTint = COLORS.lumenGold;
    this.markBonus = 0;
    this.executeBonus = 0;
    this.killedSalvo = 0;
    this.sourceAbility = null;
    this.sprite = null;
  }

  spawn({
    kind,
    x,
    y,
    angle,
    speed,
    damage = 10,
    pierceLeft = 0,
    ricochetLeft = 0,
    ricochetMul = 0.7,
    turnRate = 0,
    life = 1.2,
    targetRef = null,
    tint = COLORS.lumenCyan,
    scaleX = 0.44,
    scaleY = 0.2,
    splitOnKill = 0,
    impactSparks = 0,
    splashOnHit = 0,
    splashRadius = 48,
    burnDps = 0,
    burnDuration = 0,
    burnTint = COLORS.lumenGold,
    markBonus = 0,
    executeBonus = 0,
    killedSalvo = 0,
    sourceAbility = null,
  }) {
    this.active = true;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.speed = speed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotation = angle;
    this.damage = damage;
    this.pierceLeft = pierceLeft;
    this.ricochetLeft = ricochetLeft;
    this.ricochetMul = ricochetMul;
    this.turnRate = turnRate;
    this.age = 0;
    this.life = life;
    this.targetRef = targetRef;
    this.tint = tint;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.splitOnKill = splitOnKill;
    this.impactSparks = impactSparks;
    this.splashOnHit = splashOnHit;
    this.splashRadius = splashRadius;
    this.burnDps = burnDps;
    this.burnDuration = burnDuration;
    this.burnTint = burnTint;
    this.markBonus = markBonus;
    this.executeBonus = executeBonus;
    this.killedSalvo = killedSalvo;
    this.sourceAbility =
      sourceAbility || (kind === 'seeker' ? 'seeker_barrage' : 'resonant_volley');
    this.hitRefs.clear();
  }

  deactivate() {
    this.active = false;
    this.targetRef = null;
    this.hitRefs.clear();
    if (this.sprite) {
      this.sprite.visible = false;
    }
  }

  stepKinematics(dt, boundsW, boundsH, enemies = null, pad = 80) {
    this.age += dt;
    if (
      this.age >= this.life ||
      this.x < -pad ||
      this.x > boundsW + pad ||
      this.y < -pad ||
      this.y > boundsH + pad
    ) {
      this.deactivate();
      return false;
    }

    if (this.kind === 'seeker' && enemies) {
      if (!this.targetRef || enemies.enemies.indexOf(this.targetRef) === -1) {
        const reacquire = enemies.findNearestTarget(this.x, this.y, 480, this.hitRefs);
        this.targetRef = reacquire ? reacquire.enemy : null;
      }
      if (this.targetRef) {
        const desired = Math.atan2(this.targetRef.y - this.y, this.targetRef.x - this.x);
        let angle = Math.atan2(this.vy, this.vx);
        const diff = wrapAngle(desired - angle);
        angle += clamp(diff, -this.turnRate * dt, this.turnRate * dt);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.rotation = angle;
      }
    }

    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.kind === 'seeker') {
      this.rotation += dt * 7;
    }
    return true;
  }
}
