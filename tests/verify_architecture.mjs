import assert from 'node:assert/strict';
import { Observable } from '../src/core/Observable.js';
import { EventBus } from '../src/core/EventBus.js';
import { ENEMY_STATS, PHASES } from '../src/core/Constants.js';
import {
  getActiveSynergies,
  getGroupTalentEffects,
  getSynergyHintsForAbility,
  getUpgradeEffects,
  isStartAbilityUnlocked,
} from '../src/services/SynergyTalentService.js';
import {
  applyUpgradeOption,
  createDefaultBuildState,
  generateUpgradeDraft,
  getAbilityInfo,
  getAbilityModifierLines,
  rollCardRarity,
} from '../src/services/DraftService.js';
import { WaveDirectorService } from '../src/services/WaveDirectorService.js';
import { CombatService } from '../src/services/CombatService.js';

// 1. Observable reactive binding tests
{
  const obs = new Observable(10);
  const log = [];
  const unsub = obs.subscribe((val) => log.push(val));
  assert.deepEqual(log, [10]);
  obs.value = 10; // duplicate assignment must not fire
  assert.deepEqual(log, [10]);
  obs.value = 25;
  assert.deepEqual(log, [10, 25]);
  unsub();
  obs.value = 50;
  assert.deepEqual(log, [10, 25]);
}

// 2. EventBus pub/sub tests
{
  const bus = new EventBus();
  const events = [];
  const off = bus.on('enemy:damaged', (p) => events.push(p));
  bus.emit('enemy:damaged', { amount: 10 });
  assert.equal(events.length, 1);
  assert.equal(events[0].amount, 10);
  off();
  bus.emit('enemy:damaged', { amount: 20 });
  assert.equal(events.length, 1);
}

// 3. SynergyTalentService tests
{
  const upgFx = getUpgradeEffects({ astral_reroll: 5, astral_banish: 2, luminous_force: 4 });
  assert.equal(upgFx.extraRerolls, 3); // 1 base + 2 from rank 5
  assert.equal(upgFx.banishes, 2);
  assert.equal(upgFx.globalDmgMul, 1.06);

  const pulseTalents = getGroupTalentEffects('astral_pulse', { ap_singularity: 4, ap_siphon: 2 });
  assert.equal(pulseTalents.crushDmg, 15.5);
  assert.equal(pulseTalents.lifestealPct, 0.28);

  const ranks = new Map([
    ['voltaic_chain', 3],
    ['starbloom_spores', 3],
  ]);
  const syns = getActiveSynergies(ranks);
  assert.equal(syns.length, 1);
  assert.equal(syns[0].id, 'storm_pollen');

  const hints = getSynergyHintsForAbility('voltaic_chain', new Map([['voltaic_chain', 2], ['starbloom_spores', 3]]));
  const stormHint = hints.find((h) => h.id === 'storm_pollen');
  assert.equal(stormHint.readyNow, true);
  assert.equal(isStartAbilityUnlocked('resonant_volley', {}), true);
  assert.equal(isStartAbilityUnlocked('solar_orbitals', {}), false);
  assert.equal(isStartAbilityUnlocked('solar_orbitals', { so_edge: 1 }), true);
}

// 4. DraftService tests
{
  const build = createDefaultBuildState();
  const ranks = new Map([['resonant_volley', 1]]);
  const draft = generateUpgradeDraft(ranks, build, () => 0.42, {
    banishedAbilities: new Set(['solar_orbitals']),
  });
  assert.equal(draft.length, 3);
  assert.equal(draft.some((c) => c.abilityId === 'solar_orbitals'), false);

  const unlockCard = draft.find((c) => c.aspect === 'unlock');
  assert.ok(unlockCard);
  const nextRank = applyUpgradeOption(unlockCard, ranks, build);
  assert.equal(nextRank, 1);
  assert.equal(ranks.get(unlockCard.abilityId), 1);

  const info = getAbilityInfo('resonant_volley');
  assert.equal(info.name, 'Starlight Bolt');
  const lines = getAbilityModifierLines('resonant_volley', build.resonant_volley, 1, { rv_starfire: 1 }, []);
  assert.ok(lines.some((l) => l.includes('4.5 dmg/s')));
  assert.equal(rollCardRarity(() => 0.01, 0).id, 'common');
}

// 5. WaveDirectorService tests
{
  assert.equal(WaveDirectorService.findTargetPhaseIndex(0, 10, 500), 0);
  assert.equal(WaveDirectorService.findTargetPhaseIndex(0, 23, 200), 1); // Phase 2 at 22s
  assert.equal(WaveDirectorService.computeOverdriveTier(4, 140, 15000), 1);
  const eff = WaveDirectorService.buildEffectivePhase(PHASES[4], 2, {
    spawnRateMul: 1.06,
    enemySpeedMul: 1.08,
    hpMul: 1.45,
  });
  assert.equal(eff.hpBonus, 4); // base 2 + overdrive 2
  assert.equal(eff.hpMul, 1.45);
  assert.equal(WaveDirectorService.getCoreExtraShieldsForPhase(5, 'nightmare'), 4);
}

// 6. CombatService tests (10x enemy damage vs 1x player HP & shield balance)
{
  assert.equal(ENEMY_STATS.stalker.hp, 10);
  const heal = CombatService.computeLifestealHeal(10, 0.18, 80, 100);
  assert.ok(Math.abs(heal - 0.18) < 1e-6);

  const maxShield = CombatService.computeMaxShield(5, { shieldCapAdd: 12 }, { flatCap: 6, capMul: 1.18 });
  // (35 + 15 + 12 + 6) * 1.18 = 68 * 1.18 = 80.24 -> 80
  assert.equal(maxShield, 80);

  const shieldHit = CombatService.resolveShieldAbsorption({
    incomingDamage: 30,
    currentShield: 20,
    shieldRank: 5,
    shieldFx: { reflectPct: 0.26, overloadDmg: 15 },
    dmgBonus: 1,
  });
  assert.equal(shieldHit.absorbed, 20);
  assert.equal(shieldHit.remainingDamage, 10);
  assert.equal(shieldHit.nextShield, 0);
  assert.equal(shieldHit.shieldBroken, true);
  assert.equal(shieldHit.reflectDmg, 52); // 20 * 0.26 * 10
  assert.equal(shieldHit.triggerStaticPulse, true);
  assert.equal(shieldHit.overloadDmg, 15);
}

// 7. Phase 2 Models & ViewModels tests (Headless MVVM verification)
const { MetaProfileModel } = await import('../src/models/MetaProfileModel.js');
const { RunSessionModel } = await import('../src/models/RunSessionModel.js');
const { HudViewModel } = await import('../src/viewmodels/HudViewModel.js');
const { DraftViewModel } = await import('../src/viewmodels/DraftViewModel.js');
const { SanctuaryViewModel } = await import('../src/viewmodels/SanctuaryViewModel.js');
const { SettingsViewModel } = await import('../src/viewmodels/SettingsViewModel.js');
const { TitleViewModel } = await import('../src/viewmodels/TitleViewModel.js');
const { PauseGameOverViewModel } = await import('../src/viewmodels/PauseGameOverViewModel.js');

{
  const meta = new MetaProfileModel({ luminance: 1500, highScore: 24000, selectedSpirit: 'ember' });
  assert.equal(meta.luminance.value, 1500);
  assert.equal(meta.selectedSpirit.value, 'ember');

  const session = new RunSessionModel();
  session.reset({ startAbilityId: 'voltaic_chain', extraRerolls: 2, banishes: 1 });
  assert.equal(session.abilityRanks.get('voltaic_chain'), 1);
  assert.equal(session.rerollsLeft.value, 2);
  assert.equal(session.banishesLeft.value, 1);

  const expRes = session.addExp(50, 1);
  assert.equal(expRes.leveledUp, 1);
  assert.equal(session.level.value, 2);
  assert.equal(session.pendingLevelUps, 1);
  assert.equal(session.useReroll(), true);
  assert.equal(session.rerollsLeft.value, 1);
  assert.equal(session.banishAbility('solar_orbitals'), true);
  assert.equal(session.banishesLeft.value, 0);
  assert.equal(session.banishedAbilities.has('solar_orbitals'), true);

  const hudVM = new HudViewModel();
  hudVM.reset({ maxHealth: 100, maxDashes: 2 });
  hudVM.updateFrame(0.1, { score: 1200, health: 25, maxHealth: 100, shield: 15, maxShield: 30, level: 3, exp: 20, expToNext: 80 });
  assert.equal(hudVM.hpText.value, '25 / 100');
  assert.equal(hudVM.hpState.value, 'critical');
  assert.equal(hudVM.shieldVisible.value, true);
  assert.equal(hudVM.shieldText.value, '15 / 30');
  assert.equal(hudVM.levelText.value, 'LV 3');
  assert.equal(hudVM.expRatio.value, 0.25);

  let banishedUid = null;
  const draftVM = new DraftViewModel({ onBanishOption: (uid) => { banishedUid = uid; } });
  draftVM.openDraft([{ uid: 'solar_orbitals:unlock', abilityId: 'solar_orbitals' }], 2, {
    rerollsLeft: 1,
    banishesLeft: 1,
    abilityRanks: session.abilityRanks,
    banishedAbilities: new Set(),
  });
  assert.equal(draftVM.isOpen.value, true);
  assert.equal(draftVM.canBanishAny.value, true);
  draftVM.toggleBanishMode();
  assert.equal(draftVM.banishMode.value, true);
  draftVM.selectCardOrBanish('solar_orbitals:unlock');
  assert.equal(banishedUid, 'solar_orbitals:unlock');
  assert.equal(draftVM.banishMode.value, false);

  const sanctVM = new SanctuaryViewModel();
  // Mid talent requires root talent at maxLevel (4)
  const lockedMid = sanctVM.computeTalentNodeState('rv_ricochet', 5000, { rv_velocity: 2 });
  assert.equal(lockedMid.reqMet, false);
  assert.equal(lockedMid.canAfford, false);
  const unlockedMid = sanctVM.computeTalentNodeState('rv_ricochet', 5000, { rv_velocity: 4 });
  assert.equal(unlockedMid.reqMet, true);
  assert.equal(unlockedMid.canAfford, true);

  const settingsVM = new SettingsViewModel();
  settingsVM.sync({ sfxVolume: 0, ambientVolume: 0, cursorGlide: true });
  assert.equal(settingsVM.allMuted.value, true);
  assert.equal(settingsVM.cursorGlide.value, true);

  const titleVM = new TitleViewModel();
  titleVM.sync({ highScore: 9500, dailyStreak: 3, selectedDifficulty: 'hard' });
  assert.equal(titleVM.dailyStreakText.value, '3D (+30%)');
  assert.ok(titleVM.runNoteText.value.includes('HARD'));

  const pgoVM = new PauseGameOverViewModel();
  pgoVM.syncGameOver({ score: 15400, survivalTime: 125, purgedCount: 42, elitesDefeated: 2, luminanceEarned: 350 });
  assert.equal(pgoVM.finalTimeText.value, '02:05');
  assert.equal(pgoVM.luminanceEarnedText.value, '+350 LUM');
}

console.log('PHASE 1 & 2 MVVM + SOLID ARCHITECTURE VERIFICATION PASSED');
