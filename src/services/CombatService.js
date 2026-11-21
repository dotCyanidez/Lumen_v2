/**
 * Pure domain service for combat math: lifesteal healing, Starlight Shield
 * capacity/absorption/reflect, and Aegis Ward cooldown & block math.
 */
export class CombatService {
  /**
   * Computes HP healed from ability damage dealt (scales by 0.1 to match 10x enemy damage vs 1x player HP).
   */
  static computeLifestealHeal(dealtDmg, lifestealPct, currentHp, maxHp) {
    if (!(dealtDmg > 0) || !(lifestealPct > 0) || currentHp >= maxHp) return 0;
    const rawHeal = dealtDmg * lifestealPct * 0.1;
    const nextHp = Math.min(maxHp, currentHp + rawHeal);
    return Math.max(0, nextHp - currentHp);
  }

  /**
   * Computes max Starlight Shield capacity from ability rank, buildState, and talent effects.
   */
  static computeMaxShield(rank, shieldBuildState = null, shieldTalentFx = null) {
    if (rank <= 0) return 0;
    const evoShieldBonus = rank >= 10 ? 30 : rank >= 5 ? 15 : 0;
    const baseCap =
      35 + evoShieldBonus + (shieldBuildState?.shieldCapAdd || 0) + (shieldTalentFx?.flatCap || 0);
    return Math.round(baseCap * (shieldTalentFx?.capMul || 1));
  }

  /**
   * Resolves incoming hit absorption against Starlight Shield and returns reflect/overload triggers.
   */
  static resolveShieldAbsorption({
    incomingDamage,
    currentShield,
    shieldRank = 0,
    shieldFx = null,
    dmgBonus = 1,
  }) {
    const cleanDmg = Math.max(1, Math.round(incomingDamage));
    if (!(currentShield > 0)) {
      return {
        absorbed: 0,
        remainingDamage: cleanDmg,
        nextShield: 0,
        shieldBroken: false,
        reflectDmg: 0,
        triggerStaticPulse: false,
        overloadDmg: 0,
      };
    }

    const absorbed = Math.min(currentShield, cleanDmg);
    const nextShield = Math.max(0, currentShield - absorbed);
    const remainingDamage = Math.max(0, cleanDmg - absorbed);
    const shieldBroken = nextShield <= 0 && absorbed > 0;
    const reflectDmg =
      shieldFx?.reflectPct > 0 && absorbed > 0
        ? +(absorbed * shieldFx.reflectPct * 10 * dmgBonus).toFixed(3)
        : 0;
    const overloadDmg =
      shieldBroken && shieldFx?.overloadDmg > 0
        ? +(shieldFx.overloadDmg * dmgBonus).toFixed(3)
        : 0;

    return {
      absorbed,
      remainingDamage,
      nextShield,
      shieldBroken,
      reflectDmg,
      triggerStaticPulse: shieldBroken && shieldRank >= 5,
      overloadDmg,
    };
  }
}
