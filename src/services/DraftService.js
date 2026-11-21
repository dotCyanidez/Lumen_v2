import {
  ABILITY_EVOLUTIONS,
  ABILITY_SYNERGIES,
  ABILITY_TALENT_GROUPS,
  BLESSINGS,
  CARD_RARITIES,
  MAX_ABILITY_SLOTS,
} from '../core/Constants.js';
import { getSynergyHintsForAbility } from './SynergyTalentService.js';

let _blessingsById = null;
function getBlessingsById() {
  if (!_blessingsById) {
    _blessingsById = Object.fromEntries(BLESSINGS.map((b) => [b.id, b]));
  }
  return _blessingsById;
}

const pct = (abilityId, aspect, baseVal, title, desc) => ({
  abilityId,
  aspect,
  mode: 'pct',
  baseVal,
  title,
  desc,
});
const add = (abilityId, aspect, baseVal, title, desc, maxAdd = 0) => ({
  abilityId,
  aspect,
  mode: 'add',
  baseVal,
  maxAdd,
  title,
  desc,
});

/** Single-aspect endless upgrade templates (Common Grey baseline scales up to 3x on Epic). */
export const ASPECT_DEFS = [
  // Starlight Bolt
  pct('resonant_volley', 'dmgMul', 8, (v) => `+${v}% Damage`, (v) => `Starlight Bolts deal ${v}% more damage.`),
  pct('resonant_volley', 'rateMul', 7, (v) => `${v}% Faster`, (v) => `Starlight Bolt fires ${v}% faster.`),
  add('resonant_volley', 'countAdd', 1, (v) => `+${v} Bolt${v > 1 ? 's' : ''}`, (v) => `Fires +${v} additional Starlight Bolt${v > 1 ? 's' : ''} per volley.`, 0),
  add('resonant_volley', 'pierceAdd', 1, (v) => `+${v} Pierce`, (v) => `Starlight Bolts pierce +${v} more shadow${v > 1 ? 's' : ''}.`, 0),
  pct('resonant_volley', 'rangeMul', 10, (v) => `+${v}% Range`, (v) => `Starlight Bolt targeting reach increases by ${v}%.`),

  // Orbiting Blades
  add('solar_orbitals', 'countAdd', 1, (v) => `+${v} Blade${v > 1 ? 's' : ''}`, (v) => `+${v} orbiting crystalline blade${v > 1 ? 's' : ''} circling Lumen.`, 0),
  pct('solar_orbitals', 'dmgMul', 8, (v) => `+${v}% Damage`, (v) => `Orbiting Blades deal ${v}% more damage.`),
  pct('solar_orbitals', 'speedMul', 9, (v) => `${v}% Faster Spin`, (v) => `Orbiting Blades rotate & strike ${v}% faster.`),
  pct('solar_orbitals', 'sizeMul', 9, (v) => `+${v}% Reach`, (v) => `+${v}% wider blade orbit radius & cleave reach.`),

  // Voltaic Arc
  add('voltaic_chain', 'targetsAdd', 1, (v) => `+${v} Target${v > 1 ? 's' : ''}`, (v) => `Voltaic Arc chains to +${v} more shadow${v > 1 ? 's' : ''} per strike.`, 0),
  pct('voltaic_chain', 'dmgMul', 8, (v) => `+${v}% Damage`, (v) => `Voltaic Arc deals ${v}% more damage.`),
  pct('voltaic_chain', 'rateMul', 7, (v) => `${v}% Faster`, (v) => `Voltaic Arc discharges ${v}% more often.`),
  pct('voltaic_chain', 'reachMul', 10, (v) => `+${v}% Reach`, (v) => `Voltaic Arc jumps ${v}% further between shadows.`),

  // Astral Pulse
  pct('astral_pulse', 'dmgMul', 9, (v) => `+${v}% Damage`, (v) => `Astral Pulse deals ${v}% more damage.`),
  pct('astral_pulse', 'rateMul', 7, (v) => `${v}% Faster`, (v) => `Astral Pulse triggers ${v}% more often.`),
  pct('astral_pulse', 'radiusMul', 10, (v) => `+${v}% Area`, (v) => `Astral Pulse shockwave expands ${v}% wider.`),
  pct('astral_pulse', 'slowMul', 14, (v) => `+${v}% Slow`, (v) => `Astral Pulse slows surviving shadows ${v}% longer.`),

  // Seeker Needles
  add('seeker_barrage', 'countAdd', 1, (v) => `+${v} Needle${v > 1 ? 's' : ''}`, (v) => `Launches +${v} extra homing needle${v > 1 ? 's' : ''} per volley.`, 0),
  pct('seeker_barrage', 'dmgMul', 8, (v) => `+${v}% Damage`, (v) => `Seeker Needles deal ${v}% more damage.`),
  pct('seeker_barrage', 'rateMul', 7, (v) => `${v}% Faster`, (v) => `Seeker Needles launch ${v}% faster.`),
  pct('seeker_barrage', 'speedMul', 10, (v) => `+${v}% Homing`, (v) => `Seeker Needles fly & curve ${v}% faster.`),

  // Starbloom Spores
  pct('starbloom_spores', 'dmgMul', 9, (v) => `+${v}% Damage`, (v) => `Starbloom bursts deal ${v}% more damage.`),
  pct('starbloom_spores', 'rateMul', 8, (v) => `${v}% Faster`, (v) => `Starbloom Spores bud ${v}% more often.`),
  pct('starbloom_spores', 'radiusMul', 10, (v) => `+${v}% Blast Area`, (v) => `Starbloom blossom bursts expand ${v}% wider.`),
  add('starbloom_spores', 'maxAdd', 1, (v) => `+${v} Max Bloom${v > 1 ? 's' : ''}`, (v) => `Hold +${v} more active Starbloom${v > 1 ? 's' : ''} in the arena.`, 0),

  // Celestial Spear
  pct('celestial_spear', 'dmgMul', 9, (v) => `+${v}% Damage`, (v) => `Celestial Spear deals ${v}% more damage.`),
  pct('celestial_spear', 'rateMul', 7, (v) => `${v}% Faster`, (v) => `Celestial Spear fires ${v}% more often.`),
  add('celestial_spear', 'pierceAdd', 2, (v) => `+${v} Pierce`, (v) => `Celestial Spear pierces through +${v} more shadows.`, 0),
  pct('celestial_spear', 'widthMul', 11, (v) => `+${v}% Width`, (v) => `Celestial Spear beam sweeps ${v}% wider.`),

  // Utility Aspect Upgrades
  pct('gravity_harvest', 'magnetMul', 14, (v) => `+${v}% Magnet`, (v) => `+${v}% wider Light Mote & Star magnet reach.`),
  pct('gravity_harvest', 'expMul', 7, (v) => `+${v}% EXP`, (v) => `Earn ${v}% more EXP from purified shadows.`),
  pct('aegis_bloom', 'wardRateMul', 9, (v) => `${v}% Faster Ward`, (v) => `Aegis Barrier Ward recharges ${v}% faster.`),
  pct('aegis_bloom', 'dashGraceMul', 11, (v) => `+${v}% Dash Grace`, (v) => `Solar Dash stays invulnerable ${v}% longer.`),
  pct('aegis_bloom', 'repulseMul', 12, (v) => `+${v}% Ward Push`, (v) => `Aegis Ward shockwave pushes shadows ${v}% further.`),
  add('astral_shield', 'shieldCapAdd', 12, (v) => `+${v} Max Shield`, (v) => `Increases Starlight Shield capacity by +${v} HP.`, 0),
  pct('astral_shield', 'shieldRegenMul', 14, (v) => `${v}% Faster Shield`, (v) => `Starlight Shield regenerates ${v}% faster.`),
  pct('astral_shield', 'shieldDelayMul', 11, (v) => `${v}% Quicker Recovery`, (v) => `Starlight Shield resumes recharging ${v}% sooner after taking a hit.`),
  pct('echo_conduit', 'hasteMul', 6, (v) => `${v}% Faster All`, (v) => `All automatic abilities fire ${v}% faster.`),
  pct('echo_conduit', 'globalDmgMul', 6, (v) => `+${v}% All Damage`, (v) => `All Damage abilities deal ${v}% more damage.`),
];

export function rollCardRarity(rng = Math.random, luck = 0, allowUncommon = true) {
  const rarityList = [
    CARD_RARITIES.common,
    CARD_RARITIES.uncommon,
    CARD_RARITIES.rare,
    CARD_RARITIES.epic,
  ];
  const lk = Math.max(0, Number(luck) || 0);
  const wCommon = Math.max(12, CARD_RARITIES.common.baseWeight / (1 + lk * 1.15));
  const wUncommon = allowUncommon ? CARD_RARITIES.uncommon.baseWeight * (1 + lk * 0.55) : 0;
  const wRare = CARD_RARITIES.rare.baseWeight * (1 + lk * 1.35);
  const wEpic = CARD_RARITIES.epic.baseWeight * (1 + lk * 2.25);
  const weights = [wCommon, wUncommon, wRare, wEpic];
  const total = weights[0] + weights[1] + weights[2] + weights[3];
  let roll = rng() * total;
  for (let i = 0; i < rarityList.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return rarityList[i];
  }
  return CARD_RARITIES.common;
}

const scaleAspectValue = (baseVal, rarityObj, mode) => {
  if (mode === 'add' && baseVal === 1) {
    if (rarityObj.id === 'epic') return 3;
    if (rarityObj.id === 'rare') return 2;
    return 1;
  }
  return Math.max(1, Math.round(baseVal * rarityObj.mult));
};

export function createDefaultBuildState() {
  return {
    resonant_volley: { rank: 1, dmgMul: 1, rateMul: 1, countAdd: 0, pierceAdd: 0, rangeMul: 1 },
    solar_orbitals: { rank: 0, countAdd: 0, dmgMul: 1, speedMul: 1, sizeMul: 1 },
    voltaic_chain: { rank: 0, targetsAdd: 0, dmgMul: 1, rateMul: 1, reachMul: 1 },
    astral_pulse: { rank: 0, dmgMul: 1, rateMul: 1, radiusMul: 1, slowMul: 1 },
    seeker_barrage: { rank: 0, countAdd: 0, dmgMul: 1, rateMul: 1, speedMul: 1 },
    starbloom_spores: { rank: 0, dmgMul: 1, rateMul: 1, radiusMul: 1, maxAdd: 0 },
    celestial_spear: { rank: 0, dmgMul: 1, rateMul: 1, pierceAdd: 0, widthMul: 1 },
    gravity_harvest: { rank: 0, magnetMul: 1, expMul: 1, starPull: false },
    aegis_bloom: { rank: 0, wardRateMul: 1, dashGraceMul: 1, repulseMul: 1 },
    astral_shield: { rank: 0, shieldCapAdd: 0, shieldRegenMul: 1, shieldDelayMul: 1 },
    echo_conduit: { rank: 0, hasteMul: 1, globalDmgMul: 1 },
  };
}

export function getAbilityInfo(id) {
  return getBlessingsById()[id] || null;
}

export function getAbilityModifierLines(
  id,
  st,
  rank = 1,
  talentRanks = null,
  activeSynergies = []
) {
  const lines = [];
  if (st) {
    for (const def of ASPECT_DEFS) {
      if (def.abilityId !== id) continue;
      if (def.mode === 'pct') {
        const pctVal = Math.round(((st[def.aspect] ?? 1) - 1) * 100);
        if (pctVal > 0) lines.push(def.title(pctVal));
      } else {
        const addVal = st[def.aspect] || 0;
        if (addVal > 0) lines.push(def.title(addVal));
      }
    }
  }
  if (id === 'gravity_harvest' && st?.starPull) lines.push('Constellation Star Pull');
  if (id === 'aegis_bloom') lines.push('Recharging Hit-Blocking Ward');
  if (id === 'astral_shield') lines.push('Regenerating Shield Absorb Layer');

  const groupNodes = ABILITY_TALENT_GROUPS.get(id) || [];
  for (const t of groupNodes) {
    const tr = Math.max(0, Number(talentRanks?.[t.id]) || 0);
    if (tr > 0) {
      lines.push(`✦ Talent · ${t.name} (LV ${tr}/${t.maxLevel}): ${t.rankText(tr)}`);
    }
  }

  for (const syn of activeSynergies) {
    if (syn.pair.includes(id)) {
      lines.push(`◈ Synergy · ${syn.name}: ${syn.desc}`);
    }
  }

  const evo = ABILITY_EVOLUTIONS[id];
  if (evo) {
    if (rank >= 10) lines.push(`✦ Supernova (LV 10+): ${evo.name} amplified`);
    else if (rank >= 5) lines.push(`★ ${evo.name}: ${evo.desc}`);
    else lines.push(`Next Ascension: LV 5 (${evo.name})`);
  }
  if (lines.length === 0) {
    const base = getAbilityInfo(id);
    if (base) lines.push(base.desc);
  }
  return lines;
}

function shuffleWithRng(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function getDraftWeight(abilityId, abilityRanks) {
  const curRank = abilityRanks.get(abilityId) || 0;
  let weight = 1;
  if (curRank === 4 || curRank === 9) {
    weight *= 2.25;
  }
  for (const syn of ABILITY_SYNERGIES) {
    if (!syn.pair.includes(abilityId)) continue;
    const partnerId = syn.pair.find((id) => id !== abilityId);
    const partnerRank = abilityRanks.get(partnerId) || 0;
    if (partnerRank > 0 && (curRank < syn.minRank || partnerRank < syn.minRank)) {
      weight *= curRank + 1 >= syn.minRank && partnerRank >= syn.minRank ? 2.2 : 1.75;
    }
  }
  return weight;
}

function pickWeightedOrder(items, weightFn, rng) {
  const pool = items.map((item) => ({ item, w: Math.max(0.05, weightFn(item)) }));
  const ordered = [];
  while (pool.length > 0) {
    let total = 0;
    for (let i = 0; i < pool.length; i++) total += pool[i].w;
    let roll = rng() * total;
    let pickIdx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].w;
      if (roll <= 0) {
        pickIdx = i;
        break;
      }
    }
    ordered.push(pool[pickIdx].item);
    pool.splice(pickIdx, 1);
  }
  return ordered;
}

export function generateUpgradeDraft(
  abilityRanks,
  buildState,
  rng = Math.random,
  optionsOrRareBonus = 0
) {
  const opts =
    typeof optionsOrRareBonus === 'number'
      ? { rareChanceBonus: optionsOrRareBonus }
      : optionsOrRareBonus || {};
  const rareChanceBonus = Number(opts.rareChanceBonus) || 0;
  const luckBonus = Number(opts.luck) || 0;
  const effectiveLuck = Math.max(0, luckBonus + rareChanceBonus * 2.5);
  const banishedAbilities = opts.banishedAbilities || null;
  const banishedAspects = opts.banishedAspects || null;
  const excludeUids = opts.excludeUids || null;

  const unlocks = [];
  const aspects = [];
  let unlockedTotal = 0;
  let unlockedWeapons = 0;

  for (const b of BLESSINGS) {
    const rank = abilityRanks.get(b.id) || 0;
    if (rank > 0) {
      unlockedTotal++;
      if (b.category === 'damage') unlockedWeapons++;
    } else if (!banishedAbilities?.has(b.id)) {
      const uid = `${b.id}:unlock`;
      unlocks.push({
        uid,
        id: b.id,
        abilityId: b.id,
        aspect: 'unlock',
        mode: 'unlock',
        val: 1,
        rarity: 'new',
        rarityLabel: 'NEW',
        rarityMult: 1,
        category: b.category,
        tag: `NEW · ${b.name.toUpperCase()}`,
        title: b.name,
        desc: b.desc,
        currentRank: 0,
        nextRank: 1,
        isNew: true,
        synergyHints: getSynergyHintsForAbility(b.id, abilityRanks),
        ascensionHint: null,
      });
    }
  }

  if (unlockedTotal >= MAX_ABILITY_SLOTS) {
    unlocks.length = 0;
  }

  for (const def of ASPECT_DEFS) {
    if (banishedAbilities?.has(def.abilityId)) continue;
    const aspectKey = `${def.abilityId}:${def.aspect}`;
    if (banishedAspects?.has(aspectKey)) continue;
    const curRank = abilityRanks.get(def.abilityId) || 0;
    if (curRank <= 0) continue;
    const abilityState = buildState[def.abilityId];
    if (def.maxAdd && abilityState && (abilityState[def.aspect] || 0) >= def.maxAdd) {
      continue;
    }
    const base = getAbilityInfo(def.abilityId);
    const allowUncommon = !(def.mode === 'add' && def.baseVal === 1);
    const rarityObj = rollCardRarity(rng, effectiveLuck, allowUncommon);
    const val = scaleAspectValue(def.baseVal, rarityObj, def.mode);
    const catPrefix = base?.category === 'utility' ? 'UTILITY' : 'DAMAGE';
    const nextRank = curRank + 1;
    const evo = ABILITY_EVOLUTIONS[def.abilityId];
    const ascensionHint =
      evo && (nextRank === 5 || nextRank === 10)
        ? {
            rank: nextRank,
            name: evo.name,
            isSupernova: nextRank >= 10,
          }
        : null;
    aspects.push({
      uid: `${def.abilityId}:${def.aspect}:${rarityObj.id}`,
      id: def.abilityId,
      abilityId: def.abilityId,
      aspect: def.aspect,
      mode: def.mode,
      val,
      rarity: rarityObj.id,
      rarityLabel: rarityObj.label,
      rarityMult: rarityObj.mult,
      category: base?.category || 'damage',
      tag: `${catPrefix} · ${(base?.name || def.abilityId).toUpperCase()}`,
      title: def.title(val),
      desc: def.desc(val),
      currentRank: curRank,
      nextRank,
      isNew: false,
      synergyHints: getSynergyHintsForAbility(def.abilityId, abilityRanks),
      ascensionHint,
    });
  }

  const orderedUnlocks = pickWeightedOrder(
    unlocks,
    (o) => getDraftWeight(o.abilityId, abilityRanks),
    rng
  );
  const orderedAspects = pickWeightedOrder(
    aspects,
    (o) => getDraftWeight(o.abilityId, abilityRanks) * (excludeUids?.has(o.uid) ? 0.35 : 1),
    rng
  );

  const picked = [];
  const usedKeys = new Set();
  const usedAbilities = new Set();

  const tryTake = (opt, requireDistinctAbility = true, skipExcluded = false) => {
    if (!opt || picked.length >= 3) return false;
    if (skipExcluded && excludeUids?.has(opt.uid)) return false;
    const key = `${opt.abilityId}:${opt.aspect}`;
    if (usedKeys.has(key)) return false;
    if (requireDistinctAbility && usedAbilities.has(opt.abilityId)) return false;
    usedKeys.add(key);
    usedAbilities.add(opt.abilityId);
    picked.push(opt);
    return true;
  };

  const targetUnlocks = orderedUnlocks.length === 0 ? 0 : unlockedWeapons < 2 ? 2 : 1;
  for (let i = 0; i < orderedUnlocks.length && picked.length < targetUnlocks; i++) {
    tryTake(orderedUnlocks[i], true, Boolean(excludeUids));
  }

  for (const opt of orderedAspects) {
    if (picked.length >= 3) break;
    tryTake(opt, true, Boolean(excludeUids));
  }

  for (const opt of orderedUnlocks) {
    if (picked.length >= 3) break;
    tryTake(opt, true, false);
  }
  for (const opt of orderedAspects) {
    if (picked.length >= 3) break;
    tryTake(opt, true, false);
  }
  for (const opt of orderedAspects) {
    if (picked.length >= 3) break;
    tryTake(opt, false, false);
  }

  return shuffleWithRng(picked, rng);
}

export function applyUpgradeOption(option, abilityRanks, buildState) {
  const id = option.abilityId || option.id;
  const prevRank = abilityRanks.get(id) || 0;
  const nextRank = prevRank + 1;
  abilityRanks.set(id, nextRank);

  const st = buildState[id];
  if (!st) return nextRank;
  st.rank = nextRank;

  if (option.aspect === 'unlock') {
    if (id === 'gravity_harvest') {
      st.magnetMul += 0.25;
      st.expMul += 0.1;
      st.starPull = true;
    } else if (id === 'echo_conduit') {
      st.hasteMul += 0.1;
    }
    return nextRank;
  }

  if (option.mode === 'pct') {
    st[option.aspect] = +((st[option.aspect] || 1) + option.val / 100).toFixed(4);
  } else if (option.mode === 'add') {
    st[option.aspect] = (st[option.aspect] || 0) + option.val;
  }
  return nextRank;
}
