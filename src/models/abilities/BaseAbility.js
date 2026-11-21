/**
 * Abstract OOP Base Class for all Automatic Abilities (SOLID: SRP, OCP, LSP, DIP).
 * Encapsulates cooldown cadence, rank/build lookups, and base damage scaling
 * with zero PixiJS or DOM imports.
 */
export class BaseAbility {
  constructor(id, defaultInterval = 1.0) {
    this.id = id;
    this.defaultInterval = defaultInterval;
    this.timer = 0.25;
  }

  reset(initialDelay = 0.25) {
    this.timer = initialDelay;
  }

  shaveCooldown(sec, minFloor = 0.02) {
    if (sec > 0) {
      this.timer = Math.max(minFloor, this.timer - sec);
    }
  }

  tickCooldown(dt, hasteMul = 1, rateMul = 1) {
    this.timer -= dt * hasteMul * rateMul;
    return this.timer <= 0;
  }

  computeBaseDamage(st, fx, globalDmgMul = 1, extraMul = 1) {
    const stMul = st?.dmgMul || 1;
    const fxMul = fx?.dmgMul ?? fx?.singleDmgMul ?? 1;
    return +(10 * stMul * fxMul * extraMul * globalDmgMul).toFixed(3);
  }

  /** Subclass hook executed each simulation tick when ability rank > 0. */
  update(_dt, _ctx) {}

  static getEnemiesSortedByDist(enemies, cx, cy, maxRange) {
    const maxSq = maxRange * maxRange;
    const matches = [];
    const list = enemies?.enemies || [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e || e._removed || e.age < e.spawnDelay) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= maxSq) {
        matches.push({ enemy: e, dSq });
      }
    }
    matches.sort((a, b) => a.dSq - b.dSq);
    return matches;
  }
}
