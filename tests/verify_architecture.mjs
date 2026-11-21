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
  assert.equal(pgoVM.finalTimeText.value, '2:05');
  assert.equal(pgoVM.luminanceEarnedText.value, '+350 LUM');
}

// 8. Phase 3 OOP Enemy Hierarchy tests (Zero PixiJS / Zero DOM mocks!)
const { BaseEnemy } = await import('../src/models/enemies/BaseEnemy.js');
const { EnemyProjectile } = await import('../src/models/enemies/EnemyProjectile.js');
const { ENEMY_CLASSES, createEnemyModel } = await import('../src/models/enemies/EnemyRegistry.js');

{
  const expectedKinds = [
    'stalker',
    'manta',
    'sentinel',
    'lancer',
    'spitter',
    'artillery',
    'warden',
    'vortex',
    'harbinger',
    'behemoth',
    'core',
  ];
  for (const kind of expectedKinds) {
    assert.ok(ENEMY_CLASSES[kind], `Missing EnemyRegistry class for ${kind}`);
    const instance = createEnemyModel(kind, { x: 250, y: 250, speedScale: 1, extraShields: 2 });
    assert.ok(instance instanceof BaseEnemy, `${kind} must extend BaseEnemy (LSP)`);
    assert.equal(instance.kind, kind);
    assert.equal('grazeCooldown' in instance, false, `${kind} should not have dead grazeCooldown`);
  }

  // Stalker 10 HP dies in 1 hit of 10 damage
  const stalker = createEnemyModel('stalker', { x: 100, y: 100 });
  stalker.age = 2;
  assert.equal(stalker.hp, 10);
  const stalkerHit = stalker.takeDamage(10);
  assert.equal(stalkerHit.killed, true);
  assert.equal(stalkerHit.dealt, 10);

  // Sentinel 20 HP + expanding Void Pulse Ring hit radius
  const sentinel = createEnemyModel('sentinel', { x: 200, y: 200 });
  sentinel.age = 2;
  assert.equal(sentinel.hp, 20);
  const baseR = sentinel.getEffectiveHitRadius();
  sentinel.pulseWaveAge = 0.275; // mid-wave
  assert.ok(sentinel.getEffectiveHitRadius() > baseR);

  // Vortex gravity source when active
  const vortex = createEnemyModel('vortex', { x: 300, y: 300 });
  assert.equal(vortex.getGravitySource(), null); // still warming up
  vortex.age = 2;
  const grav = vortex.getGravitySource();
  assert.ok(grav && grav.radius === 230);

  // Warden split wisp config hook
  const warden = createEnemyModel('warden', { x: 400, y: 400 });
  const wisps = warden.getSplitWispConfigs();
  assert.equal(wisps.length, 2);
  assert.equal(wisps[0].splitWisp, true);

  // Spitter fires dart EnemyProjectile via updateAI
  const spitter = createEnemyModel('spitter', { x: 300, y: 100 });
  spitter.age = 2;
  spitter.fireCharge = 0.02;
  const spawnedProjs = [];
  spitter.updateAI(0.05, {
    player: { x: 100, y: 100 },
    boundsW: 1280,
    boundsH: 720,
    speedScale: 1,
    spawnProjectile: (p) => spawnedProjs.push(new EnemyProjectile(p)),
  });
  assert.equal(spawnedProjs.length, 1);
  assert.equal(spawnedProjs[0].damage, 18);

  // Polymorphic EclipseCoreBoss shield petal crack & dash smash
  const core = createEnemyModel('core', { x: 500, y: 500, extraShields: 2 });
  core.age = 2;
  assert.equal(core.shields, 50);
  assert.equal(core.getPetalCount(), 5);
  const coreHit = core.takeDamage(10);
  assert.equal(coreHit.killed, false);
  assert.equal(coreHit.cracked, true);
  assert.equal(coreHit.petalRem, 4);
  assert.equal(core.smashDashShield(), true);
  assert.equal(core.getPetalCount(), 3);
}

// 9. Phase 4 OOP Ability Hierarchy & CollectibleModel tests (Zero PixiJS / Zero DOM mocks!)
const { BaseAbility } = await import('../src/models/abilities/BaseAbility.js');
const { AbilityProjectileModel } = await import('../src/models/abilities/AbilityProjectileModel.js');
const { LightPoolModel } = await import('../src/models/abilities/LightPoolModel.js');
const { ABILITY_CLASSES, createAbilityInstances } = await import('../src/models/abilities/AbilityRegistry.js');
const { CollectibleModel } = await import('../src/models/CollectibleModel.js');

{
  const instances = createAbilityInstances();
  const expectedAbilityIds = [
    'resonant_volley',
    'solar_orbitals',
    'voltaic_chain',
    'astral_pulse',
    'seeker_barrage',
    'starbloom_spores',
    'celestial_spear',
    'echo_conduit',
  ];
  for (const id of expectedAbilityIds) {
    assert.ok(ABILITY_CLASSES[id], `Missing ABILITY_CLASSES entry for ${id}`);
    assert.ok(instances[id] instanceof BaseAbility, `${id} must extend BaseAbility (LSP)`);
    assert.equal(instances[id].id, id);
  }

  // Test BaseAbility.computeBaseDamage (10x scaling) & cooldown shaving
  const boltAbility = instances.resonant_volley;
  assert.equal(boltAbility.computeBaseDamage({ dmgMul: 1.2 }, { singleDmgMul: 1.1 }, 1), 13.2);
  boltAbility.reset(0.8);
  boltAbility.shaveCooldown(0.3);
  assert.ok(Math.abs(boltAbility.timer - 0.5) < 1e-6);

  // Test StarlightBoltAbility firing 10-dmg projectile headlessly
  const spawnedBolts = [];
  const dummyEnemy = createEnemyModel('stalker', { x: 120, y: 0 });
  dummyEnemy.age = 2;
  boltAbility.timer = 0;
  boltAbility.update(0.05, {
    player: { x: 0, y: 0, facingAngle: 0 },
    enemies: { enemies: [dummyEnemy] },
    audio: {},
    hasteMul: 1,
    globalDmgMul: 1,
    reachMul: 1,
    primaryTint: 0x5ff7eb,
    synergies: new Set(),
    getRank: (id) => (id === 'resonant_volley' ? 1 : 0),
    getBuild: () => ({ dmgMul: 1, rateMul: 1, countAdd: 0, pierceAdd: 0, rangeMul: 1 }),
    getTalentFx: () => null,
    shouldMirrorCast: () => false,
    onOverclockCast: () => {},
    spawnProjectile: (spec) => {
      const p = new AbilityProjectileModel();
      p.spawn(spec);
      spawnedBolts.push(p);
      return p;
    },
  });
  assert.equal(spawnedBolts.length, 1);
  assert.equal(spawnedBolts[0].damage, 10);
  assert.equal(spawnedBolts[0].stepKinematics(0.1, 1280, 720), true);

  // Test LightPoolModel DoT ticking
  const pool = new LightPoolModel({ x: 50, y: 50, radius: 76, duration: 1.0, dps: 10 });
  const tick1 = pool.step(0.1, 1);
  assert.equal(tick1.expired, false);
  assert.equal(tick1.tickDamage, 2.5); // 10 dps * 0.25s tick

  // Test CollectibleModel magnetic pull & pickup
  const mote = new CollectibleModel().init({ type: 'mote', x: 105, y: 100, baseValue: 50 });
  const stepCollect = mote.step(0.016, { x: 100, y: 100, dashTimer: 0 }, 1280, 720, [], 1, false);
  assert.equal(stepCollect.collected, true);
}

// 10. Phase 5 PlayerModel & InputController tests (Zero PixiJS / Zero DOM mocks!)
const { PlayerModel } = await import('../src/models/PlayerModel.js');
const { InputController } = await import('../src/views/InputController.js');

{
  const player = new PlayerModel();
  player.reset(500, 500, { maxHealth: 115, dashCharges: 2, speedMul: 1.05 });
  assert.equal(player.health, 115);
  assert.equal(player.maxHealth, 115);
  assert.equal(player.dashCharges, 2);

  // Dash consumes 1 charge & grants invulnerability
  assert.equal(player.tryDash(1, 0), true);
  assert.equal(player.dashCharges, 1);
  assert.equal(player.isDashing, true);
  assert.equal(player.isInvulnerable, true);

  // Step kinematics during dash
  const dashStep = player.stepKinematics(0.05, { moveX: 0, moveY: 0 }, 1280, 720);
  assert.ok(player.x > 500);
  assert.equal(dashStep.spawnGhost, true);

  // Recharge dash energy
  player.addDashEnergy(1.0);
  assert.equal(player.dashCharges, 2);

  // InputController keyboard vector test
  const inputCtrl = new InputController({
    ui: { isTouchMode: false },
    _screenToWorld: (x, y) => ({ x, y }),
  });
  inputCtrl.keys.add('KeyD');
  inputCtrl.keys.add('KeyW');
  const move = inputCtrl.readMoveInput();
  assert.equal(move.moveX, 1);
  assert.equal(move.moveY, -1);
}

console.log('ALL 5 PHASES OF MVVM + OOP + SOLID ARCHITECTURE VERIFICATION PASSED');
