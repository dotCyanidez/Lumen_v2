import { COLORS, ENEMY_STATS } from '../../core/Constants.js';

/**
 * Abstract OOP Base Class for all Enemy and Boss Domain Models (SOLID: SRP, OCP, LSP, DIP).
 * Contains pure combat state, status timers, HP scaling, and polymorphic `takeDamage()` / `updateAI()`.
 * Zero PixiJS or DOM imports.
 */
export class BaseEnemy {
  constructor({
    kind,
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    radius = 14,
    spawnDelay = 0.65,
    life = 24,
    speed = 140,
    phase = 0,
    hpBonus = 0,
    hpMul = 1,
    isElite = false,
    label = '',
  }) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.spawnDelay = spawnDelay;
    this.age = 0;
    this.life = life;
    this.speed = speed;
    this.phase = phase;
    this.isElite = Boolean(isElite || ENEMY_STATS[kind]?.isElite);
    this.label = label;

    const scaledHp = BaseEnemy.computeScaledHp(kind, hpBonus, hpMul);
    this.hp = scaledHp;
    this.maxHp = scaledHp;

    this.slowTimer = 0;
    this.hitFlashTimer = 0;
    this.orbitalHitCooldown = 0;
    this.rayHitCooldown = 0;
    this.coreHitCooldown = 0;
    this.markTimer = 0;
    this.markMul = 1;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTick = 0;
    this.burnTint = COLORS.lumenGold;
    this.burnSourceAbility = null;
    this._removed = false;

    // Optional reference to attached Pixi view record (managed by EnemyCanvasRenderer)
    this.view = null;
  }

  static computeScaledHp(kind, hpBonus = 0, hpMul = 1) {
    const stats = ENEMY_STATS[kind] || ENEMY_STATS.stalker;
    let scaledHp = stats.hp;
    if (hpBonus > 0) {
      if (kind === 'stalker' || kind === 'manta' || kind === 'spitter') scaledHp += hpBonus * 10;
      else if (kind === 'sentinel') scaledHp += Math.floor(hpBonus * 1.35) * 10;
      else if (kind === 'artillery' || kind === 'warden') scaledHp += Math.floor(hpBonus * 1.4) * 10;
      else if (kind === 'vortex') scaledHp += Math.floor(hpBonus * 1.5) * 10;
      else if (kind === 'lancer') scaledHp += Math.floor(hpBonus * 0.6) * 10;
      else if (kind === 'harbinger' || kind === 'behemoth') scaledHp += Math.floor(hpBonus * 8) * 10;
    }
    if (hpMul !== 1) {
      scaledHp = Math.max(10, Math.round(scaledHp * hpMul));
    }
    return scaledHp;
  }

  isActive() {
    return !this._removed && this.age >= this.spawnDelay;
  }

  getSpeedMultiplier() {
    return this.slowTimer > 0 ? 0.45 : 1.0;
  }

  getEffectiveHitRadius() {
    return this.radius;
  }

  getContactDamage() {
    return ENEMY_STATS[this.kind]?.damage ?? 22;
  }

  getGravitySource() {
    return null;
  }

  applySlow(duration) {
    if (duration > 0) {
      this.slowTimer = Math.max(this.slowTimer || 0, duration);
    }
  }

  applyMark(markBonusPct, duration = 3.5) {
    if (markBonusPct > 0) {
      this.markTimer = Math.max(this.markTimer || 0, duration);
      this.markMul = Math.max(this.markMul || 1, 1 + markBonusPct);
    }
  }

  applyBurn(dps = 6.5, duration = 2.4, tint = COLORS.lumenGold, sourceAbility = null) {
    if (!this.isActive() || !(dps > 0)) return;
    if (dps >= (this.burnDps || 0) || !this.burnSourceAbility) {
      this.burnSourceAbility = sourceAbility || this.burnSourceAbility || null;
    }
    this.burnDps = Math.max(this.burnDps || 0, dps);
    this.burnTimer = Math.max(this.burnTimer || 0, duration);
    this.burnTint = tint;
    if (this.burnTick === undefined || this.burnTick <= 0) {
      this.burnTick = 0.22;
    }
  }

  /**
   * Advances cooldown and status timers by `dt`. Returns the number of burn DoT ticks to resolve.
   */
  tickStatusTimers(dt) {
    if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    if (this.orbitalHitCooldown > 0) this.orbitalHitCooldown = Math.max(0, this.orbitalHitCooldown - dt);
    if (this.rayHitCooldown > 0) this.rayHitCooldown = Math.max(0, this.rayHitCooldown - dt);
    if (this.coreHitCooldown > 0) this.coreHitCooldown = Math.max(0, this.coreHitCooldown - dt);
    if (this.markTimer > 0) {
      this.markTimer = Math.max(0, this.markTimer - dt);
      if (this.markTimer <= 0) this.markMul = 1;
    }

    let dueBurnTicks = 0;
    if (this.burnTimer > 0 && this.isActive()) {
      this.burnTimer = Math.max(0, this.burnTimer - dt);
      this.burnTick = (this.burnTick ?? 0.22) - dt;
      while (this.burnTick <= 0 && dueBurnTicks < 4) {
        dueBurnTicks += 1;
        this.burnTick += 0.25;
      }
    }
    return dueBurnTicks;
  }

  /**
   * Polymorphic damage resolution (Liskov Substitution Principle).
   * Subclasses like `EclipseCoreBoss` override this for petal shield mechanics.
   */
  takeDamage(
    amount = 10,
    { knockX = 0, knockY = 0, isDot = false, sourceAbility = null } = {}
  ) {
    if (!this.isActive()) return null;
    const wasMarked = (this.markTimer || 0) > 0;
    const effAmount =
      wasMarked && (this.markMul || 1) > 1 ? +(amount * this.markMul).toFixed(3) : amount;
    const isCrit = wasMarked || effAmount >= 20;
    const dealt = Math.min(effAmount, Math.max(0, this.hp));
    this.hp -= effAmount;

    if (this.hp <= 0.001) {
      return {
        killed: true,
        cracked: false,
        kind: this.kind,
        isElite: this.isElite,
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

    this.hitFlashTimer = 0.14;
    this.slowTimer = Math.max(this.slowTimer || 0, 0.25);
    const knockMul = this.isElite ? 0.22 : 1;
    this.vx += knockX * knockMul;
    this.vy += knockY * knockMul;

    return {
      killed: false,
      cracked: false,
      kind: this.kind,
      isElite: this.isElite,
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

  /** Subclass hook for AI movement and attack state machines. */
  updateAI(_dt, _ctx) {}
}
