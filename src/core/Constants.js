export const GAME_STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DYING: 'dying',
  GAMEOVER: 'gameover',
};

export const GAME_MODES = {
  ARCADE: 'arcade',
  DAILY: 'daily',
  ZEN: 'zen',
};

export const SPIRIT_ASPECTS = [
  {
    id: 'wisp',
    name: 'Azure Wisp',
    tag: 'BALANCED',
    desc: 'Balanced 100 HP & Solar Dash',
    unlockLuminance: 0,
    maxHealth: 100,
    dashCharges: 2,
    dashSpeedMul: 1.0,
    dashRechargeMul: 1.0,
    speedMul: 1.0,
    magnetMul: 1.0,
    arcReachMul: 1.0,
    colorHex: 0x5ff7eb,
    accentHex: 0xffe699,
  },
  {
    id: 'tempest',
    name: 'Solar Tempest',
    tag: '3 DASHES',
    desc: '3 Dashes · Wide Arc · 75 HP',
    unlockLuminance: 180,
    maxHealth: 75,
    dashCharges: 3,
    dashSpeedMul: 1.08,
    dashRechargeMul: 0.94,
    speedMul: 1.05,
    magnetMul: 0.95,
    arcReachMul: 1.35,
    colorHex: 0xffe484,
    accentHex: 0x5ff7eb,
  },
  {
    id: 'oracle',
    name: 'Tidal Oracle',
    tag: 'AURIC AURA',
    desc: '135 HP · +38% Magnet Reach',
    unlockLuminance: 420,
    maxHealth: 135,
    dashCharges: 2,
    dashSpeedMul: 0.96,
    dashRechargeMul: 1.0,
    speedMul: 0.98,
    magnetMul: 1.38,
    arcReachMul: 1.0,
    colorHex: 0x8ef2ff,
    accentHex: 0xb8ffea,
  },
  {
    id: 'comet',
    name: 'Astral Comet',
    tag: 'HYPER VELOCITY',
    desc: '+24% Dash Speed · Fast Recharge · 95 HP',
    unlockLuminance: 750,
    maxHealth: 95,
    dashCharges: 2,
    dashSpeedMul: 1.24,
    dashRechargeMul: 0.78,
    speedMul: 1.12,
    magnetMul: 1.08,
    arcReachMul: 1.15,
    colorHex: 0xff9ec7,
    accentHex: 0xffe699,
  },
];

export const MAX_ABILITY_SLOTS = 6;

export const ENEMY_STATS = {
  stalker: { hp: 10, exp: 10, damage: 22 },
  manta: { hp: 10, exp: 12, damage: 20 },
  lancer: { hp: 10, exp: 15, damage: 28 },
  sentinel: { hp: 20, exp: 20, damage: 24 },
  spitter: { hp: 20, exp: 22, damage: 18, projectileDamage: 18 },
  artillery: { hp: 30, exp: 32, damage: 22, projectileDamage: 20 },
  warden: { hp: 30, exp: 28, damage: 30 },
  vortex: { hp: 30, exp: 32, damage: 26 },
  harbinger: { hp: 420, exp: 75, damage: 28, projectileDamage: 20, isElite: true },
  behemoth: { hp: 640, exp: 90, damage: 34, projectileDamage: 22, isElite: true },
  core: { shields: 50, hp: 10, exp: 65, damage: 32 },
};

export function getExpForNextLevel(level) {
  const step = Math.max(0, level - 1);
  return Math.round((45 + step * 30 + step * step * 3.5) / 5) * 5;
}

/** Cumulative Max HP gained from Spirit level progression (scales up per level). */
export function getLevelMaxHpBonus(level) {
  const lv = Math.max(1, Math.floor(level));
  let bonus = 0;
  for (let l = 2; l <= lv; l++) {
    bonus += 4 + Math.ceil(l * 0.8);
  }
  return bonus;
}

export const STARLIGHT_CONFIG = {
  baseInterval: 0.80,
  baseRange: 360,
  boltSpeed: 740,
};

export const BLESSINGS = [
  // Standard Starting Weapon (starts unlocked at LV 1 so its aspects can drop immediately)
  {
    id: 'resonant_volley',
    name: 'Starlight Bolt',
    category: 'damage',
    tag: 'DAMAGE · BOLT',
    startsUnlocked: true,
    desc: 'Lumen’s automatic starlight bolt firing at nearby shadows.',
  },
  // Unlockable Automatic Damage Abilities
  {
    id: 'solar_orbitals',
    name: 'Orbiting Blades',
    category: 'damage',
    tag: 'DAMAGE · ORBITAL',
    desc: 'Summons 2 crystalline blades orbiting Lumen to slice nearby shadows.',
  },
  {
    id: 'voltaic_chain',
    name: 'Voltaic Arc',
    category: 'damage',
    tag: 'DAMAGE · LIGHTNING',
    desc: 'Strikes nearby shadows with Chain Lightning arcing across 2 targets.',
  },
  {
    id: 'astral_pulse',
    name: 'Astral Pulse',
    category: 'damage',
    tag: 'DAMAGE · NOVA',
    desc: 'Releases an automatic shockwave nova that damages & pushes shadows back.',
  },
  {
    id: 'seeker_barrage',
    name: 'Seeker Needles',
    category: 'damage',
    tag: 'DAMAGE · HOMING',
    desc: 'Launches 2 curved homing starlight needles toward distant shadows.',
  },
  {
    id: 'starbloom_spores',
    name: 'Starbloom Spores',
    category: 'damage',
    tag: 'DAMAGE · BLOOM',
    desc: 'Releases drifting bioluminescent starblooms that burst in starlight when shadows near.',
  },
  {
    id: 'celestial_spear',
    name: 'Celestial Spear',
    category: 'damage',
    tag: 'DAMAGE · PIERCE',
    desc: 'Fires a piercing radiant beam lance through up to 3 aligned shadows.',
  },

  // Unlockable Utility & Sanctuary Cores
  {
    id: 'gravity_harvest',
    name: 'Gravity Harvest',
    category: 'utility',
    tag: 'UTILITY · MAGNET',
    desc: '+25% Magnet reach, Constellation Star pull & +10% more EXP.',
  },
  {
    id: 'aegis_bloom',
    name: 'Aegis Sanctuary',
    category: 'utility',
    tag: 'UTILITY · WARD',
    desc: 'Restores +30 HP & grants a recharging hit-blocking Ward.',
  },
  {
    id: 'astral_shield',
    name: 'Starlight Shield',
    category: 'utility',
    tag: 'UTILITY · SHIELD',
    desc: 'Generates a 35 HP regenerating Shield that absorbs hits before HP.',
  },
  {
    id: 'echo_conduit',
    name: 'Chrono Conduit',
    category: 'utility',
    tag: 'UTILITY · HASTE',
    desc: 'All abilities trigger 10% faster.',
  },
];

const BLESSINGS_BY_ID = Object.fromEntries(BLESSINGS.map((b) => [b.id, b]));

export const CARD_RARITIES = {
  common: { id: 'common', label: 'COMMON', mult: 1.0, baseWeight: 62 },
  uncommon: { id: 'uncommon', label: 'UNCOMMON', mult: 1.6, baseWeight: 24 },
  rare: { id: 'rare', label: 'RARE', mult: 2.25, baseWeight: 10 },
  epic: { id: 'epic', label: 'EPIC', mult: 3.0, baseWeight: 4 },
};

export const ABILITY_EVOLUTIONS = {
  resonant_volley: { name: 'Forked Light', desc: 'Bolts split into 2 starlight sparks on kill.' },
  solar_orbitals: { name: 'Harmonic Halo', desc: 'Orbit ring periodically scorches shadows.' },
  voltaic_chain: { name: 'Ion Anchor', desc: 'Final chain hit erupts in a static shockwave.' },
  astral_pulse: { name: 'Echo Wave', desc: 'Fires a second trailing shockwave behind each nova.' },
  seeker_barrage: { name: 'Starburst', desc: 'Needles burst in a tight starlight splash on hit.' },
  starbloom_spores: { name: 'Chain Pollen', desc: 'Detonating blooms fire seeking sparks.' },
  celestial_spear: { name: 'Afterglow Lance', desc: 'Beam wake lingers & scorches crossing shadows.' },
  gravity_harvest: { name: 'Orbital Singularity', desc: 'Every 10 motes collected unleashes a 150px Gravity Nova & pull.' },
  aegis_bloom: { name: 'Sanctuary Aura', desc: 'Ward block heals +12 HP and cuts Ward recharge by 20%.' },
  astral_shield: { name: 'Prismatic Bulwark', desc: '+15 Max Shield & emits a 140px static pulse on full recharge or break.' },
  echo_conduit: { name: 'Harmonic Overclock', desc: '+12% global Haste & every 5th cast emits a slowing Chrono Ripple.' },
};

function buildTalentCosts(start, mult, maxRank) {
  return Array.from({ length: maxRank }, (_, i) =>
    Math.round((start * Math.pow(mult, i)) / 50) * 50
  );
}

const fmtPct = (v) => `${Number(v.toFixed(1))}`;
const rerollsForRank = (r) => (r > 0 ? 1 + Math.floor((r - 1) / 4) : 0);

export const SANCTUARY_UPGRADES = [
  {
    id: 'astral_reroll',
    name: 'Astral Foresight',
    desc: '+1 Extra Reroll at Rank 1 & every 4 ranks (all runs start with 1 free Reroll) + higher card rarity Luck.',
    effectLabel: (r) => {
      const rr = rerollsForRank(r);
      return `+${rr} Extra Reroll${rr > 1 ? 's' : ''} · +${fmtPct(r * 2.5)}% Luck`;
    },
    costs: buildTalentCosts(1100, 1.15, 20),
  },
  {
    id: 'astral_banish',
    name: 'Void Banish',
    desc: 'Unlock +1 Banish per rank (max 3) to permanently banish all cards for an ability from a run.',
    effectLabel: (r) => `${r} / 3 Banish${r > 1 ? 'es' : ''}`,
    costs: [900, 1900, 3400],
  },
  {
    id: 'luminous_force',
    name: 'Radiant Core',
    desc: '+1.5% all automatic Damage per rank.',
    effectLabel: (r) => `+${fmtPct(r * 1.5)}% Damage`,
    costs: buildTalentCosts(950, 1.13, 25),
  },
  {
    id: 'quickening',
    name: 'Tempo Flow',
    desc: 'All abilities fire 1.5% faster per rank.',
    effectLabel: (r) => `${fmtPct(r * 1.5)}% Faster`,
    costs: buildTalentCosts(950, 1.13, 25),
  },
  {
    id: 'tide_current',
    name: 'Drift Current',
    desc: '+1% glide speed & +1.5% Solar Dash recharge per rank.',
    effectLabel: (r) => `+${r}% Spd · +${fmtPct(r * 1.5)}% Dash`,
    costs: buildTalentCosts(900, 1.14, 20),
  },
  {
    id: 'starlight_harvest',
    name: 'Magnet Tide',
    desc: '+3% Magnet reach & +2% EXP per rank.',
    effectLabel: (r) => `+${r * 3}% Mag · +${r * 2}% EXP`,
    costs: buildTalentCosts(1000, 1.14, 20),
  },
];

const T1_COSTS = [750, 1200, 1800, 2550];
const T2_COSTS = [1140, 1740, 2460, 3300];
const T3_COSTS = [1650, 2400, 3450, 4650];
const scaleCosts = (arr, mul = 1) => arr.map((c) => Math.round((c * mul) / 10) * 10);

const tn = (abilityId, id, slot, name, glyph, costs, requires, desc, rankText) => ({
  abilityId,
  id,
  slot,
  name,
  glyph,
  costs,
  maxLevel: costs.length,
  requires,
  desc,
  rankText,
});

const step = (arr, r) => arr[Math.max(0, Math.min(arr.length - 1, r - 1))];

export const ABILITY_TALENTS = [
  // 1. Starlight Bolt (Precision Ricochet & Fan Salvos vs Starfire Supernova)
  tn('resonant_volley', 'rv_velocity', 'root', 'Focus Bolt', 'force', T1_COSTS, null,
    'Sharpens single-target Bolt impact damage and projectile flight speed.',
    (r) => `+${r * 8}% single-target dmg & +${r * 12}% speed`),
  tn('resonant_volley', 'rv_ricochet', 'leftMid', 'Prismatic Ricochet', 'chain', T2_COSTS, 'rv_velocity',
    'Bolts ricochet cleanly toward nearby unhit shadows after impact.',
    (r) => `+${r >= 3 ? 2 : 1} ricochet${r >= 3 ? 's' : ''} (${step([55, 70, 85, 100], r)}% dmg)`),
  tn('resonant_volley', 'rv_splitshot', 'leftCap', 'Fan Salvo', 'prism', T3_COSTS, 'rv_ricochet',
    'Every few volleys launches two extra angled flanking Starlight Bolts.',
    (r) => `Every ${step(['4th', '3rd', '3rd', '2nd'], r)} volley fires +2 flanking Bolts (${step([60, 75, 90, 100], r)}% dmg)`),
  tn('resonant_volley', 'rv_starfire', 'rightMid', 'Starfire Burn', 'burn', T2_COSTS, 'rv_velocity',
    'Bolts sear struck shadows with an incandescent 2.4s Starfire burn.',
    (r) => `${step([4.5, 7, 9.5, 12.5], r)} dmg/s burn (2.4s)`),
  tn('resonant_volley', 'rv_crescendo', 'rightCap', 'Supernova Finale', 'blast', T3_COSTS, 'rv_starfire',
    'Every 4th Bolt volley detonates on hit in a 64px astral flash & releases homing sparks.',
    (r) => `4th volley blasts (${step([55, 80, 110, 145], r)}% AoE) & scatters ${r} spark${r > 1 ? 's' : ''}`),

  // 2. Orbiting Blades (Outward Sunbeam Lasers vs Kinetic Deflector)
  tn('solar_orbitals', 'so_edge', 'root', 'Radiant Edge', 'prism', T1_COSTS, null,
    'Empowers Orbiting Blade slash damage and rotational orbit speed.',
    (r) => `+${r * 10}% blade dmg & +${r * 6}% orbit speed`),
  tn('solar_orbitals', 'so_sunray', 'leftMid', 'Solar Rays', 'prism', T2_COSTS, 'so_edge',
    'Each Blade projects a sweeping outward laser ray slicing shadows beyond its orbit.',
    (r) => `+${step([60, 82, 104, 126], r)}px outward blade laser (${step([35, 50, 65, 85], r)}% dmg)`),
  tn('solar_orbitals', 'so_mirror', 'leftCap', 'Corona Expansion', 'tempo', T3_COSTS, 'so_sunray',
    'Periodically expands Blades 1.45× outward for 1.6s while surging slash & laser damage.',
    (r) => `Every ${step([5.5, 4.7, 4.0, 3.3], r)}s surges 1.45× wide (+${step([25, 40, 55, 75], r)}% dmg)`),
  tn('solar_orbitals', 'so_repulse', 'rightMid', 'Void Deflector', 'force', T2_COSTS, 'so_edge',
    'Hurls slashed shadows harder and shaves Solar Dash cooldown on Elite/Lancer hits.',
    (r) => `+${r * 25}% knockback & -${step([0.15, 0.25, 0.35, 0.45], r)}s Dash on Heavy slash`),
  tn('solar_orbitals', 'so_execution', 'rightCap', 'Eclipse Cleave', 'shield', T3_COSTS, 'so_repulse',
    'Delivers heavy finishing slashes against Elites, Cores & wounded shadows, lifestealing a portion of Blade damage as HP.',
    (r) => `+${step([20, 40, 60, 85], r)}% finisher dmg · Lifesteal ${step([18, 28, 40, 55], r)}% dmg`),

  // 3. Voltaic Arc (Twin-Fork Lightning vs Single-Target Capacitor & Paralysis)
  tn('voltaic_chain', 'vc_charge', 'root', 'Overcharged Coil', 'chain', T1_COSTS, null,
    'Amplifies lightning arc damage and extends jump reach.',
    (r) => `+${r * 10}% arc dmg & +${r * 6}% reach`),
  tn('voltaic_chain', 'vc_relay', 'leftMid', 'Relay Conduit', 'chain', T2_COSTS, 'vc_charge',
    'Adds extra chain bounce targets and widens inter-shadow jump reach.',
    (r) => `+${r >= 3 ? 2 : 1} chain bounce${r >= 3 ? 's' : ''} & +${r * 8}% reach`),
  tn('voltaic_chain', 'vc_fork', 'leftCap', 'Twin-Arc Fork', 'chain', T3_COSTS, 'vc_relay',
    'Discharges two simultaneous forked lightning chains from Lumen at once.',
    (r) => `Simultaneous 2nd fork chain (${step([45, 60, 75, 95], r)}% dmg)`),
  tn('voltaic_chain', 'vc_capacitor', 'rightMid', 'Feedback Capacitor', 'force', T2_COSTS, 'vc_charge',
    'Each unused bounce surges back into the final struck target for heavy single-target burst.',
    (r) => `+${step([18, 28, 38, 50], r)}% burst dmg per unused chain bounce`),
  tn('voltaic_chain', 'vc_stun', 'rightCap', 'Paralyzing Surge', 'tempo', T3_COSTS, 'vc_capacitor',
    'Temporarily stalls electrocuted shadows and restores Solar Dash energy on Arc kills.',
    (r) => `${step([0.4, 0.6, 0.8, 1.0], r)}s jolt slow & +${step([0.12, 0.2, 0.28, 0.38], r)}s Dash on kill`),

  // 4. Astral Pulse (Gravity Implosion vs Twin Echo Siphon)
  tn('astral_pulse', 'ap_swell', 'root', 'Tidal Resonance', 'blast', T1_COSTS, null,
    'Strengthens radial shockwave damage and expands pulse radius.',
    (r) => `+${r * 10}% pulse dmg & +${r * 5}% radius`),
  tn('astral_pulse', 'ap_vortex', 'leftMid', 'Gravity Well', 'force', [2250], 'ap_swell',
    'Reverses Astral Pulse into a Gravity Collapse pulling shadows inward.',
    () => 'Pulls struck shadows inward instead of pushing away'),
  tn('astral_pulse', 'ap_singularity', 'leftCap', 'Singularity Crush', 'blast', T3_COSTS, 'ap_vortex',
    'Implodes shadows pulled near Lumen with a delayed crushing shockwave.',
    (r) => `Delayed implode (${step([5.5, 8.5, 11.5, 15.5], r)} AoE dmg & 1.1s stasis)`),
  tn('astral_pulse', 'ap_twinwave', 'rightMid', 'Harmonic Double-Wave', 'blast', T2_COSTS, 'ap_swell',
    'Astral Pulse echoes a second rapid pulse wave 0.26s after triggering.',
    (r) => `Echo wave after 0.26s (${step([35, 50, 65, 85], r)}% dmg)`),
  tn('astral_pulse', 'ap_siphon', 'rightCap', 'Tidal Siphon', 'hoard', T3_COSTS, 'ap_twinwave',
    'Shaves Pulse cooldown per hit, pulls Motes inward, and lifesteals a percentage of Pulse damage dealt as HP.',
    (r) => `-${step([0.06, 0.09, 0.12, 0.15], r)}s CD/hit · ${step([180, 240, 300, 380], r)}px pull · Lifesteal ${step([18, 28, 38, 52], r)}% dmg`),

  // 5. Seeker Needles (Ghostbreaker Pierce vs Starlight Execution Mark)
  tn('seeker_barrage', 'sb_guidance', 'root', 'Luminous Guidance', 'prism', scaleCosts(T1_COSTS, 1.1), null,
    'Boosts Seeker Needle damage and sharpens tracking turn rate.',
    (r) => `+${r * 10}% dmg & +${r * 12}% turn speed`),
  tn('seeker_barrage', 'sb_twin', 'leftMid', 'Twin Volleys', 'prism', scaleCosts(T2_COSTS, 1.1), 'sb_guidance',
    'Fires extra homing Needles and accelerates Needle flight velocity.',
    (r) => `+${r >= 3 ? 2 : 1} needle${r >= 3 ? 's' : ''} & +${r * 10}% speed`),
  tn('seeker_barrage', 'sb_pierce', 'leftCap', 'Ghostbreaker Pierce', 'force', scaleCosts(T3_COSTS, 1.1), 'sb_twin',
    'Needles pierce shadows and automatically bend mid-flight to re-acquire fresh targets.',
    (r) => `+${r >= 3 ? 2 : 1} pierce & homing re-lock after pass-through`),
  tn('seeker_barrage', 'sb_mark', 'rightMid', 'Starlight Mark', 'prism', scaleCosts(T2_COSTS, 1.1), 'sb_guidance',
    'Hits paint a 3.5s Starlight Mark amplifying ALL incoming damage on the target.',
    (r) => `Marked shadows take +${step([12, 20, 28, 38], r)}% dmg from all sources (3.5s)`),
  tn('seeker_barrage', 'sb_execute', 'rightCap', 'Guillotine Salvo', 'chain', scaleCosts(T3_COSTS, 1.1), 'sb_mark',
    'Deals finisher damage below 45% HP, fires free Needles on Marked purges, and lifesteals % of Needle damage as HP.',
    (r) => `+${step([25, 40, 55, 75], r)}% <45% HP · +${r >= 3 ? 2 : 1} Needle on kill · Lifesteal ${step([18, 28, 40, 55], r)}% dmg`),

  // 6. Starbloom Spores (Drift Mitosis vs Living Spore Sanctuary)
  tn('starbloom_spores', 'ss_potency', 'root', 'Radiant Pollen', 'blast', scaleCosts(T1_COSTS, 1.15), null,
    'Increases Starbloom burst damage and widens detonation radius.',
    (r) => `+${r * 10}% bloom dmg & +${r * 6}% blast radius`),
  tn('starbloom_spores', 'ss_drift', 'leftMid', 'Blooming Drift', 'force', scaleCosts(T2_COSTS, 1.15), 'ss_potency',
    'Armed spores drift toward nearby shadows with wider trigger detection.',
    (r) => `+${r * 22}% shadow drift & +${r * 6}% trigger area`),
  tn('starbloom_spores', 'ss_chain', 'leftCap', 'Spore Mitosis', 'prism', scaleCosts(T3_COSTS, 1.15), 'ss_drift',
    'Bursts scatter homing sparks and can bud a fresh mini-spore in place.',
    (r) => `${r} spark${r > 1 ? 's' : ''} & ${step([30, 45, 60, 80], r)}% chance to bud mini-spore`),
  tn('starbloom_spores', 'ss_miasma', 'rightMid', 'Solar Miasma', 'burn', scaleCosts(T2_COSTS, 1.15), 'ss_potency',
    'Blooms sear caught shadows with a lingering 2.6s starlight miasma.',
    (r) => `${step([4, 6.5, 9, 12], r)} dmg/s miasma DoT (2.6s)`),
  tn('starbloom_spores', 'ss_garden', 'rightCap', 'Blighted Blossom Pool', 'zone', scaleCosts(T3_COSTS, 1.15), 'ss_miasma',
    'Detonated blooms unfurl a 76px glowing mist pool slowing & damaging entrants.',
    (r) => `76px spore mist (${step([5.5, 8.5, 11.5, 15], r)} dmg/s, 3.2s)`),

  // 7. Celestial Spear (Prismatic Railgun vs Residual Twin Lance)
  tn('celestial_spear', 'cs_caliber', 'root', 'Lance Caliber', 'prism', scaleCosts(T1_COSTS, 1.2), null,
    'Boosts Celestial Spear beam damage and widens laser corridor.',
    (r) => `+${r * 10}% beam dmg & +${r * 10}% beam width`),
  tn('celestial_spear', 'cs_impale', 'leftMid', 'Armor Shatter', 'force', scaleCosts(T2_COSTS, 1.2), 'cs_caliber',
    'Adds extra beam pierce and amplifies single-target damage on first hit.',
    (r) => `+${r >= 3 ? 2 : 1} pierce & +${step([15, 30, 45, 60], r)}% first-target dmg`),
  tn('celestial_spear', 'cs_prism', 'leftCap', 'Prismatic Split', 'prism', scaleCosts(T3_COSTS, 1.2), 'cs_impale',
    'Each pierced target refracts 2 angled radiant prism rays outward.',
    (r) => `Refracts 2 sparks (${step([30, 45, 60, 75], r)}% beam dmg)`),
  tn('celestial_spear', 'cs_afterglow', 'rightMid', 'Suspended Afterglow', 'tempo', scaleCosts(T2_COSTS, 1.2), 'cs_caliber',
    'Suspends the laser line longer in space to sear corridor foes a second time.',
    (r) => `+${step([0.45, 0.65, 0.85, 1.1], r)}s beam hang & ${step([35, 50, 65, 85], r)}% afterglow wave`),
  tn('celestial_spear', 'cs_crossfire', 'rightCap', 'Twin Celestial Lance', 'prism', scaleCosts(T3_COSTS, 1.2), 'cs_afterglow',
    'Simultaneously fires a second Celestial Spear at another nearby threat.',
    (r) => `Fires 2nd intersecting Spear (${step([45, 60, 75, 95], r)}% dmg)`),

  // 8. Gravity Harvest (Luminous Alchemy vs Vacuum Supercharge)
  tn('gravity_harvest', 'gh_attractor', 'root', 'Starwell Magnet', 'hoard', T1_COSTS, null,
    'Expands Mote & Shard magnetic pull reach around Lumen.',
    (r) => `+${r * 10}% Mote magnet range`),
  tn('gravity_harvest', 'gh_greed', 'leftMid', 'Luminous Hoard', 'hoard', T2_COSTS, 'gh_attractor',
    'Increases EXP & Score harvested from Light Motes.',
    (r) => `+${step([10, 20, 30, 45], r)}% bonus EXP & Score`),
  tn('gravity_harvest', 'gh_shimmer', 'leftCap', 'Midas Crystallization', 'hoard', T3_COSTS, 'gh_greed',
    'Every 12 Motes gathered crystallizes bonus LUM and spawns a Golden Mote.',
    (r) => `+${r} LUM & spawns Golden Mote every 12 Motes`),
  tn('gravity_harvest', 'gh_vacuum', 'rightMid', 'Slipstream Vacuum', 'force', T2_COSTS, 'gh_attractor',
    'Every 10th Light Mote triggers a cosmic pull reeling in distant Motes & Stars.',
    (r) => `Every 10th Mote pulls collectibles within ${step([240, 300, 360, 440], r)}px`),
  tn('gravity_harvest', 'gh_nova', 'rightCap', 'Constellation Blast', 'blast', T3_COSTS, 'gh_vacuum',
    'Golden Motes, Stars & Prisms erupt in a 135px burst and recharge Solar Dash.',
    (r) => `Special pickups blast (${step([6.5, 9.5, 12.5, 16], r)} dmg) & +${step([0.2, 0.3, 0.4, 0.5], r)} Dash`),

  // 9. Aegis Sanctuary (Repulsive Bulwark vs Phoenix Shatter)
  tn('aegis_bloom', 'ab_mantle', 'root', 'Crystal Mantle', 'shield', T1_COSTS, null,
    'Extends Solar Dash and Ward invulnerability grace windows.',
    (r) => `+${r * 10}% Dash & Ward invulnerability grace`),
  tn('aegis_bloom', 'ab_tempo', 'leftMid', 'Quick Mend', 'tempo', T2_COSTS, 'ab_mantle',
    'Recharges Aegis Barrier Ward significantly faster.',
    (r) => `${step([12, 22, 32, 42], r)}% faster Ward recharge`),
  tn('aegis_bloom', 'ab_bulwark', 'leftCap', 'Repulsive Bulwark', 'shield', T3_COSTS, 'ab_tempo',
    'While Ward is charged, emits a 96px knockback pulse every 1.6s shoving shadows away.',
    (r) => `96px shield pulse every 1.6s (${step([4.5, 7, 9.5, 12.5], r)} dmg + knockback)`),
  tn('aegis_bloom', 'ab_nova', 'rightMid', 'Mirror Shatter', 'blast', T2_COSTS, 'ab_mantle',
    'Blocking a hit erupts in a heavy Shockwave Nova & grants 1.6s burst glide speed.',
    (r) => `Ward block blasts (${step([12, 19, 26, 34], r)} dmg) & +${step([20, 30, 40, 55], r)}% speed`),
  tn('aegis_bloom', 'ab_radiance', 'rightCap', 'Phoenix Barrier', 'prism', T3_COSTS, 'ab_nova',
    'Ward block immediately restores 1 Solar Dash charge and surges Ability Damage for 4s.',
    (r) => `Ward block restores 1 Dash & +${step([25, 40, 55, 75], r)}% DMG for 4.0s`),

  // 10. Starlight Shield (Retribution Reflect Overload vs Harmonic Mend Bastion)
  tn('astral_shield', 'as_plating', 'root', 'Prism Plating', 'shield', T1_COSTS, null,
    'Fortifies Starlight Shield base capacity and boosts recharge rate.',
    (r) => `+${r * 6} Base Shield & +${r * 6}% Shield regen`),
  tn('astral_shield', 'as_reflect', 'leftMid', 'Retribution Mirror', 'blast', T2_COSTS, 'as_plating',
    'Reflects a percentage of damage absorbed by Starlight Shield back onto attacking & nearby shadows.',
    (r) => `Reflects ${step([12, 18, 26, 35], r)}% of Shield damage absorbed`),
  tn('astral_shield', 'as_overcharge', 'leftCap', 'Aegis Overload', 'force', T3_COSTS, 'as_reflect',
    'When Starlight Shield breaks, erupts in a 220px shockwave nova & grants brief invulnerability grace.',
    (r) => `Break blasts 220px (${step([15, 22, 30, 40], r)} dmg) & +0.55s grace`),
  tn('astral_shield', 'as_mending', 'rightMid', 'Harmonic Mend', 'tempo', T2_COSTS, 'as_plating',
    'While Shield holds, slowly regenerates HP per second and shortens Shield recovery delay.',
    (r) => `+${step([1.0, 1.8, 2.6, 3.6], r).toFixed(1)} HP/s while shielded & ${step([15, 25, 35, 45], r)}% quicker recovery`),
  tn('astral_shield', 'as_bastion', 'rightCap', 'Astral Fortitude', 'prism', T3_COSTS, 'as_mending',
    'Expands total Shield capacity and empowers all automatic Ability Damage while Shield is above 50%.',
    (r) => `+${step([18, 32, 46, 65], r)}% Max Shield & +${step([10, 18, 26, 35], r)}% All DMG >50% Shield`),

  // 11. Echo Conduit (Mirror Casts vs Chromatic Harmonics)
  tn('echo_conduit', 'ec_tempo', 'root', 'Chrono Alignment', 'tempo', scaleCosts(T1_COSTS, 1.15), null,
    'Accelerates all automatic triggers and extends ability reach.',
    (r) => `+${(r * 2.5).toFixed(1)}% trigger speed & +${r * 4}% reach`),
  tn('echo_conduit', 'ec_overclock', 'leftMid', 'Cadence Overclock', 'tempo', scaleCosts(T2_COSTS, 1.15), 'ec_tempo',
    'Further overclocks automatic cooldown cadence across all abilities.',
    (r) => `+${r * 3}% faster all ability triggers`),
  tn('echo_conduit', 'ec_twinbeat', 'leftCap', 'Mirror Resonance', 'prism', scaleCosts(T3_COSTS, 1.15), 'ec_overclock',
    'Periodically echoes a full Mirror Copy of your Bolt, Voltaic Arc, Seeker, or Spear casts.',
    (r) => `Every ${step(['5th', '4th', '3rd', '2nd'], r)} Bolt/Arc/Seeker/Spear echoes a 65% Mirror Copy`),
  tn('echo_conduit', 'ec_empower', 'rightMid', 'Prismatic Amplify', 'shield', scaleCosts(T2_COSTS, 1.15), 'ec_tempo',
    'Amplifies global automatic Ability Damage across every equipped weapon.',
    (r) => `+${r * 4}% global Ability Damage`),
  tn('echo_conduit', 'ec_singularity', 'rightCap', 'Chromatic Resonance', 'blast', scaleCosts(T3_COSTS, 1.15), 'ec_empower',
    'Scales global damage per active Synergy & Evolution and pulses a periodic Echo Wave.',
    (r) => `+${step([6, 10, 14, 18], r)}% dmg per Synergy/Evo & 165px Echo Wave every 4s`),
];

export const ABILITY_TALENTS_BY_ID = Object.fromEntries(ABILITY_TALENTS.map((t) => [t.id, t]));

export const ABILITY_TALENT_GROUPS = new Map();
for (const t of ABILITY_TALENTS) {
  if (!ABILITY_TALENT_GROUPS.has(t.abilityId)) ABILITY_TALENT_GROUPS.set(t.abilityId, []);
  ABILITY_TALENT_GROUPS.get(t.abilityId).push(t);
}

export const SPIRIT_TRAILS = [
  { id: 'mist', name: 'Azure Mist', cost: 0, desc: 'Soft bioluminescent drift embers.' },
  { id: 'stardust', name: 'Stardust Silk', cost: 140, desc: 'Glittering diamond & star glints.' },
  { id: 'prism', name: 'Prism Wake', cost: 240, desc: 'Dual-hue iridescent ribbon trail.' },
  { id: 'solar', name: 'Solar Corona', cost: 360, desc: 'Incandescent flare sparks.' },
];

export const SPIRIT_PALETTES = [
  { id: 'default', name: 'Signature', cost: 0, colorHex: null, accentHex: null },
  { id: 'abyss_teal', name: 'Pelagic Cyan', cost: 110, colorHex: 0x5ff7eb, accentHex: 0xffe699 },
  { id: 'solar_amber', name: 'Solar Amber', cost: 170, colorHex: 0xffc864, accentHex: 0xfff3ba },
  { id: 'nebula_rose', name: 'Nebula Rose', cost: 250, colorHex: 0xff84c8, accentHex: 0x8ef7ff },
  { id: 'astral_jade', name: 'Astral Jade', cost: 330, colorHex: 0x6cffb6, accentHex: 0xeeff99 },
];

export const OVERDRIVE_WAVES = [
  { name: 'PRISM DRIFT', subtitle: 'OVERDRIVE WAVE I' },
  { name: 'VIOLET GALE', subtitle: 'OVERDRIVE WAVE II' },
  { name: 'LANCER CHORUS', subtitle: 'OVERDRIVE WAVE III' },
  { name: 'SOLAR ECLIPSE', subtitle: 'OVERDRIVE WAVE IV' },
];

export const DIFFICULTIES = [
  {
    id: 'normal',
    label: 'NORMAL',
    shortDesc: '1× Enemy HP · Standard Rewards',
    desc: 'Standard shadow strength, score, EXP & Luminance.',
    hpMul: 1.0,
    enemySpeedMul: 1.0,
    spawnRateMul: 1.0,
    scoreMul: 1.0,
    expMul: 1.0,
    lumMul: 1.0,
  },
  {
    id: 'hard',
    label: 'HARD',
    shortDesc: '1.45× HP · +35% Pts · +25% EXP · +45% LUM',
    desc: '+45% Shadow HP & +8% Speed · +35% Score, +25% EXP & +45% LUM.',
    hpMul: 1.45,
    enemySpeedMul: 1.08,
    spawnRateMul: 1.06,
    scoreMul: 1.35,
    expMul: 1.25,
    lumMul: 1.45,
  },
  {
    id: 'nightmare',
    label: 'NIGHTMARE',
    shortDesc: '2× HP · +80% Pts · +50% EXP · 2× LUM',
    desc: '2× Shadow HP & +16% Speed · +80% Score, +50% EXP & 2× Luminance.',
    hpMul: 2.0,
    enemySpeedMul: 1.16,
    spawnRateMul: 1.14,
    scoreMul: 1.8,
    expMul: 1.5,
    lumMul: 2.0,
  },
];

export const DIFFICULTIES_BY_ID = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));

export const DAILY_TWISTS = [
  { id: 'chrono_surge', name: 'Chrono Surge', desc: '+15% Fire Rate · +10% Shadow Speed', hasteMul: 1.15, enemySpeedMul: 1.1 },
  { id: 'astral_harvest', name: 'Astral Harvest', desc: '+25% Mote Score · +20% Magnet Reach', moteScoreMul: 1.25, magnetMul: 1.2 },
  { id: 'long_solstice', name: 'Long Solstice', desc: '+15% EXP Gain · +12% Magnet Reach', magnetMul: 1.12, expMul: 1.15 },
  { id: 'nimble_current', name: 'Nimble Current', desc: '+12% Move & Dash Recharge · +10% Ability DMG', speedMul: 1.12, dashRateMul: 1.12, dmgMul: 1.1 },
  { id: 'volatile_void', name: 'Volatile Void', desc: '+15% Ability DMG · +15% Shadow Speed', dmgMul: 1.15, enemySpeedMul: 1.15 },
];

export function getDailyTwist(dateKey = '') {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return DAILY_TWISTS[(h >>> 0) % DAILY_TWISTS.length];
}

export const MILESTONES = [
  { id: 'phase_2', name: 'Deep Currents', desc: 'Reach Phase 02', reward: 150 },
  { id: 'phase_3', name: 'Umbral Drift', desc: 'Reach Phase 03', reward: 250 },
  { id: 'phase_4', name: 'Eclipse Tide', desc: 'Reach Phase 04', reward: 350 },
  { id: 'phase_5', name: 'Astral Storm', desc: 'Reach Phase 05', reward: 500 },
  { id: 'medal_astral', name: 'Astral Honor', desc: 'Achieve Astral Rank Medal', reward: 450 },
  { id: 'medal_eclipse', name: 'Eclipse Legend', desc: 'Achieve Eclipse Rank Medal', reward: 800 },
  { id: 'medal_celestial', name: 'Celestial Crown', desc: 'Achieve Celestial Rank Medal', reward: 1200 },
  { id: 'medal_supernova', name: 'Supernova Paragon', desc: 'Achieve Supernova Rank Medal', reward: 1800 },
  { id: 'elite_1', name: 'Shadow Hunter', desc: 'Defeat an Elite Boss', reward: 200 },
  { id: 'supernova_first', name: 'Supernova', desc: 'Ascend an Ability to LV 10', reward: 400 },
];

export const MILESTONES_BY_ID = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));

export const ABILITY_SYNERGIES = [
  {
    id: 'storm_pollen',
    name: 'Storm Pollen',
    pair: ['voltaic_chain', 'starbloom_spores'],
    minRank: 3,
    desc: 'Voltaic Arc detonates nearby armed Starblooms at +35% blast radius.',
  },
  {
    id: 'event_horizon',
    name: 'Event Horizon',
    pair: ['astral_pulse', 'gravity_harvest'],
    minRank: 3,
    desc: 'Astral Pulse pulls nearby Light Motes & Stars directly toward Lumen.',
  },
  {
    id: 'halo_lance',
    name: 'Halo Lance',
    pair: ['solar_orbitals', 'celestial_spear'],
    minRank: 3,
    desc: 'Celestial Spear fires a bonus 55% dmg lance from your leading Blade.',
  },
  {
    id: 'comet_volley',
    name: 'Comet Volley',
    pair: ['resonant_volley', 'seeker_barrage'],
    minRank: 3,
    desc: 'Every 3rd Starlight Bolt volley launches an extra homing Seeker Needle.',
  },
  {
    id: 'radiant_bastion',
    name: 'Radiant Bastion',
    pair: ['astral_shield', 'solar_orbitals'],
    minRank: 3,
    desc: 'While shielded, Orbiting Blades spin 25% faster & every 4th hit restores +2 Shield.',
  },
  {
    id: 'tempest_echo',
    name: 'Tempest Echo',
    pair: ['echo_conduit', 'voltaic_chain'],
    minRank: 3,
    desc: 'Voltaic Arc gains +25% bounce reach & discharges a secondary 60% Echo Chain.',
  },
];

export const RANK_MEDALS = [
  { id: 'spark', label: 'SPARK', minScore: 2000, color: '#9efcf4' },
  { id: 'tide', label: 'TIDE', minScore: 7500, color: '#74d8ff' },
  { id: 'astral', label: 'ASTRAL', minScore: 19000, color: '#ffe699' },
  { id: 'eclipse', label: 'ECLIPSE', minScore: 37500, color: '#ff9ec7' },
  { id: 'celestial', label: 'CELESTIAL', minScore: 68000, color: '#b79eff' },
  { id: 'supernova', label: 'SUPERNOVA', minScore: 120000, color: '#fff3a8' },
];

export function getMedalForScore(score) {
  let achieved = null;
  let next = RANK_MEDALS[0];
  for (let i = 0; i < RANK_MEDALS.length; i++) {
    if (score >= RANK_MEDALS[i].minScore) {
      achieved = RANK_MEDALS[i];
      next = RANK_MEDALS[i + 1] || null;
    } else {
      next = RANK_MEDALS[i];
      break;
    }
  }
  return { achieved, next };
}

export function getScaledQuest(baseQuest, tier = 1) {
  const t = Math.max(1, tier);
  if (t === 1) return { ...baseQuest, tier: 1 };
  const rawTarget = baseQuest.target * (1 + (t - 1) * 0.65);
  const target =
    baseQuest.target >= 10
      ? Math.round(rawTarget / 5) * 5
      : Math.max(baseQuest.target + t - 1, Math.round(rawTarget));
  const reward = Math.round((baseQuest.reward * (1 + (t - 1) * 0.4)) / 10) * 10;
  const roman = ['I', 'II', 'III', 'IV', 'V'][t - 1] || `${t}`;
  const desc = baseQuest.desc.replace(String(baseQuest.target), String(target));
  return {
    ...baseQuest,
    tier: t,
    label: `${baseQuest.label} ${roman}`,
    desc,
    target,
    reward,
  };
}

export const QUEST_POOL = [
  { id: 'level_6', label: 'Ascendant Spark', desc: 'Reach LV 6 in one run', metric: 'level', target: 6, reward: 130 },
  { id: 'chain_3', label: 'Arc Conductor', desc: 'Purge 3+ shadows in one chain burst', metric: 'peakChain', target: 3, reward: 130 },
  { id: 'stars_2', label: 'Star Weaver', desc: 'Complete 2 Constellations', metric: 'constellationsCompleted', target: 2, reward: 150 },
  { id: 'motes_40', label: 'Starlight Collector', desc: 'Gather 40 Light Motes in one run', metric: 'motesCount', target: 40, reward: 110 },
  { id: 'purge_12', label: 'Shadowbreaker', desc: 'Purge 12 shadows in one run', metric: 'purgedCount', target: 12, reward: 120 },
  { id: 'core_1', label: 'Eclipse Bane', desc: 'Shatter an Eclipse Core', metric: 'coresShattered', target: 1, reward: 180 },
  { id: 'elite_2', label: 'Boss Slayer', desc: 'Defeat 2 Elite Bosses in one run', metric: 'elitesDefeated', target: 2, reward: 190 },
  { id: 'survive_60', label: 'Deep Voyager', desc: 'Survive 60 seconds in one run', metric: 'survivalTime', target: 60, reward: 140 },
];

export const PLAYER_CONFIG = {
  maxHealth: 100,
  radius: 13,
  hitRadius: 11,
  accel: 1950,
  maxSpeed: 400,
  damping: 5.2,
  pointerDeadzone: 6,
  pointerFullSpeedDist: 210,
  dashCharges: 2,
  dashRechargeTime: 2.35,
  dashSpeed: 1080,
  dashDuration: 0.25,
  dashCooldown: 0.12,
  invulnOnHit: 1.55,
  magnetRadius: 110,
};

export const PHASES = [
  {
    id: 1,
    code: '01 · FIRST SPARK',
    name: 'FIRST SPARK',
    subtitle: 'AWAKENING IN THE ABYSS',
    minScore: 0,
    minTime: 0,
    spawnInterval: 0.96,
    maxEnemies: 10,
    speedScale: 0.96,
    // Deep pelagic teal -> warm cyan rays
    deepColor: [0.02, 0.035, 0.095],
    midColor: [0.045, 0.115, 0.235],
    glowColor: [0.16, 0.72, 0.76],
    accentHex: 0x5df7eb,
  },
  {
    id: 2,
    code: '02 · DEEP CURRENTS',
    name: 'DEEP CURRENTS',
    subtitle: 'THE TIDE STIRS',
    minScore: 1125,
    minTime: 22,
    spawnInterval: 1.1,
    maxEnemies: 10,
    speedScale: 1.06,
    // Twilight indigo -> bioluminescent aquamarine
    deepColor: [0.03, 0.03, 0.11],
    midColor: [0.075, 0.095, 0.255],
    glowColor: [0.24, 0.68, 0.88],
    accentHex: 0x74d8ff,
  },
  {
    id: 3,
    code: '03 · UMBRAL DRIFT',
    name: 'UMBRAL DRIFT',
    subtitle: 'SHADOWS GATHER',
    minScore: 3500,
    minTime: 46,
    spawnInterval: 0.94,
    maxEnemies: 13,
    speedScale: 1.18,
    // Nocturne plum-navy -> coral-violet shimmer
    deepColor: [0.05, 0.024, 0.105],
    midColor: [0.11, 0.065, 0.22],
    glowColor: [0.46, 0.56, 0.88],
    accentHex: 0x99b8ff,
  },
  {
    id: 4,
    code: '04 · ECLIPSE TIDE',
    name: 'ECLIPSE TIDE',
    subtitle: 'THE GROVE TREMBLES',
    minScore: 7000,
    minTime: 72,
    spawnInterval: 0.76,
    maxEnemies: 17,
    speedScale: 1.32,
    // Deep crimson-violet -> amber-rose bioluminescence
    deepColor: [0.065, 0.02, 0.09],
    midColor: [0.145, 0.05, 0.18],
    glowColor: [0.78, 0.36, 0.56],
    accentHex: 0xff8ea6,
  },
  {
    id: 5,
    code: '05 · ASTRAL STORM',
    name: 'ASTRAL STORM',
    subtitle: 'RADIANCE UNBOUND',
    minScore: 12000,
    minTime: 100,
    spawnInterval: 0.56,
    maxEnemies: 23,
    speedScale: 1.48,
    // Obsidian void -> incandescent gold-mint aurora
    deepColor: [0.03, 0.022, 0.075],
    midColor: [0.085, 0.06, 0.175],
    glowColor: [0.35, 0.85, 0.78],
    accentHex: 0xffe493,
  },
];

export const WORLD_CONFIG = {
  width: 4200,
  height: 3000,
};

export const COLORS = {
  lumenCore: 0xfffdf2,
  lumenCyan: 0x5ff7eb,
  lumenGold: 0xffe699,
  moteCyan: 0x7df9ff,
  moteGold: 0xffe38f,
  prismCore: 0xffffff,
  prismAura: 0xffd384,
  shadowVoid: 0x06040d,
  shadowCrimson: 0xff2e6a,
  shadowViolet: 0xb93bff,
  grazeSpark: 0x9efff5,
};

// Re-export pure domain service helpers for backward compatibility during MVVM migration
export {
  ASPECT_DEFS,
  applyUpgradeOption,
  createDefaultBuildState,
  generateUpgradeDraft,
  getAbilityInfo,
  getAbilityModifierLines,
  rollCardRarity,
} from '../services/DraftService.js';
export {
  RANK_VALS,
  getActiveSynergies,
  getGroupTalentEffects,
  getSynergyHintsForAbility,
  getUpgradeEffects,
  isStartAbilityUnlocked,
} from '../services/SynergyTalentService.js';

