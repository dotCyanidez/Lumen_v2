import {
  ABILITY_SYNERGIES,
  BLESSINGS,
  ABILITY_TALENT_GROUPS,
} from '../core/Constants.js';

export const RANK_VALS = {
  rv_ricochet_mul: [0, 0.55, 0.7, 0.85, 1.0],
  rv_fan_every: [0, 4, 3, 3, 2],
  rv_fan_mul: [0, 0.6, 0.75, 0.9, 1.0],
  rv_crescendo_pct: [0, 0.55, 0.8, 1.1, 1.45],
  dot_bolt: [0, 4.5, 7, 9.5, 12.5],
  dot_miasma: [0, 4, 6.5, 9, 12],
  pool_150: [0, 5.5, 8.5, 11.5, 15],
  so_ray_len: [0, 60, 82, 104, 126],
  so_ray_pct: [0, 0.25, 0.35, 0.45, 0.55],
  so_surge_cd: [0, 5.5, 4.7, 4.0, 3.3],
  so_surge_dmg: [0, 0.25, 0.4, 0.55, 0.75],
  so_dash_cdr: [0, 0.15, 0.25, 0.35, 0.45],
  so_exec: [0, 0.2, 0.4, 0.6, 0.85],
  vc_fork_pct: [0, 0.45, 0.6, 0.75, 0.95],
  vc_cap: [0, 0.18, 0.28, 0.38, 0.5],
  vc_stun: [0, 0.4, 0.6, 0.8, 1.0],
  vc_dash: [0, 0.12, 0.2, 0.28, 0.38],
  crush: [0, 5.5, 8.5, 11.5, 15.5],
  ap_twin: [0, 0.35, 0.5, 0.65, 0.85],
  ap_siphon_cdr: [0, 0.06, 0.09, 0.12, 0.15],
  ap_siphon_pull: [0, 180, 240, 300, 380],
  sb_mark: [0, 0.12, 0.2, 0.28, 0.38],
  sb_exec: [0, 0.25, 0.4, 0.55, 0.75],
  ss_mitosis: [0, 0.3, 0.45, 0.6, 0.8],
  first_60: [0, 0.15, 0.3, 0.45, 0.6],
  cs_prism: [0, 0.3, 0.45, 0.6, 0.75],
  cs_hang: [0, 0.45, 0.65, 0.85, 1.1],
  cs_after_pct: [0, 0.35, 0.5, 0.65, 0.85],
  cs_twin: [0, 0.45, 0.6, 0.75, 0.95],
  gh_exp: [0, 0.1, 0.2, 0.3, 0.45],
  gh_vac: [0, 240, 300, 360, 440],
  gh_nova: [0, 6.5, 9.5, 12.5, 16],
  gh_dash: [0, 0.2, 0.3, 0.4, 0.5],
  ab_tempo: [0, 0.12, 0.22, 0.32, 0.42],
  ab_bulwark: [0, 4.5, 7, 9.5, 12.5],
  ab_nova: [0, 12, 19, 26, 34],
  ab_speed: [0, 0.2, 0.3, 0.4, 0.55],
  ab_phoenix: [0, 0.25, 0.4, 0.55, 0.75],
  so_lifesteal: [0, 0.18, 0.28, 0.4, 0.55],
  ap_lifesteal: [0, 0.18, 0.28, 0.38, 0.52],
  sb_lifesteal: [0, 0.18, 0.28, 0.4, 0.55],
  as_reflect: [0, 0.12, 0.18, 0.26, 0.35],
  as_overload: [0, 15, 22, 30, 40],
  as_mend_hp: [0, 1.0, 1.8, 2.6, 3.6],
  as_mend_delay: [0, 0.15, 0.25, 0.35, 0.45],
  as_cap_mul: [0, 0.18, 0.32, 0.46, 0.65],
  as_dmg_bonus: [0, 0.1, 0.18, 0.26, 0.35],
  ec_mirror_every: [0, 6, 5, 4, 3],
  ec_syn_pct: [0, 0.03, 0.05, 0.07, 0.09],
};

export const rerollsForRank = (r) => (r > 0 ? 1 + Math.floor((r - 1) / 4) : 0);

/** Computes global Sanctuary upgrade modifiers from saved `upgrades`. */
export function getUpgradeEffects(upgrades = {}) {
  const r = (id) => Math.max(0, Number(upgrades[id]) || 0);
  return {
    extraRerolls: 1 + rerollsForRank(r('astral_reroll')),
    banishes: Math.min(3, r('astral_banish')),
    rareBonus: r('astral_reroll') * 0.025,
    luck: r('astral_reroll') * 0.08,
    globalDmgMul: 1 + r('luminous_force') * 0.015,
    hasteMul: 1 + r('quickening') * 0.015,
    speedMul: 1 + r('tide_current') * 0.01,
    dashRateMul: 1 + r('tide_current') * 0.015,
    magnetMul: 1 + r('starlight_harvest') * 0.03,
    expMul: 1 + r('starlight_harvest') * 0.02,
  };
}

/** Computes typed active talent modifiers for any ability from saved `talentRanks`. */
export function getGroupTalentEffects(abilityId, talentRanks = {}) {
  const rk = (id) => Math.max(0, Number(talentRanks?.[id]) || 0);
  if (abilityId === 'resonant_volley') {
    const ricoR = rk('rv_ricochet');
    const fanR = rk('rv_splitshot');
    const cresR = rk('rv_crescendo');
    return {
      singleDmgMul: 1 + rk('rv_velocity') * 0.08,
      speedMul: 1 + rk('rv_velocity') * 0.12,
      ricochetCount: ricoR >= 3 ? 2 : ricoR >= 1 ? 1 : 0,
      ricochetMul: RANK_VALS.rv_ricochet_mul[ricoR] || 0,
      fanEvery: RANK_VALS.rv_fan_every[fanR] || 0,
      fanDmgMul: RANK_VALS.rv_fan_mul[fanR] || 0,
      burnDps: RANK_VALS.dot_bolt[rk('rv_starfire')] || 0,
      crescendoSplashPct: RANK_VALS.rv_crescendo_pct[cresR] || 0,
      crescendoSparks: cresR,
    };
  }
  if (abilityId === 'solar_orbitals') {
    const mirR = rk('so_mirror');
    const repR = rk('so_repulse');
    return {
      dmgMul: 1 + rk('so_edge') * 0.1,
      speedMul: 1 + rk('so_edge') * 0.06,
      rayLen: RANK_VALS.so_ray_len[rk('so_sunray')] || 0,
      rayPct: RANK_VALS.so_ray_pct[rk('so_sunray')] || 0,
      surgeCooldown: RANK_VALS.so_surge_cd[mirR] || 0,
      surgeBonusPct: RANK_VALS.so_surge_dmg[mirR] || 0,
      knockMul: 1 + repR * 0.25,
      staggerSlow: repR * 0.2,
      heavyDashCdr: RANK_VALS.so_dash_cdr[repR] || 0,
      eliteExecBonus: RANK_VALS.so_exec[rk('so_execution')] || 0,
      lifestealPct: RANK_VALS.so_lifesteal[rk('so_execution')] || 0,
    };
  }
  if (abilityId === 'voltaic_chain') {
    const relR = rk('vc_relay');
    const stR = rk('vc_stun');
    return {
      dmgMul: 1 + rk('vc_charge') * 0.1,
      reachMul: 1 + rk('vc_charge') * 0.06 + relR * 0.08,
      extraTargets: relR >= 3 ? 2 : relR >= 1 ? 1 : 0,
      forkPct: RANK_VALS.vc_fork_pct[rk('vc_fork')] || 0,
      capPerUnused: RANK_VALS.vc_cap[rk('vc_capacitor')] || 0,
      stunSec: RANK_VALS.vc_stun[stR] || 0,
      killDashRestore: RANK_VALS.vc_dash[stR] || 0,
    };
  }
  if (abilityId === 'astral_pulse') {
    const siphR = rk('ap_siphon');
    return {
      dmgMul: 1 + rk('ap_swell') * 0.1,
      radiusMul: 1 + rk('ap_swell') * 0.05,
      vortexPull: rk('ap_vortex') > 0,
      crushDmg: RANK_VALS.crush[rk('ap_singularity')] || 0,
      twinPct: RANK_VALS.ap_twin[rk('ap_twinwave')] || 0,
      siphonPerHit: RANK_VALS.ap_siphon_cdr[siphR] || 0,
      siphonPullRadius: RANK_VALS.ap_siphon_pull[siphR] || 0,
      lifestealPct: RANK_VALS.ap_lifesteal[siphR] || 0,
    };
  }
  if (abilityId === 'seeker_barrage') {
    const twR = rk('sb_twin');
    const piR = rk('sb_pierce');
    const exR = rk('sb_execute');
    return {
      dmgMul: 1 + rk('sb_guidance') * 0.1,
      turnMul: 1 + rk('sb_guidance') * 0.12,
      extraCount: twR >= 3 ? 2 : twR >= 1 ? 1 : 0,
      speedMul: 1 + twR * 0.1,
      extraPierce: piR >= 3 ? 2 : piR >= 1 ? 1 : 0,
      markBonus: RANK_VALS.sb_mark[rk('sb_mark')] || 0,
      executeBonus: RANK_VALS.sb_exec[exR] || 0,
      killedSalvo: exR >= 3 ? 2 : exR >= 1 ? 1 : 0,
      lifestealPct: RANK_VALS.sb_lifesteal[exR] || 0,
    };
  }
  if (abilityId === 'starbloom_spores') {
    const drR = rk('ss_drift');
    const chR = rk('ss_chain');
    return {
      dmgMul: 1 + rk('ss_potency') * 0.1,
      radiusMul: 1 + rk('ss_potency') * 0.06,
      driftMul: drR * 0.22,
      triggerMul: 1 + drR * 0.06,
      clusterSparks: chR,
      mitosisChance: RANK_VALS.ss_mitosis[chR] || 0,
      burnDps: RANK_VALS.dot_miasma[rk('ss_miasma')] || 0,
      poolDps: RANK_VALS.pool_150[rk('ss_garden')] || 0,
    };
  }
  if (abilityId === 'celestial_spear') {
    const impR = rk('cs_impale');
    const afR = rk('cs_afterglow');
    return {
      dmgMul: 1 + rk('cs_caliber') * 0.1,
      widthMul: 1 + rk('cs_caliber') * 0.1,
      extraPierce: impR >= 3 ? 2 : impR >= 1 ? 1 : 0,
      firstTargetBonus: RANK_VALS.first_60[impR] || 0,
      prismPct: RANK_VALS.cs_prism[rk('cs_prism')] || 0,
      afterglowHang: RANK_VALS.cs_hang[afR] || 0,
      afterglowPct: RANK_VALS.cs_after_pct[afR] || 0,
      twinPct: RANK_VALS.cs_twin[rk('cs_crossfire')] || 0,
    };
  }
  if (abilityId === 'gravity_harvest') {
    const shR = rk('gh_shimmer');
    const novR = rk('gh_nova');
    return {
      magnetMul: 1 + rk('gh_attractor') * 0.1,
      expScoreMul: 1 + (RANK_VALS.gh_exp[rk('gh_greed')] || 0),
      bountyLum: shR,
      spawnGoldMote: shR > 0,
      vacuumRadius: RANK_VALS.gh_vac[rk('gh_vacuum')] || 0,
      specialNovaDmg: RANK_VALS.gh_nova[novR] || 0,
      specialDashEnergy: RANK_VALS.gh_dash[novR] || 0,
    };
  }
  if (abilityId === 'aegis_bloom') {
    const novR = rk('ab_nova');
    const radR = rk('ab_radiance');
    return {
      graceMul: 1 + rk('ab_mantle') * 0.1,
      wardRateMul: 1 + (RANK_VALS.ab_tempo[rk('ab_tempo')] || 0),
      bulwarkPulseDmg: RANK_VALS.ab_bulwark[rk('ab_bulwark')] || 0,
      novaDmg: RANK_VALS.ab_nova[novR] || 0,
      novaSpeedBonus: RANK_VALS.ab_speed[novR] || 0,
      phoenixDashRestore: radR > 0 ? 1 : 0,
      phoenixDmgBonus: RANK_VALS.ab_phoenix[radR] || 0,
    };
  }
  if (abilityId === 'astral_shield') {
    const plR = rk('as_plating');
    const mendR = rk('as_mending');
    const basR = rk('as_bastion');
    return {
      flatCap: plR * 6,
      regenMul: 1 + plR * 0.06,
      reflectPct: RANK_VALS.as_reflect[rk('as_reflect')] || 0,
      overloadDmg: RANK_VALS.as_overload[rk('as_overcharge')] || 0,
      mendHpPerSec: RANK_VALS.as_mend_hp[mendR] || 0,
      delayReducePct: RANK_VALS.as_mend_delay[mendR] || 0,
      capMul: 1 + (RANK_VALS.as_cap_mul[basR] || 0),
      shieldedDmgBonus: RANK_VALS.as_dmg_bonus[basR] || 0,
    };
  }
  if (abilityId === 'echo_conduit') {
    const chR = rk('ec_singularity');
    return {
      hasteMul: 1 + rk('ec_tempo') * 0.025 + rk('ec_overclock') * 0.03,
      reachMul: 1 + rk('ec_tempo') * 0.04,
      mirrorEvery: RANK_VALS.ec_mirror_every[rk('ec_twinbeat')] || 0,
      globalDmgMul: 1 + rk('ec_empower') * 0.04,
      synergyDmgBonus: RANK_VALS.ec_syn_pct[chR] || 0,
      chromaticWaveDmg: chR > 0 ? +(7.5 + (chR - 1) * 3.5).toFixed(2) : 0,
    };
  }
  return {};
}

export function getActiveSynergies(abilityRanks) {
  if (!abilityRanks) return [];
  const rank = (id) =>
    abilityRanks instanceof Map ? abilityRanks.get(id) || 0 : abilityRanks[id] || 0;
  return ABILITY_SYNERGIES.filter((s) => s.pair.every((id) => rank(id) >= s.minRank));
}

export function getSynergyHintsForAbility(abilityId, abilityRanks) {
  const hints = [];
  const getRank = (id) =>
    abilityRanks instanceof Map ? abilityRanks.get(id) || 0 : abilityRanks?.[id] || 0;
  const selfRank = getRank(abilityId);
  for (const syn of ABILITY_SYNERGIES) {
    if (!syn.pair.includes(abilityId)) continue;
    const partnerId = syn.pair.find((id) => id !== abilityId);
    const partner = BLESSINGS.find((b) => b.id === partnerId);
    const partnerRank = getRank(partnerId);
    const active = selfRank >= syn.minRank && partnerRank >= syn.minRank;
    const readyNow = !active && selfRank + 1 >= syn.minRank && partnerRank >= syn.minRank;
    hints.push({
      id: syn.id,
      name: syn.name,
      partnerId,
      partnerName: partner?.name || partnerId,
      partnerRank,
      minRank: syn.minRank,
      active,
      readyNow,
    });
  }
  return hints;
}

export function isStartAbilityUnlocked(abilityId, talentRanks = {}) {
  const def = BLESSINGS.find((b) => b.id === abilityId);
  if (!def) return false;
  if (def.startsUnlocked) return true;
  const group = ABILITY_TALENT_GROUPS.get(abilityId);
  return group ? group.some((n) => (talentRanks?.[n.id] || 0) > 0) : false;
}
