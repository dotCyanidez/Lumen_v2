import { Application, Container, Sprite, Texture } from 'pixi.js';
import { AudioEngine } from './core/AudioEngine.js';
import {
  ABILITY_EVOLUTIONS,
  BLESSINGS,
  COLORS,
  ENEMY_STATS,
  GAME_MODES,
  GAME_STATES,
  MAX_ABILITY_SLOTS,
  MILESTONES_BY_ID,
  OVERDRIVE_WAVES,
  PHASES,
  PLAYER_CONFIG,
  WORLD_CONFIG,
  applyUpgradeOption,
  createDefaultBuildState,
  generateUpgradeDraft,
  getActiveSynergies,
  getDailyTwist,
  getExpForNextLevel,
  getGroupTalentEffects,
  getLevelMaxHpBonus,
  getMedalForScore,
} from './core/Constants.js';
import { CombatService } from './services/CombatService.js';
import { WaveDirectorService } from './services/WaveDirectorService.js';
import {
  clamp,
  createRng,
  damp,
  getTodayDateKey,
  hashSeed,
  lerpVec3,
  rand,
  randRange,
  setRandomSource,
} from './core/MathUtils.js';
import { EventBus } from './core/EventBus.js';
import { storage } from './core/Storage.js';
import { AbilityManager } from './entities/Abilities.js';
import { CollectibleManager } from './entities/Collectibles.js';
import { EnemyManager } from './entities/Enemies.js';
import { Player } from './entities/Player.js';
import { AbyssBackdropFilter, AtmosphereFilter } from './graphics/Shaders.js';
import { createTextures } from './graphics/TextureFactory.js';
import { MetaProfileModel } from './models/MetaProfileModel.js';
import { RunSessionModel } from './models/RunSessionModel.js';
import { SanctuaryEnvironment } from './world/Environment.js';
import { UIManager } from './ui/UIManager.js';
import { InputController } from './views/InputController.js';
import { ParticleSystem } from './vfx/ParticleSystem.js';

const SCORE_GAIN_SCALE = 0.625;

export class LumenGame {
  constructor(hostEl) {
    this.hostEl = hostEl;
    this.app = null;
    this.textures = null;

    this.eventBus = new EventBus();
    this.metaProfileModel = new MetaProfileModel(storage);
    this.runSessionModel = new RunSessionModel();
    this._combatCallbacks = null;
    this._combatSourceCallbacks = new Map();

    this.state = GAME_STATES.TITLE;
    this.width = 1280;
    this.height = 720;
    this.worldWidth = WORLD_CONFIG.width;
    this.worldHeight = WORLD_CONFIG.height;
    this.cameraX = this.worldWidth * 0.5;
    this.cameraY = this.worldHeight * 0.5;
    this.globalTime = 0;

    this.urlSeed = new URLSearchParams(window.location.search).get('seed') || '';
    this.prevSfxVolume = storage.sfxVolume > 0.02 ? storage.sfxVolume : 0.85;
    this.prevAmbientVolume = storage.ambientVolume > 0.02 ? storage.ambientVolume : 0.75;
    this.activeSpirit = storage.getSelectedAppearance();
    this.upgradeFx = storage.getUpgradeEffects();
    this.rerollsLeft = this.upgradeFx.extraRerolls;
    this.banishesLeft = this.upgradeFx.banishes || 0;
    this.banishedAbilities = new Set();
    this.banishedAspects = new Set();
    this.bulwarkAuraTimer = 0;
    this.aegisSpeedTimer = 0;
    this.aegisSpeedMul = 1;
    this.phoenixEmpowerTimer = 0;
    this.phoenixEmpowerMul = 1;
    this.activeDifficulty = storage.getDifficultyObj();
    this.activeDailyTwist = null;
    this.activeSynergies = [];
    this.activeSynergySet = new Set();
    this.shardLuminance = 0;
    this.runMilestonesTriggered = [];
    this.nextOverdriveWave = 1;

    this.audio = new AudioEngine();
    this.audio.setPreferences({
      sfxVolume: storage.sfxVolume,
      ambientVolume: storage.ambientVolume,
    });

    this.ui = new UIManager({
      onStart: () => this.startNewRun(),
      onResume: () => this.resumeGame(),
      onRestart: () => this.startNewRun(),
      onReturnTitle: () => this.returnToTitle(),
      onPauseToggle: () => this.togglePause(),
      onSfxVolume: (vol) => this.setSfxVolume(vol),
      onAmbientVolume: (vol) => this.setAmbientVolume(vol),
      onMuteAll: () => this.toggleMuteAll(),
      onBloomLevel: (val) => this.setBloomLevel(val),
      onToggleScreenShake: () => this.toggleScreenShake(),
      onToggleTutorialTips: () => this.toggleTutorialTips(),
      onToggleGlide: () => this.toggleGlide(),
      onToggleMode: () => this.toggleMode(),
      onSelectMode: (mode) => this.selectMode(mode),
      onSelectDifficulty: (id) => this.selectDifficulty(id),
      onSelectSpirit: (id) => this.selectSpirit(id),
      onSelectStartAbility: (id) => this.selectStartAbility(id),
      onUpgradeSanctuary: (id) => this.upgradeSanctuary(id),
      onSelectTrail: (id) => this.selectTrail(id),
      onSelectPalette: (id) => this.selectPalette(id),
      onTalentAction: (id) => this.upgradeAbilityTalent(id),
      onDevReset: () => this.devResetProgress(),
      onDevMoney: () => this.devAddMoney(100000),
      onTouchDash: () => this.triggerDash(),
      onUIClick: () => this.audio.playUIClick(),
    });
    this._syncPrefsUI();
    this.titleCursorSparkTimer = 0;

    // Gameplay metrics
    this.score = 0;
    this.survivalTime = 0;
    this.purgedCount = 0;
    this.motesCount = 0;
    this.peakChain = 1;
    this.constellationsCompleted = 0;
    this.coresShattered = 0;
    this.recordBrokenThisRun = false;
    this.runStartBest = 0;
    this.abilityRanks = new Map();
    this.abilityRanks.set('resonant_volley', 1);
    this.buildState = createDefaultBuildState();
    this.level = 1;
    this.exp = 0;
    this.expToNext = getExpForNextLevel(1);
    this.pendingLevelUps = 0;
    this.pendingBonusDrafts = [];
    this._activeDraftIsBonus = false;
    this.blessingDraftOpen = false;
    this.blessingDraftLockTimer = 0;
    this.blessingOptions = [];
    this.purgeChainCount = 0;
    this.purgeChainTimer = 0;
    this.aegisWardCooldown = 0;
    this.aegisWardReady = false;
    this.bonusMaxHealth = 0;
    this.shieldRegenDelayTimer = 0;
    this.shieldWasDelaying = false;
    this.lifestealHealAccum = 0;
    this.dashBufferTimer = 0;
    this.dashBufferDirX = undefined;
    this.dashBufferDirY = undefined;
    this.purgeSoundCooldown = 0;
    this.currentPhaseIndex = 0;
    this.overdriveTier = 0;
    this.nextOverdriveCoreTime = 135;
    this.nextVolleyTime = 52;
    this.nextEliteTime = 30;
    this.eliteWaveCount = 0;
    this.elitesDefeated = 0;
    this.runHighlights = [];
    this.lastPurgePos = null;
    this.lowHealthPulseTimer = 0;

    // VFX & camera feel (4-slot circular shockwave buffer)
    this.shakeTrauma = 0;
    this.hitStopTimer = 0;
    this.dyingTimer = 0;
    this.gameOverAge = 0;
    this.damageFlash = 0;
    this.shockWaves = Array.from({ length: 4 }, () => ({
      x: 640,
      y: 360,
      progress: 1.0,
      age: 2.0,
      strength: 0,
    }));
    this.shockCursor = 0;

    this.currentDeep = [...PHASES[0].deepColor];
    this.currentMid = [...PHASES[0].midColor];
    this.currentGlow = [...PHASES[0].glowColor];

    // Tutorial tracking
    this.tutorialStep = 0;
    this.tutorialMoveAccum = 0;
    this.tutorialStepTimer = 0;

    // Input state
    this.inputController = new InputController(this);
    this.keys = this.inputController.keys;
    this.pointer = this.inputController.pointer;
  }

  async init() {
    this.app = new Application();
    await this.app.init({
      resizeTo: this.hostEl,
      backgroundColor: 0x040712,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });

    this.hostEl.appendChild(this.app.canvas);
    this.textures = createTextures();

    this.width = Math.max(1, this.app.screen.width);
    this.height = Math.max(1, this.app.screen.height);

    // Backdrop shader container
    this.backdropFilter = new AbyssBackdropFilter();
    this.backdropContainer = new Container();
    this.backdropQuad = new Sprite(Texture.WHITE);
    this.backdropQuad.width = this.width;
    this.backdropQuad.height = this.height;
    this.backdropContainer.addChild(this.backdropQuad);
    this.backdropContainer.filters = [this.backdropFilter];
    this.backdropContainer.filterArea = this.app.screen;

    // World container (camera pivot locks viewport center onto cameraX, cameraY)
    this.worldContainer = new Container();
    this.worldContainer.pivot.set(this.cameraX, this.cameraY);
    this.worldContainer.position.set(this.width * 0.5, this.height * 0.5);

    this.environment = new SanctuaryEnvironment(this.textures);
    this.collectibles = new CollectibleManager(this.textures);
    this.enemies = new EnemyManager(this.textures);
    this.player = new Player(this.textures);
    this.particles = new ParticleSystem(this.textures);
    this.abilities = new AbilityManager(this.textures);

    this.worldContainer.addChild(
      this.environment.container,
      this.collectibles.container,
      this.enemies.container,
      this.particles.container,
      this.abilities.container,
      this.enemies.overlayContainer,
      this.player.container
    );

    // Apply atmospheric shaders to sceneLayer only; render combat callouts cleanly above bloom
    this.atmosphereFilter = new AtmosphereFilter();
    this.sceneLayer = new Container();
    this.sceneLayer.addChild(this.backdropContainer, this.worldContainer);
    this.sceneLayer.filters = [this.atmosphereFilter];
    this.sceneLayer.filterArea = this.app.screen;

    this.app.stage.addChild(this.sceneLayer, this.particles.calloutLayer);

    this._handleResize(this.width, this.height);
    this._setupTitleScene();
    this.ui.setGameState(GAME_STATES.TITLE, this._titlePayload());

    this.inputController.bindInputs(this);
    this.app.renderer.on('resize', (w, h) => {
      this._handleResize(w, h);
    });

    this.app.ticker.add((ticker) => {
      const rawDt = Math.min(0.05, ticker.deltaMS / 1000);
      try {
        this._update(rawDt);
      } catch (err) {
        console.error('LUMEN frame update error:', err);
      }
    });
  }

  _screenToWorld(sx, sy) {
    return {
      x: sx + this.cameraX - this.width * 0.5,
      y: sy + this.cameraY - this.height * 0.5,
    };
  }

  _worldToScreen(wx, wy) {
    return {
      x: wx - this.cameraX + this.width * 0.5,
      y: wy - this.cameraY + this.height * 0.5,
    };
  }

  _handleResize(newWidth, newHeight) {
    this.width = Math.max(1, newWidth);
    this.height = Math.max(1, newHeight);

    if (this.backdropQuad) {
      this.backdropQuad.width = this.width;
      this.backdropQuad.height = this.height;
    }
    if (this.backdropContainer) {
      this.backdropContainer.filterArea = this.app.screen;
    }
    if (this.sceneLayer) {
      this.sceneLayer.filterArea = this.app.screen;
    }
    if (this.worldContainer) {
      this.worldContainer.pivot.set(this.cameraX, this.cameraY);
      this.worldContainer.position.set(this.width * 0.5, this.height * 0.5);
    }

    // Keep player inside the Sanctuary world bounds on viewport resize
    if (this.player) {
      this.player.x = clamp(this.player.x, 24, this.worldWidth - 24);
      this.player.y = clamp(this.player.y, 24, this.worldHeight - 24);
      if (this.state === GAME_STATES.PLAYING) {
        this.cameraX = this.player.x;
        this.cameraY = this.player.y;
        this.worldContainer?.pivot.set(this.cameraX, this.cameraY);
      }
    }

    if (
      this.environment &&
      (this.environment.width !== this.worldWidth ||
        this.environment.height !== this.worldHeight ||
        this.environment.reeds.length === 0)
    ) {
      this.environment.resize(this.worldWidth, this.worldHeight);
    }
    if (this.state === GAME_STATES.TITLE && this.collectibles) {
      this._setupTitleScene();
    }
  }

  _titlePayload() {
    return {
      highScore: storage.highScore,
      dailyHighScore: storage.dailyHighScore,
      luminance: storage.luminance,
      lifetimeLuminance: storage.lifetimeLuminance,
      selectedSpirit: storage.selectedSpirit,
      selectedStartAbility: storage.selectedStartAbility,
      unlockedStartAbilities: BLESSINGS.filter((b) => storage.isStartAbilityUnlocked(b.id)).map(
        (b) => b.id
      ),
      selectedTrail: storage.selectedTrail,
      selectedPalette: storage.selectedPalette,
      upgrades: storage.data.upgrades,
      talentRanks: storage.data.talentRanks,
      unlockedTrails: storage.data.unlockedTrails,
      unlockedPalettes: storage.data.unlockedPalettes,
      dailyStreak: storage.dailyStreak,
      dailyTwist: getDailyTwist(getTodayDateKey()),
      firstDailyAvailable: storage.isFirstDailyAvailable(),
      claimedMilestones: storage.claimedMilestones,
      bestMedals: storage.bestMedals,
      canAffordSanctuary: storage.canAffordAnySanctuaryUpgrade(),
      activeQuests: storage.getActiveQuestObjects(),
      gameMode: storage.gameMode,
      difficulty: storage.difficulty,
    };
  }

  _syncPrefsUI() {
    this.audio.setPreferences({
      sfxVolume: storage.sfxVolume,
      ambientVolume: storage.ambientVolume,
    });
    this.ui.syncPreferences({
      sfxVolume: storage.sfxVolume,
      ambientVolume: storage.ambientVolume,
      cursorGlide: storage.cursorGlide,
      gameMode: storage.gameMode,
      difficulty: storage.difficulty,
      bloomLevel: storage.bloomLevel,
      screenShake: storage.screenShake,
      tutorialCompleted: storage.tutorialCompleted,
    });
    this.ui.renderSpiritSelector({
      luminance: storage.lifetimeLuminance,
      selectedSpirit: storage.selectedSpirit,
      isPaused: this.state === GAME_STATES.PAUSED,
    });
    this.ui.renderSanctuary?.(this._titlePayload());
    if (this.state === GAME_STATES.TITLE) {
      this.ui.renderTitleMeta(this._titlePayload());
    }
  }

  setBloomLevel(val) {
    storage.bloomLevel = clamp(val, 0, 1);
    this._syncPrefsUI();
  }

  toggleScreenShake() {
    this.audio.unlock();
    storage.screenShake = !storage.screenShake;
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  toggleTutorialTips() {
    this.audio.unlock();
    storage.setTutorialCompleted(!storage.tutorialCompleted);
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  setSfxVolume(vol) {
    this.audio.unlock();
    const clamped = clamp(vol, 0, 1);
    if (clamped > 0.02) this.prevSfxVolume = clamped;
    storage.sfxVolume = clamped;
    this._syncPrefsUI();
  }

  setAmbientVolume(vol) {
    this.audio.unlock();
    const clamped = clamp(vol, 0, 1);
    if (clamped > 0.02) this.prevAmbientVolume = clamped;
    storage.ambientVolume = clamped;
    this._syncPrefsUI();
  }

  toggleMuteAll() {
    this.audio.unlock();
    const anyOn = storage.sfxVolume > 0.005 || storage.ambientVolume > 0.005;
    if (anyOn) {
      if (storage.sfxVolume > 0.02) this.prevSfxVolume = storage.sfxVolume;
      if (storage.ambientVolume > 0.02) this.prevAmbientVolume = storage.ambientVolume;
      storage.sfxVolume = 0;
      storage.ambientVolume = 0;
    } else {
      storage.sfxVolume = this.prevSfxVolume || 0.85;
      storage.ambientVolume = this.prevAmbientVolume || 0.75;
    }
    this._syncPrefsUI();
    if (storage.sfxEnabled) this.audio.playUIClick();
  }

  toggleGlide() {
    this.audio.unlock();
    storage.cursorGlide = !storage.cursorGlide;
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  toggleMode() {
    this.audio.unlock();
    const order = [GAME_MODES.ARCADE, GAME_MODES.DAILY, GAME_MODES.ZEN];
    const next = order[(order.indexOf(storage.gameMode) + 1) % order.length];
    storage.gameMode = next;
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  selectMode(mode) {
    this.audio.unlock();
    if (storage.gameMode === mode) return;
    storage.gameMode = mode;
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  selectDifficulty(id) {
    this.audio.unlock();
    if (storage.difficulty === id) return;
    storage.difficulty = id;
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  selectStartAbility(id) {
    this.audio.unlock();
    if (!storage.selectStartAbility(id)) return;
    this.audio.playLevelUp();
    this._syncPrefsUI();
  }

  selectSpirit(id) {
    this.audio.unlock();
    storage.selectedSpirit = id;
    this.activeSpirit = storage.getSelectedAppearance();
    if (this.state === GAME_STATES.TITLE && this.player) {
      this.player.applySpiritMods(this.activeSpirit);
    }
    this._syncPrefsUI();
  }

  upgradeSanctuary(id) {
    this.audio.unlock();
    if (!storage.buySanctuaryUpgrade(id)) return;
    this.upgradeFx = storage.getUpgradeEffects();
    this.audio.playLevelUp();
    this._syncPrefsUI();
  }

  selectTrail(id) {
    this.audio.unlock();
    if (!storage.buyOrSelectTrail(id)) return;
    this.activeSpirit = storage.getSelectedAppearance();
    if (this.player) {
      this.player.applySpiritMods(this.activeSpirit);
    }
    this.audio.playUIClick();
    this._syncPrefsUI();
  }

  selectPalette(id) {
    this.audio.unlock();
    if (!storage.buyOrSelectPalette(id)) return;
    this.activeSpirit = storage.getSelectedAppearance();
    if (this.player) {
      this.player.applySpiritMods(this.activeSpirit);
    }
    this.audio.playUIClick();
    this._syncPrefsUI();
  }

  upgradeAbilityTalent(id) {
    this.audio.unlock();
    if (!storage.buyAbilityTalent(id)) return;
    this.audio.playLevelUp();
    this._syncPrefsUI();
  }

  devResetProgress() {
    this.audio.unlock();
    storage.resetProgress();
    this.upgradeFx = storage.getUpgradeEffects();
    this.rerollsLeft = this.upgradeFx.extraRerolls;
    this.banishesLeft = this.upgradeFx.banishes || 0;
    this.banishedAbilities = new Set();
    this.banishedAspects = new Set();
    this.activeDifficulty = storage.getDifficultyObj();
    this.activeSpirit = storage.getSelectedAppearance();
    if (this.state === GAME_STATES.TITLE && this.player) {
      this.player.applySpiritMods(this.activeSpirit);
    }
    this.ui.resetSanctuarySelection?.();
    this._syncPrefsUI();
    this.audio.playUIClick();
  }

  devAddMoney(amount = 100000) {
    this.audio.unlock();
    storage.addLuminance(amount);
    this._syncPrefsUI();
    this.audio.playLevelUp();
  }

  _callout(x, y, text, color, scale = 1.0) {
    const sp = this._worldToScreen(x, y);
    if (sp.x < -90 || sp.x > this.width + 90 || sp.y < -90 || sp.y > this.height + 90) {
      return;
    }
    this.particles.spawnCallout(sp.x, sp.y, text, color, scale, this.width, this.height);
  }

  _recordHighlight(x, y, gold = false) {
    if (this.runHighlights.length >= 26) {
      this.runHighlights.shift();
    }
    this.runHighlights.push({
      nx: clamp(x / Math.max(1, this.worldWidth), 0.04, 0.96),
      ny: clamp(y / Math.max(1, this.worldHeight), 0.06, 0.94),
      gold,
    });
  }

  startNewRun() {
    this.audio.unlock();
    this.audio.playUIClick();

    // Seed deterministic stream for DAILY TIDE (or custom ?seed= link), reset for Arcade/Zen
    const seedKey =
      storage.gameMode === GAME_MODES.DAILY ? this.urlSeed || getTodayDateKey() : this.urlSeed;
    setRandomSource(seedKey ? createRng(hashSeed(seedKey)) : Math.random);

    this.activeSpirit = storage.getSelectedAppearance();
    this.upgradeFx = storage.getUpgradeEffects();
    this.rerollsLeft = this.upgradeFx.extraRerolls;
    this.banishesLeft = this.upgradeFx.banishes || 0;
    this.banishedAbilities = new Set();
    this.banishedAspects = new Set();
    this.bulwarkAuraTimer = 0;
    this.aegisSpeedTimer = 0;
    this.aegisSpeedMul = 1;
    this.phoenixEmpowerTimer = 0;
    this.phoenixEmpowerMul = 1;
    this.activeDifficulty = storage.getDifficultyObj();
    this.activeDailyTwist =
      storage.gameMode === GAME_MODES.DAILY ? getDailyTwist(seedKey || getTodayDateKey()) : null;
    this.shardLuminance = 0;
    this.runMilestonesTriggered = [];
    this.nextOverdriveWave = 1;
    this.runStartBest =
      storage.gameMode === GAME_MODES.DAILY ? storage.dailyHighScore : storage.highScore;

    this.state = GAME_STATES.PLAYING;
    this.score = 0;
    this.survivalTime = 0;
    this.purgedCount = 0;
    this.motesCount = 0;
    this.peakChain = 1;
    this.constellationsCompleted = 0;
    this.coresShattered = 0;
    this.recordBrokenThisRun = false;
    this.aegisWardCooldown = 0;
    this.aegisWardReady = false;
    this.bonusMaxHealth = 0;
    this.shieldRegenDelayTimer = 0;
    this.shieldWasDelaying = false;
    this.lifestealHealAccum = 0;
    this.dashBufferTimer = 0;
    this.dashBufferDirX = undefined;
    this.dashBufferDirY = undefined;
    this.abilityRanks.clear();
    this.buildState = createDefaultBuildState();
    const startId = storage.selectedStartAbility;
    const startDef = BLESSINGS.find((b) => b.id === startId);
    if (!startDef || startDef.id === 'resonant_volley') {
      this.abilityRanks.set('resonant_volley', 1);
    } else if (startDef.category === 'utility') {
      this.abilityRanks.set('resonant_volley', 1);
      applyUpgradeOption(
        { id: startId, abilityId: startId, aspect: 'unlock', mode: 'unlock', val: 1 },
        this.abilityRanks,
        this.buildState
      );
      if (startId === 'aegis_bloom') {
        this.aegisWardReady = true;
      }
    } else {
      this.abilityRanks.set(startId, 1);
    }
    this.activeSynergies = getActiveSynergies(this.abilityRanks);
    this.activeSynergySet = new Set(this.activeSynergies.map((s) => s.id));
    this.level = 1;
    this.exp = 0;
    this.expToNext = getExpForNextLevel(1);
    this.pendingLevelUps = 0;
    this.pendingBonusDrafts = [];
    this._activeDraftIsBonus = false;
    this.blessingDraftOpen = false;
    this.blessingDraftLockTimer = 0;
    this.blessingOptions = [];
    this.purgeChainCount = 0;
    this.purgeChainTimer = 0;
    this.purgeSoundCooldown = 0;
    this.ui.hideBlessingDraft();

    this.currentPhaseIndex = 0;
    this.overdriveTier = 0;
    this.nextOverdriveCoreTime = 135;
    this.nextVolleyTime = 52;
    this.nextEliteTime = 30;
    this.eliteWaveCount = 0;
    this.elitesDefeated = 0;
    this.runHighlights = [{ nx: 0.5, ny: 0.5, gold: false }];
    this.lastPurgePos = null;
    this.lowHealthPulseTimer = 0;
    this.shakeTrauma = 0;
    this.hitStopTimer = 0;
    this.damageFlash = 0;
    for (const sw of this.shockWaves) {
      sw.progress = 1.0;
      sw.age = 2.0;
      sw.strength = 0;
    }

    this.player.reset(this.worldWidth * 0.5, this.worldHeight * 0.5, this.activeSpirit);
    this._syncMaxHealth(false);
    this._syncShieldState(true);
    this.cameraX = this.player.x;
    this.cameraY = this.player.y;
    this.worldContainer?.pivot.set(this.cameraX, this.cameraY);
    this._syncPlayerCardModifiers();
    this.collectibles.reset();
    this.enemies.reset();
    this.abilities.reset();
    this.particles.clearAll();
    this.particles.calloutLayer.visible = true;

    this.collectibles.seedInitial(this.worldWidth, this.worldHeight, this.player.x, this.player.y);
    this.particles.emitShockRing(
      this.player.x,
      this.player.y,
      0.2,
      2.8,
      this.activeSpirit.colorHex,
      0.7,
      0.85
    );
    this._triggerShockwave(this.player.x, this.player.y, 0.45);

    const diffTag = this.activeDifficulty?.id !== 'normal' ? ` · ${this.activeDifficulty.label}` : '';
    const hudPhase = storage.zenMode
      ? `${PHASES[0].code} · ZEN`
      : storage.isDailyMode
        ? `${PHASES[0].code} · DAILY${diffTag}`
        : `${PHASES[0].code}${diffTag}`;
    this.ui.resetHUD(
      hudPhase,
      this.player.maxHealth,
      this.player.maxDashCharges,
      storage.gameMode,
      {
        level: 1,
        exp: 0,
        expToNext: this.expToNext,
        abilityRanks: this.abilityRanks,
        talentRanks: storage.data.talentRanks,
        activeSynergies: this.activeSynergies,
        shield: this.player.shield,
        maxShield: this.player.maxShield,
      }
    );
    this.ui.setGameState(GAME_STATES.PLAYING);
    if (this.activeDailyTwist) {
      this.ui.showPhaseBanner({
        code: storage.isFirstDailyAvailable() ? 'DAILY TIDE · 2× LUM' : 'DAILY TIDE',
        name: this.activeDailyTwist.name.toUpperCase(),
        subtitle: this.activeDailyTwist.desc,
      });
    } else if (this.activeDifficulty?.id !== 'normal') {
      this.ui.showPhaseBanner({
        code: `${PHASES[0].code} · ${this.activeDifficulty.label}`,
        name: PHASES[0].name,
        subtitle: this.activeDifficulty.desc,
      });
    } else {
      this.ui.showPhaseBanner(PHASES[0]);
    }
    this.audio.setAmbientMood({ intensity: 0, paused: false, active: true, dying: false });

    // Begin gentle non-blocking onboarding tips only if not completed yet
    if (!storage.tutorialCompleted) {
      this.tutorialStep = 1;
      this.tutorialMoveAccum = 0;
      this.tutorialStepTimer = 0;
      const moveHint = this.ui.isTouchMode
        ? 'Drag anywhere to glide Lumen'
        : 'Move with WASD, Arrow Keys, or hold Left-Click & drag';
      this.ui.showTutorialStep(1, 3, moveHint);
    } else {
      this.tutorialStep = 0;
      this.ui.hideTutorial();
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.pauseGame();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    this.particles.calloutLayer.visible = false;
    this.audio.playUIClick();
    this.audio.setAmbientMood({
      intensity: this.currentPhaseIndex / (PHASES.length - 1),
      paused: true,
      active: false,
    });
    this.ui.setGameState(GAME_STATES.PAUSED, {
      score: this.score,
      bestScore: storage.isDailyMode ? storage.dailyHighScore : storage.highScore,
      abilityRanks: this.abilityRanks,
      buildState: this.buildState,
      talentRanks: storage.data.talentRanks,
      activeSynergies: this.activeSynergies,
      banishedAbilities: this.banishedAbilities,
      level: this.level,
    });
  }

  resumeGame() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.audio.playUIClick();
    this.state = GAME_STATES.PLAYING;
    this.particles.calloutLayer.visible = true;
    this.audio.setAmbientMood({
      intensity: this.currentPhaseIndex / (PHASES.length - 1),
      paused: false,
      active: true,
    });
    this.ui.setGameState(GAME_STATES.PLAYING);
  }

  _setupTitleScene() {
    this.activeSpirit = storage.getSelectedAppearance();
    this.cameraX = this.worldWidth * 0.5;
    this.cameraY = this.worldHeight * 0.5;
    this.worldContainer?.pivot.set(this.cameraX, this.cameraY);
    const titleY = this.cameraY - Math.min(this.height * 0.36, 260);
    this.player.reset(
      this.cameraX,
      Math.max(this.cameraY - this.height * 0.5 + 70, titleY),
      this.activeSpirit
    );
    this.collectibles.reset();
    // Decorative floating motes framing the sanctuary on the title screen
    const spots = [
      [0.14, 0.28, false],
      [0.86, 0.24, true],
      [0.12, 0.72, true],
      [0.88, 0.74, false],
    ];
    for (const [nx, ny, gold] of spots) {
      const mx = this.cameraX + (nx - 0.5) * this.width;
      const my = this.cameraY + (ny - 0.5) * this.height;
      this.collectibles.spawnMote(mx, my, gold);
    }
  }

  returnToTitle() {
    this.audio.playUIClick();
    this.blessingDraftOpen = false;
    this.blessingOptions = [];
    this.ui.hideBlessingDraft();
    this.state = GAME_STATES.TITLE;
    this.enemies.reset();
    this.particles.clearAll();
    this.particles.calloutLayer.visible = true;
    this._setupTitleScene();
    this.currentPhaseIndex = 0;
    this.audio.setAmbientMood({ intensity: 0, paused: false, active: false });
    this.ui.setGameState(GAME_STATES.TITLE, this._titlePayload());
  }

  _readMoveInput() {
    return this.inputController.readMoveInput(this);
  }

  triggerDash(overrideDx, overrideDy, fromBuffer = false) {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.audio.unlock();

    let dx = overrideDx;
    let dy = overrideDy;
    if (dx === undefined || dy === undefined) {
      const inp = this._readMoveInput();
      if (inp.moveX !== 0 || inp.moveY !== 0) {
        dx = inp.moveX;
        dy = inp.moveY;
      } else if (inp.pointerActive) {
        dx = inp.pointerX - this.player.x;
        dy = inp.pointerY - this.player.y;
      } else if (this.pointer.inside && !this.ui.isTouchMode) {
        const wp = this._screenToWorld(this.pointer.x, this.pointer.y);
        dx = wp.x - this.player.x;
        dy = wp.y - this.player.y;
      } else if (Math.hypot(this.player.vx, this.player.vy) > 15) {
        dx = this.player.vx;
        dy = this.player.vy;
      } else {
        dx = Math.cos(this.player.facingAngle);
        dy = Math.sin(this.player.facingAngle);
      }
    }

    const dashOriginX = this.player.x;
    const dashOriginY = this.player.y;
    if (!this.player.tryDash(dx, dy)) {
      if (!fromBuffer) {
        this.dashBufferTimer = 0.12;
        this.dashBufferDirX = overrideDx;
        this.dashBufferDirY = overrideDy;
      }
      return;
    }
    this.dashBufferTimer = 0;
    {
      const aegisSt = this.buildState.aegis_bloom;
      const aegisFx = this._getGroupTalent('aegis_bloom');
      if ((this._getCardRank('aegis_bloom') || 0) > 0) {
        const dashDurationScaled =
          (PLAYER_CONFIG.dashDuration + 0.18) * (aegisSt?.dashGraceMul || 1) * (aegisFx?.graceMul || 1);
        this.player.invulnTimer = Math.max(this.player.invulnTimer, dashDurationScaled);
      }
      this.audio.playDash();
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.24);
      this.particles.emitDashBurst(this.player.x, this.player.y, this.player.facingAngle);
      this._triggerShockwave(this.player.x, this.player.y, 0.65);

      if (this.tutorialStep === 2) {
        this.tutorialStep = 3;
        this.tutorialStepTimer = 0;
        this.ui.showTutorialStep(
          3,
          3,
          'Starlight fires automatically! Gather Light Motes & defeat shadows to draft Ability Cards.'
        );
      }
    }
  }

  _triggerShockwave(x, y, strength) {
    const slot = this.shockWaves[this.shockCursor];
    this.shockCursor = (this.shockCursor + 1) % this.shockWaves.length;
    slot.x = x;
    slot.y = y;
    slot.progress = 0.001;
    slot.age = 0.001;
    slot.strength = strength;
  }

  _addScore(rawPoints) {
    const pts = Math.round(
      rawPoints * SCORE_GAIN_SCALE * (this.activeDifficulty?.scoreMul || 1)
    );
    this.score += pts;
    return pts;
  }

  _onCollectItem(item) {
    this.motesCount++;
    const gravFx = this._getGroupTalent('gravity_harvest');
    const twistMoteMul = item.type === 'mote' ? this.activeDailyTwist?.moteScoreMul || 1 : 1;
    const moteHoardMul = item.type === 'mote' ? gravFx?.expScoreMul || 1 : 1;
    const earned = this._addScore(item.baseValue * twistMoteMul * moteHoardMul);

    if (item.type === 'shard') {
      const lum = Math.max(5, Math.round(item.lumValue || 38));
      this.shardLuminance += lum;
      this.audio.playPrism();
      this.particles.emitPrismBurst(item.x, item.y);
      this.player.addDashEnergy(0.6);
      this._callout(item.x, item.y - 16, `+${lum} LUM SHARD!`, '#e8bcff', 1.2);
    } else if (item.type === 'prism') {
      this.audio.playPrism();
      this.particles.emitPrismBurst(item.x, item.y);
      this._triggerShockwave(item.x, item.y, 0.85);
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.34);

      this.player.addDashEnergy(1.0);
      this.enemies.applyRepulse(item.x, item.y, 320, 340);

      const heal = Math.min(25, this.player.maxHealth - this.player.health);
      if (heal > 0) {
        this.player.health += heal;
        this._callout(item.x, item.y - 16, `+${earned}  +${heal} HP`, '#9efff5', 1.2);
      } else {
        this._callout(item.x, item.y - 16, `+${earned} PRISM!`, '#ffe599', 1.2);
      }
    } else if (item.type === 'star') {
      const remaining = this.collectibles.countRemainingInConstellation(item.constellationId);
      const step = 3 - remaining;
      this.audio.playConstellationStep(step);
      this.particles.emitMotePickup(item.x, item.y, COLORS.lumenGold);

      if (remaining === 0) {
        this.constellationsCompleted++;
        // Completed 3-star Constellation -> SUPERNOVA!
        const superBonus = this._addScore(450);
        this._recordHighlight(item.x, item.y, true);
        this.player.addDashEnergy(2.0);
        this.particles.emitPrismBurst(item.x, item.y);
        this._triggerShockwave(item.x, item.y, 1.0);
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.5);
        this.enemies.purgeNear(item.x, item.y, 260, (px, py, kind) => {
          this.purgedCount++;
          this._addScore(120);
          this.particles.emitPurgeExplosion(px, py);
          this._addExp(ENEMY_STATS[kind]?.exp || 10, px, py);
        });
        this.enemies.applyRepulse(item.x, item.y, 440, 420);
        this._callout(item.x, item.y - 20, `SUPERNOVA! +${earned + superBonus}`, '#ffe599', 1.3);
      } else {
        this.player.addDashEnergy(0.3);
        this._callout(item.x, item.y - 16, `STAR ${step}/3 +${earned}`, '#ffe599', 1.05);
      }
    } else {
      this.audio.playMote(1 + (this.motesCount % 5));
      this.player.addDashEnergy(item.isGolden ? 0.24 : 0.14);
      const tint = item.isGolden ? COLORS.moteGold : COLORS.moteCyan;
      this.particles.emitMotePickup(item.x, item.y, tint);
      this._callout(
        item.x,
        item.y - 14,
        `+${earned}`,
        item.isGolden ? '#ffe599' : '#9efff5',
        item.isGolden ? 1.05 : 0.9
      );
    }

    if (gravFx?.bountyLum > 0 && this.motesCount % 12 === 0) {
      this.shardLuminance += gravFx.bountyLum;
      if (gravFx.spawnGoldMote) {
        this.collectibles.spawnMote(item.x + randRange(-24, 24), item.y + randRange(-24, 24), true);
      }
      this._callout(item.x, item.y - 24, `+${gravFx.bountyLum} LUM BOUNTY!`, '#ffe599', 1.15);
    }

    if (gravFx?.vacuumRadius > 0 && this.motesCount % 10 === 0) {
      this.collectibles.magnetizeAllNear(this.player.x, this.player.y, gravFx.vacuumRadius);
      this.particles.emitShockRing(this.player.x, this.player.y, 0.14, 2.0, COLORS.lumenCyan, 0.28, 0.48);
    }

    const gravRank = this._getCardRank('gravity_harvest');
    const gravInterval = gravRank >= 10 ? 8 : 10;
    if (gravRank >= 5 && this.motesCount % gravInterval === 0) {
      const novaR = gravRank >= 10 ? 185 : 150;
      const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
      const novaDmg = +((gravRank >= 10 ? 20 : 12) * dmgBonus).toFixed(3);
      this.collectibles.magnetizeAllNear(this.player.x, this.player.y, novaR * 1.45);
      this.enemies.damageRadius(
        this.player.x,
        this.player.y,
        novaR,
        novaDmg,
        145,
        0.35,
        this._getCombatCallbacks('gravity_harvest')
      );
      this.particles.emitShockRing(this.player.x, this.player.y, 0.16, novaR / 58, COLORS.lumenCyan, 0.36, 0.6);
    }

    if (gravFx?.specialNovaDmg > 0 && (item.type === 'prism' || item.type === 'star' || item.isGolden)) {
      const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
      this.enemies.damageRadius(
        item.x,
        item.y,
        135,
        +(gravFx.specialNovaDmg * dmgBonus).toFixed(3),
        140,
        0.3,
        this._getCombatCallbacks('gravity_harvest')
      );
      if (gravFx.specialDashEnergy > 0) {
        this.player.addDashEnergy(gravFx.specialDashEnergy);
      }
      this.particles.emitShockRing(item.x, item.y, 0.14, 2.0, COLORS.lumenGold, 0.34, 0.56);
    }
  }

  _getCardRank(id) {
    return this.abilityRanks.get(id) || 0;
  }

  _getGroupTalent(abilityId) {
    if (this._getCardRank(abilityId) <= 0) return null;
    return getGroupTalentEffects(abilityId, storage.data.talentRanks);
  }

  _getCombatCallbacks(sourceAbility = null) {
    this._combatCallbacks ||= {
      onPurge: (ex, ey, kind, isElite) => this._onPurgeEnemy(ex, ey, kind, isElite),
      onEnemyHit: (ex, ey) => this._onEnemyHit(ex, ey),
      onHit: (ex, ey, damage) => this._onHitPlayer(ex, ey, damage),
      onLancerTelegraph: () => this.audio.playLancerCharge(),
      onSpitterTelegraph: () => this.audio.playSpitterCharge(),
      onArtilleryTelegraph: () => this.audio.playArtilleryCharge(),
      onHarbingerRingTelegraph: () => this.audio.playHarbingerRingCharge(),
      onHarbingerBoltTelegraph: () => this.audio.playHarbingerBoltCharge(),
      onBehemothTelegraph: () => this.audio.playBehemothCharge(),
      onCoreTelegraph: () => this.audio.playCoreRingCharge(),
      onRestoreShield: (amount) => {
        if (this.player.maxShield > 0 && amount > 0) {
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + amount);
        }
      },
      onCoreCrack: (cx, cy, rem) => this._onCoreCrack(cx, cy, rem),
      onCoreShatter: (cx, cy) => this._onCoreShatter(cx, cy),
      onDamageNumber: (ex, ey, amount, isDot = false, isCrit = false, src = null) => {
        if (this.state !== GAME_STATES.PLAYING || !this.particles?.calloutLayer?.visible) return;
        const sp = this._worldToScreen(ex, ey);
        if (sp.x < -30 || sp.x > this.width + 30 || sp.y < -30 || sp.y > this.height + 30) return;
        this.particles.spawnDamageNumber(sp.x, sp.y, amount, {
          isDot,
          isCrit,
          sourceAbility: src,
        });
      },
      onAbilityDamage: (id, dmg, killed, isDot) => {
        this.abilities.recordDamage(id, dmg, killed, isDot);
        if (dmg > 0 && this.state === GAME_STATES.PLAYING && this.player.health < this.player.maxHealth) {
          const fx = this._getCardRank(id) > 0 ? this._getGroupTalent(id) : null;
          const lsRate = fx?.lifestealPct || 0;
          const healed = CombatService.computeLifestealHeal(
            dmg,
            lsRate,
            this.player.health,
            this.player.maxHealth
          );
          if (healed > 0) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + healed);
            this.lifestealHealAccum += healed;
            if (this.lifestealHealAccum >= 3) {
              const shown = Math.floor(this.lifestealHealAccum);
              this.lifestealHealAccum -= shown;
              this.particles.emitShockRing(this.player.x, this.player.y, 0.12, 1.15, 0x7cf8e8, 0.24, 0.42);
              this._callout(this.player.x, this.player.y - 30, `+${shown} HP`, '#7cf8e8', 0.92);
            }
          }
        }
      },
      onVoidParry: (cx, cy) => this._onVoidParry(cx, cy),
      onEventHorizonPull: (cx, cy, radius) =>
        this.collectibles.magnetizeAllNear(cx, cy, radius),
      onDashRestore: (fraction) => this.player.addDashEnergy(fraction),
      onDashCdrSeconds: (sec) =>
        this.player.addDashEnergy(sec / PLAYER_CONFIG.dashRechargeTime),
    };

    if (!sourceAbility) return this._combatCallbacks;
    this._combatSourceCallbacks ||= new Map();
    let wrapped = this._combatSourceCallbacks.get(sourceAbility);
    if (!wrapped) {
      wrapped = { ...this._combatCallbacks, sourceAbility };
      this._combatSourceCallbacks.set(sourceAbility, wrapped);
    }
    return wrapped;
  }

  _onVoidParry(cx, cy) {
    const bonus = this._addScore(260);
    this._addExp(20);
    this.shardLuminance += 10;
    this.player.addDashEnergy(0.75);
    this.audio.playIgnitionChime();
    this.particles.emitPrismBurst(cx, cy);
    this._triggerShockwave(cx, cy, 0.72);
    this._callout(
      this.player.x,
      this.player.y - 38,
      `VOID PARRY! +${bonus} · +10 LUM`,
      '#9efff5',
      1.25
    );
  }

  _triggerMilestone(id) {
    const mDef = MILESTONES_BY_ID[id];
    if (!mDef) return;
    if (this.runMilestonesTriggered.includes(id) || storage.claimedMilestones.includes(id)) return;
    this.runMilestonesTriggered.push(id);
    this.audio.playRecordChime();
    this._callout(
      this.player.x,
      this.player.y - 64,
      `★ MILESTONE: ${mDef.name.toUpperCase()} (+${mDef.reward} LUM)`,
      '#ffe599',
      1.2
    );
  }

  _checkMedalMilestones() {
    if (storage.zenMode) return;
    const achieved = getMedalForScore(this.score).achieved;
    if (!achieved) return;
    const id = achieved.id;
    if (id === 'astral' || id === 'eclipse' || id === 'celestial' || id === 'supernova') {
      this._triggerMilestone('medal_astral');
    }
    if (id === 'eclipse' || id === 'celestial' || id === 'supernova') {
      this._triggerMilestone('medal_eclipse');
    }
    if (id === 'celestial' || id === 'supernova') {
      this._triggerMilestone('medal_celestial');
    }
    if (id === 'supernova') {
      this._triggerMilestone('medal_supernova');
    }
  }

  _refreshSynergies() {
    const prevIds = new Set(this.activeSynergies.map((s) => s.id));
    this.activeSynergies = getActiveSynergies(this.abilityRanks);
    this.activeSynergySet = new Set(this.activeSynergies.map((s) => s.id));
    for (const s of this.activeSynergies) {
      if (!prevIds.has(s.id)) {
        this.audio.playIgnitionChime();
        this._triggerShockwave(this.player.x, this.player.y, 0.78);
        this._callout(
          this.player.x,
          this.player.y - 78,
          `✦ SYNERGY: ${s.name.toUpperCase()}!`,
          '#9efff5',
          1.24
        );
      }
    }
  }

  _getExpMultiplier() {
    const gravFx = this._getGroupTalent('gravity_harvest');
    const diffMul = this.activeDifficulty?.expMul || 1;
    const twistMul = this.activeDailyTwist?.expMul || 1;
    return (
      (this.buildState.gravity_harvest?.expMul || 1) *
      (this.upgradeFx?.expMul || 1) *
      (gravFx?.expScoreMul || 1) *
      diffMul *
      twistMul
    );
  }

  _syncPlayerCardModifiers() {
    const speedMul = Math.min(
      2.25,
      (this.upgradeFx?.speedMul || 1) *
        (this.activeDailyTwist?.speedMul || 1) *
        (this.aegisSpeedTimer > 0 ? this.aegisSpeedMul : 1)
    );
    const dashRechargeMul =
      1 /
      ((this.upgradeFx?.dashRateMul || 1) *
        (this.activeDailyTwist?.dashRateMul || 1));
    this.player.setCardModifiers({
      speedMul,
      dashRechargeMul,
      aegisReady: this.aegisWardReady,
      extraDashes: 0,
    });
  }

  _syncMaxHealth(healGain = true) {
    const baseMax = this.activeSpirit?.maxHealth || PLAYER_CONFIG.maxHealth;
    const prevMax = this.player.maxHealth;
    const nextMax = baseMax + getLevelMaxHpBonus(this.level) + (this.bonusMaxHealth || 0);
    this.player.maxHealth = nextMax;
    if (healGain && nextMax > prevMax) {
      this.player.health = Math.min(nextMax, this.player.health + (nextMax - prevMax));
    } else if (this.player.health > nextMax) {
      this.player.health = nextMax;
    }
    return nextMax - prevMax;
  }

  _syncShieldState(grantDelta = true) {
    const rank = this._getCardRank('astral_shield');
    if (rank <= 0) {
      this.player.maxShield = 0;
      this.player.shield = 0;
      return 0;
    }
    const st = this.buildState.astral_shield;
    const fx = this._getGroupTalent('astral_shield');
    const prevMax = this.player.maxShield || 0;
    const nextMax = CombatService.computeMaxShield(rank, st, fx);
    this.player.maxShield = nextMax;
    if (grantDelta && nextMax > prevMax) {
      this.player.shield = Math.min(nextMax, (this.player.shield || 0) + (nextMax - prevMax));
    } else if (this.player.shield > nextMax) {
      this.player.shield = nextMax;
    }
    return nextMax - prevMax;
  }

  _triggerShieldStaticPulse(shieldRank) {
    if (shieldRank < 5) return;
    const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
    const pulseDmg = +((shieldRank >= 10 ? 13.5 : 7.5) * dmgBonus).toFixed(3);
    this.enemies.damageRadius(
      this.player.x,
      this.player.y,
      140,
      pulseDmg,
      180,
      0.4,
      this._getCombatCallbacks('astral_shield')
    );
    this.particles.emitShockRing(this.player.x, this.player.y, 0.16, 140 / 56, 0x7ec8ff, 0.36, 0.6);
  }

  _addExp(rawAmount) {
    const gained = Math.max(1, Math.round(rawAmount * this._getExpMultiplier()));
    this.exp += gained;
    let totalHpGain = 0;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = getExpForNextLevel(this.level);
      this.pendingLevelUps++;
      totalHpGain += this._syncMaxHealth(true);
    }
    if (totalHpGain > 0 && this.state === GAME_STATES.PLAYING) {
      this._callout(this.player.x, this.player.y - 44, `+${totalHpGain} MAX HP`, '#7cf8e8', 1.05);
    }
    return gained;
  }

  _buildDraftOptions(isBonus = false, excludeUids = null) {
    const rareBonus = (this.upgradeFx?.rareBonus || 0) + (isBonus ? 0.25 : 0);
    const luck = (this.upgradeFx?.luck || 0) + (isBonus ? 0.35 : 0);
    return generateUpgradeDraft(this.abilityRanks, this.buildState, rand, {
      rareChanceBonus: rareBonus,
      luck,
      banishedAbilities: this.banishedAbilities,
      banishedAspects: this.banishedAspects,
      excludeUids,
    });
  }

  _presentDraftUI() {
    const customEyebrow = this._activeDraftIsBonus ? this.pendingBonusDrafts[0] : null;
    this.ui.showBlessingDraft(
      this.blessingOptions,
      (uid) => this.chooseBlessing(uid),
      this.level,
      {
        eyebrow: customEyebrow,
        rerollsLeft: this.rerollsLeft,
        banishesLeft: this.banishesLeft,
        banishedAbilities: this.banishedAbilities,
        abilityRanks: this.abilityRanks,
        buildState: this.buildState,
        talentRanks: storage.data.talentRanks,
        activeSynergies: this.activeSynergies,
        onReroll: () => this.rerollBlessingDraft(),
        onBanish: (uid) => this.banishDraftOption(uid),
      }
    );
  }

  _maybeOpenPendingLevelDraft() {
    const hasBonusDraft = this.pendingBonusDrafts.length > 0;
    if (
      (!hasBonusDraft && this.pendingLevelUps <= 0) ||
      this.blessingDraftOpen ||
      this.state !== GAME_STATES.PLAYING
    ) {
      return;
    }

    this.blessingOptions = this._buildDraftOptions(hasBonusDraft);
    if (this.blessingOptions.length <= 0) return;

    this._activeDraftIsBonus = hasBonusDraft;
    this.blessingDraftOpen = true;
    this.blessingDraftLockTimer = 0.28;
    this.particles.calloutLayer.visible = false;
    this.audio.playLevelUp();
    this.audio.setAmbientMood({
      intensity: this.currentPhaseIndex / (PHASES.length - 1),
      paused: true,
      active: true,
    });
    this._presentDraftUI();
  }

  rerollBlessingDraft() {
    if (!this.blessingDraftOpen || this.rerollsLeft <= 0) return;
    this.rerollsLeft--;
    this.audio.unlock();
    this.audio.playUIClick();
    const prevUids = new Set(this.blessingOptions.map((o) => o.uid));
    let nextOpts = this._buildDraftOptions(this._activeDraftIsBonus, prevUids);
    if (nextOpts.every((o) => prevUids.has(o.uid))) {
      nextOpts = this._buildDraftOptions(this._activeDraftIsBonus, prevUids);
    }
    this.blessingOptions = nextOpts;
    this.blessingDraftLockTimer = 0.16;
    this._presentDraftUI();
  }

  banishDraftOption(optionOrUid) {
    if (!this.blessingDraftOpen || this.banishesLeft <= 0) return;
    const target = this.blessingOptions.find(
      (o) => o.uid === optionOrUid || o.id === optionOrUid || o.abilityId === optionOrUid
    );
    const abilityId =
      target?.abilityId || (this.abilityRanks.has(optionOrUid) ? optionOrUid : null);
    if (!abilityId || this.banishedAbilities.has(abilityId)) return;

    let unbanishedEquipped = 0;
    let unlockedTotal = 0;
    for (const [id, r] of this.abilityRanks.entries()) {
      if (r <= 0) continue;
      unlockedTotal++;
      if (id !== abilityId && !this.banishedAbilities.has(id)) unbanishedEquipped++;
    }
    const hasRemainingUnowned =
      unlockedTotal < MAX_ABILITY_SLOTS &&
      BLESSINGS.some(
        (b) =>
          (this.abilityRanks.get(b.id) || 0) <= 0 &&
          b.id !== abilityId &&
          !this.banishedAbilities.has(b.id)
      );
    if (unbanishedEquipped <= 0 && !hasRemainingUnowned) return;

    this.banishesLeft--;
    this.audio.unlock();
    this.audio.playUIClick();
    this.banishedAbilities.add(abilityId);

    const prevUids = new Set(this.blessingOptions.map((o) => o.uid));
    const nextOpts = this._buildDraftOptions(this._activeDraftIsBonus, prevUids);
    if (nextOpts.length <= 0) {
      if (this._activeDraftIsBonus) {
        this.pendingBonusDrafts.shift();
        this._activeDraftIsBonus = false;
      } else if (this.pendingLevelUps > 0) {
        this.pendingLevelUps--;
      }
      this.blessingDraftOpen = false;
      this.blessingOptions = [];
      this.ui.hideBlessingDraft();
      return;
    }
    this.blessingOptions = nextOpts;
    this.blessingDraftLockTimer = 0.16;
    this._presentDraftUI();
  }

  _onEnemyHit(ex, ey) {
    this.particles.emitGrazeSparks(ex, ey, ex + randRange(-14, 14), ey + randRange(-14, 14));
  }

  _onPurgeEnemy(x, y, kind = 'stalker', isElite = false) {
    const eliteKill = Boolean(isElite || ENEMY_STATS[kind]?.isElite);
    this.purgedCount++;
    this.purgeChainCount = this.purgeChainTimer > 0 ? this.purgeChainCount + 1 : 1;
    this.purgeChainTimer = 0.8;
    const chain = this.purgeChainCount;
    this.peakChain = Math.max(this.peakChain, chain);

    const basePurgePts = eliteKill ? 650 : 110 + Math.min(4, chain - 1) * 35;
    this._addScore(basePurgePts);
    if (eliteKill || chain >= 3) {
      this._recordHighlight(x, y, true);
    }

    if (chain >= 2 && this.lastPurgePos) {
      this.particles.emitChainSlash(this.lastPurgePos.x, this.lastPurgePos.y, x, y);
    }
    this.lastPurgePos = { x, y };

    this.shakeTrauma = Math.min(1, this.shakeTrauma + (eliteKill ? 0.55 : 0.09));
    if (eliteKill) {
      this.elitesDefeated++;
      this._triggerMilestone('elite_1');
      this.player.addDashEnergy(1.5);
      this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.75);
      this.audio.playEclipseShatter();
      this.particles.emitEclipseCoreShatter(x, y);
      this._triggerShockwave(x, y, 0.92);
      this.enemies.applyRepulse(x, y, 360, 380);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2;
        this.collectibles.spawnMote(x + Math.cos(a) * 26, y + Math.sin(a) * 26, true);
      }
      const label = kind === 'behemoth' ? 'UMBRAL DREADNOUGHT' : 'ASTRAL HARBINGER';
      this.pendingBonusDrafts.push(`ELITE BOUNTY · ${label}`);
    } else {
      if (this.purgeSoundCooldown <= 0) {
        this.purgeSoundCooldown = 0.055;
        this.audio.playPurge();
      }
      this.particles.emitPurgeExplosion(x, y);
      this._triggerShockwave(x, y, 0.36);
    }

    const expVal = this._addExp(ENEMY_STATS[kind]?.exp || 10);
    if (!eliteKill && rand() < 0.32) {
      this.collectibles.spawnMote(x, y, rand() < 0.35);
    }

    if (eliteKill) {
      this._callout(x, y - 24, `ELITE PURGED! +CARD · +${expVal} XP`, '#ffe599', 1.28);
    }
  }

  _onCoreCrack(cx, cy, remaining) {
    this._addScore(220);
    this.hitStopTimer = 0.032;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.35);
    this.audio.playCoreCrack(remaining);
    this.particles.emitDashBurst(cx, cy, Math.random() * Math.PI * 2);
    this._triggerShockwave(cx, cy, 0.65);
    this._callout(cx, cy - 22, `SHIELD CRACK! (${remaining} LEFT)`, '#ffe599', 1.12);
  }

  _onCoreShatter(cx, cy) {
    this.purgedCount++;
    this.coresShattered++;
    this.purgeChainCount = this.purgeChainTimer > 0 ? this.purgeChainCount + 1 : 1;
    this.purgeChainTimer = 0.85;
    this.peakChain = Math.max(this.peakChain, this.purgeChainCount);

    this._addScore(900);
    this._recordHighlight(cx, cy, true);

    this.player.addDashEnergy(2.0);
    this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.85);
    this.hitStopTimer = 0.07;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.72);
    this.audio.playEclipseShatter();
    this.particles.emitEclipseCoreShatter(cx, cy);
    this._triggerShockwave(cx, cy, 1.0);
    this.enemies.applyRepulse(cx, cy, 460, 440);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.collectibles.spawnMote(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, true);
    }
    this.collectibles.spawnPrism(cx, cy);
    this.collectibles.spawnShard(cx - 24, cy + 16, 33);
    this.collectibles.spawnShard(cx + 24, cy - 16, 33);

    // Eclipse Core always grants massive EXP (enough to trigger at least 1 level-up draft)
    const expMul = this._getExpMultiplier();
    const minNeededRaw = Math.ceil(Math.max(0, this.expToNext - this.exp) / expMul);
    const coreExp = this._addExp(Math.max(ENEMY_STATS.core.exp, minNeededRaw));
    this._callout(cx, cy - 26, `ECLIPSE SHATTERED! +${coreExp} XP`, '#ffe599', 1.32);
  }

  chooseBlessing(optionOrUid) {
    if (!this.blessingDraftOpen) return;
    const option =
      this.blessingOptions.find(
        (o) =>
          o.uid === optionOrUid ||
          o.abilityId === optionOrUid ||
          o.id === optionOrUid
      ) || {
        uid: optionOrUid,
        id: optionOrUid,
        abilityId: optionOrUid,
        aspect: 'unlock',
        mode: 'unlock',
        val: 1,
        isNew: this._getCardRank(optionOrUid) === 0,
        title: optionOrUid,
      };

    const abilityId = option.abilityId || option.id;
    const blessing = BLESSINGS.find((b) => b.id === abilityId);
    const nextRank = applyUpgradeOption(option, this.abilityRanks, this.buildState);
    if (this._activeDraftIsBonus) {
      this.pendingBonusDrafts.shift();
      this._activeDraftIsBonus = false;
    } else if (this.pendingLevelUps > 0) {
      this.pendingLevelUps--;
    }

    this.blessingDraftOpen = false;
    this.blessingDraftLockTimer = 0;
    this.blessingOptions = [];
    this.ui.hideBlessingDraft();

    if (abilityId === 'aegis_bloom' && option.aspect === 'unlock') {
      if (this.player.health < this.player.maxHealth) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
      } else {
        this.bonusMaxHealth += 20;
        this._syncMaxHealth(true);
      }
      this.aegisWardReady = true;
      this.aegisWardCooldown = 0;
    }
    if (abilityId === 'astral_shield') {
      this._syncShieldState(true);
      if (option.aspect === 'unlock') {
        this.shieldRegenDelayTimer = 0;
      }
    }

    this._syncPlayerCardModifiers();
    this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.75);

    this.particles.calloutLayer.visible = true;
    this.particles.emitShockRing(
      this.player.x,
      this.player.y,
      0.25,
      2.6,
      COLORS.lumenGold,
      0.7,
      0.8
    );
    this._triggerShockwave(this.player.x, this.player.y, 0.7);
    if (blessing) {
      const evo = (nextRank === 5 || nextRank === 10) ? ABILITY_EVOLUTIONS[abilityId] : null;
      const badge = option.isNew ? 'NEW' : `LV ${nextRank} · ${option.title.toUpperCase()}`;
      this._callout(
        this.player.x,
        this.player.y - 34,
        `${blessing.name.toUpperCase()} · ${badge}`,
        '#ffe599',
        1.18
      );
      if (evo) {
        const tag = nextRank === 10 ? '✦ SUPERNOVA' : '★ ASCENDED';
        this._callout(this.player.x, this.player.y - 58, `${tag}: ${evo.name.toUpperCase()}!`, '#9efff5', 1.15);
      }
      if (nextRank >= 10) {
        this._triggerMilestone('supernova_first');
      }
    }
    this._refreshSynergies();

    if (this.pendingLevelUps > 0) {
      this._maybeOpenPendingLevelDraft();
    } else {
      this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.55);
      this.audio.setAmbientMood({
        intensity: this.currentPhaseIndex / (PHASES.length - 1),
        paused: false,
        active: true,
      });
    }
  }

  _onHitPlayer(ex, ey, damage = 22) {
    if (this.aegisWardReady) {
      const aegisSt = this.buildState.aegis_bloom;
      const aegisFx = this._getGroupTalent('aegis_bloom');
      const aegisRank = this._getCardRank('aegis_bloom');
      this.aegisWardReady = false;
      const rawCd = Math.max(1.8, 14 / ((aegisSt?.wardRateMul || 1) * (aegisFx?.wardRateMul || 1)));
      this.aegisWardCooldown = aegisRank >= 10 ? rawCd * 0.7 : aegisRank >= 5 ? rawCd * 0.8 : rawCd;
      if (aegisRank >= 5 && this.player.health < this.player.maxHealth) {
        const healAmt = aegisRank >= 10 ? 22 : 12;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmt);
      }
      this._syncPlayerCardModifiers();
      this.player.invulnTimer = 1.2 * (aegisFx?.graceMul || 1);
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.42);
      const repulseR = Math.min(480, 240 * (aegisSt?.repulseMul || 1));
      const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
      if (aegisFx?.novaDmg > 0) {
        this.enemies.damageRadius(
          this.player.x,
          this.player.y,
          repulseR,
          +(aegisFx.novaDmg * dmgBonus).toFixed(3),
          220,
          0.42,
          this._getCombatCallbacks('aegis_bloom')
        );
        if (aegisFx.novaSpeedBonus > 0) {
          this.aegisSpeedTimer = 1.6;
          this.aegisSpeedMul = 1 + aegisFx.novaSpeedBonus;
          this._syncPlayerCardModifiers();
        }
      } else {
        this.enemies.applyRepulse(this.player.x, this.player.y, repulseR, 360);
      }
      if (aegisFx?.phoenixDashRestore > 0) {
        this.player.addDashEnergy(aegisFx.phoenixDashRestore);
      }
      if (aegisFx?.phoenixDmgBonus > 0) {
        this.phoenixEmpowerTimer = 4.0;
        this.phoenixEmpowerMul = 1 + aegisFx.phoenixDmgBonus;
      }
      this.particles.emitShockRing(this.player.x, this.player.y, 0.2, 2.8, 0xb9fff8, 0.5, 0.78);
      this._triggerShockwave(this.player.x, this.player.y, 0.82);
      this.audio.playCoreCrack(2);
      this._callout(this.player.x, this.player.y - 26, 'AEGIS WARD!', '#b9fff8', 1.18);
      return;
    }
    this.damageFlash = 1.0;
    this.shakeTrauma = storage.zenMode ? 0.45 : 0.95;
    this._triggerShockwave(this.player.x, this.player.y, 0.95);
    this.particles.emitHitBurst((this.player.x + ex) * 0.5, (this.player.y + ey) * 0.5);

    const shieldRank = this._getCardRank('astral_shield');
    let shieldFx = null;
    if (shieldRank > 0 && this.player.maxShield > 0) {
      const shieldSt = this.buildState.astral_shield;
      shieldFx = this._getGroupTalent('astral_shield');
      const delayFactor = (shieldSt?.shieldDelayMul || 1) / Math.max(0.25, 1 - (shieldFx?.delayReducePct || 0));
      this.shieldRegenDelayTimer = Math.max(1.2, 4.4 / delayFactor);
    }

    if (storage.zenMode) {
      this.player.invulnTimer = 1.25;
      this.enemies.applyRepulse(this.player.x, this.player.y, 260, 320);
      this.audio.playHit();
      this._callout(this.player.x, this.player.y - 24, 'FLOW SHAKEN', '#b9fff8', 1.05);
      return;
    }

    const odDmgMul = WaveDirectorService.getOverdriveDamageMul(this.overdriveTier);
    let dmg = Math.max(1, Math.round(damage * odDmgMul));
    if (this.player.shield > 0) {
      const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
      const shieldRes = CombatService.resolveShieldAbsorption({
        incomingDamage: dmg,
        currentShield: this.player.shield,
        shieldRank,
        shieldFx,
        dmgBonus,
      });
      this.player.shield = shieldRes.nextShield;
      dmg = shieldRes.remainingDamage;

      if (shieldRes.reflectDmg > 0) {
        const shieldCb = this._getCombatCallbacks('astral_shield');
        const hits = this.enemies.damageRadius(
          this.player.x,
          this.player.y,
          135,
          shieldRes.reflectDmg,
          180,
          0.3,
          shieldCb
        );
        if (hits === 0) {
          const target =
            this.enemies.findNearestTarget(ex, ey, 360) ||
            this.enemies.findNearestTarget(this.player.x, this.player.y, 440);
          if (target?.enemy) {
            this.particles.emitChainLightning(this.player.x, this.player.y, target.enemy.x, target.enemy.y);
            this.enemies.damageEnemyByRef(target.enemy, shieldRes.reflectDmg, 0, 0, shieldCb);
          }
        }
        this.particles.emitShockRing(this.player.x, this.player.y, 0.16, 2.2, 0x7ec8ff, 0.35, 0.65);
      }

      if (shieldRes.triggerStaticPulse) {
        this._triggerShieldStaticPulse(shieldRank);
      }
      if (shieldRes.overloadDmg > 0) {
        this.enemies.damageRadius(
          this.player.x,
          this.player.y,
          220,
          shieldRes.overloadDmg,
          340,
          0.5,
          this._getCombatCallbacks('astral_shield')
        );
        this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.55);
        this.particles.emitShockRing(this.player.x, this.player.y, 0.2, 3.0, 0x99d6ff, 0.45, 0.78);
      }

      if (dmg <= 0) {
        this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.55);
        this.enemies.applyRepulse(this.player.x, this.player.y, 200, 260);
        this.particles.emitShockRing(this.player.x, this.player.y, 0.14, 1.8, 0x7ec8ff, 0.35, 0.6);
        this.audio.playCoreCrack(1);
        this._callout(
          this.player.x,
          this.player.y - 24,
          shieldRes.shieldBroken ? 'SHIELD SHATTERED!' : `-${Math.round(shieldRes.absorbed)} SHIELD`,
          '#7ec8ff',
          1.08
        );
        return;
      }
    }

    this.player.health = Math.max(0, this.player.health - dmg);

    if (this.player.health <= 0) {
      // Dramatic slow-motion ending sequence
      this.state = GAME_STATES.DYING;
      this.dyingTimer = 1.05;
      this.hitStopTimer = 0.085;
      this.player.root.visible = false;
      this.player.trailRope.visible = false;
      this.particles.emitDeathShatter(this.player.x, this.player.y);
      this.audio.setAmbientMood({
        intensity: this.currentPhaseIndex / (PHASES.length - 1),
        paused: false,
        active: true,
        dying: true,
      });
      this.audio.playGameOver();
      this.ui._syncHpBar?.(0, this.player.maxHealth, true);
      this.ui.setGameState(GAME_STATES.DYING);
    } else {
      this.hitStopTimer = 0.075;
      this.player.invulnTimer = PLAYER_CONFIG.invulnOnHit;
      this.enemies.applyRepulse(this.player.x, this.player.y, 280, 340);
      this.audio.playHit();
      this._callout(this.player.x, this.player.y - 24, `-${dmg} HP`, '#ff6d94', 1.1);
    }
  }

  _finishGameOver() {
    this.state = GAME_STATES.GAMEOVER;
    this.gameOverAge = 0;
    this.blessingDraftOpen = false;
    this.ui.hideBlessingDraft();
    this.particles.calloutLayer.visible = false;
    this.audio.setAmbientMood({ intensity: 0, paused: true, active: false, dying: false });

    const finalScore = Math.floor(this.score);
    this._checkMedalMilestones();
    const runStats = {
      level: this.level,
      motesCount: this.motesCount,
      peakChain: this.peakChain,
      purgedCount: this.purgedCount,
      constellationsCompleted: this.constellationsCompleted,
      coresShattered: this.coresShattered,
      elitesDefeated: this.elitesDefeated,
      survivalTime: this.survivalTime,
      score: finalScore,
    };

    const result = storage.recordRun({
      score: finalScore,
      time: this.survivalTime,
      runStats,
      mode: storage.gameMode,
      difficultyFx: this.activeDifficulty,
      bonusLuminance: this.shardLuminance,
      newlyMilestones: this.runMilestonesTriggered,
    });

    const phase = PHASES[this.currentPhaseIndex];
    this.ui.setGameState(GAME_STATES.GAMEOVER, {
      score: finalScore,
      highScore: storage.highScore,
      dailyHighScore: storage.dailyHighScore,
      prevHighScore: result.prevHighScore,
      prevDailyHighScore: result.prevDailyHighScore,
      peakChain: this.peakChain,
      survivalTime: this.survivalTime,
      purgedCount: this.purgedCount,
      elitesDefeated: this.elitesDefeated,
      phaseCode: phase.code,
      phaseName: phase.name,
      spiritName: this.activeSpirit.name,
      mode: storage.gameMode,
      difficulty: this.activeDifficulty,
      dailyTwist: result.dailyTwist || this.activeDailyTwist,
      isFirstDailyDouble: result.isFirstDailyDouble,
      firstDailyBonusLum: result.firstDailyBonusLum,
      awardedMilestones: result.awardedMilestones,
      milestoneBounties: result.milestoneBounties,
      bonusLuminance: result.bonusLuminance,
      level: this.level,
      abilityRanks: this.abilityRanks,
      talentRanks: storage.data.talentRanks,
      activeSynergies: this.activeSynergies,
      damageReport: this.abilities.getDamageReport(),
      medal: result.medal,
      dailyStreak: result.dailyStreak,
      isNewRecord: result.isNewRecord,
      isDailyRecord: result.isDailyRecord,
      completedQuests: result.completedQuests,
      luminanceEarned: result.luminanceEarned,
      totalLuminance: result.totalLuminance,
      newlyUnlockedSpirits: result.newlyUnlockedSpirits,
      activeQuests: storage.getActiveQuestObjects(),
      runMetrics: runStats,
      runHighlights: this.runHighlights,
    });
  }

  _checkPhaseEscalation() {
    const nextIdx = WaveDirectorService.findTargetPhaseIndex(
      this.currentPhaseIndex,
      this.survivalTime,
      this.score
    );
    if (nextIdx > this.currentPhaseIndex) {
      this.currentPhaseIndex = nextIdx;
      const phase = PHASES[nextIdx];
      if (phase.id >= 2 && phase.id <= 5) {
        this._triggerMilestone(`phase_${phase.id}`);
      }
      this.audio.playPhaseShift();
      this.audio.setAmbientMood({
        intensity: nextIdx / (PHASES.length - 1),
        paused: false,
        active: true,
        dying: false,
      });
      this.ui.showPhaseBanner(phase);
      this._triggerShockwave(this.player.x, this.player.y, 0.55);
      this.particles.emitShockRing(
        this.player.x,
        this.player.y,
        0.25,
        3.0,
        phase.accentHex,
        0.7,
        0.54
      );

      // Eclipse Core Boss & Surge milestone event at Phase 3 and Phase 5
      if (phase.id === 3 || phase.id === 5) {
        const extraShields = WaveDirectorService.getCoreExtraShieldsForPhase(
          phase.id,
          this.activeDifficulty?.id
        );
        const petalHp = WaveDirectorService.getCorePetalHp(
          phase.id,
          this.overdriveTier,
          this.activeDifficulty?.hpMul || 1
        );
        this.enemies.spawnEclipseCore(
          this.worldWidth,
          this.worldHeight,
          phase.speedScale,
          extraShields,
          this.player,
          this.width,
          this.height,
          petalHp
        );
        this.enemies.spawnEclipseVolley(
          this.worldWidth,
          this.worldHeight,
          this.player,
          phase.speedScale,
          phase.id === 5 ? 3 : 2,
          this.width,
          this.height
        );
        const prismPos = this.collectibles._pickSafeSpot(
          this.worldWidth,
          this.worldHeight,
          this.player.x,
          this.player.y,
          170,
          760
        );
        this.collectibles.spawnPrism(prismPos.x, prismPos.y);
      }
    }

    // Periodic targeted Lancer volleys from Phase 3 onward
    const curPhase = PHASES[this.currentPhaseIndex];
    if (curPhase.id >= 3 && this.survivalTime >= this.nextVolleyTime) {
      this.nextVolleyTime += WaveDirectorService.getNextVolleyInterval(
        curPhase.id,
        this.overdriveTier
      );
      const count = curPhase.id >= 5 ? 3 : 2;
      this.enemies.spawnEclipseVolley(
        this.worldWidth,
        this.worldHeight,
        this.player,
        Math.min(1.85, curPhase.speedScale + this.overdriveTier * 0.05),
        count,
        this.width,
        this.height
      );
    }

    // Periodic Interval Elite Bosses (Harbinger & Dreadnought) that drop a bonus Card Draft on kill
    if (this.survivalTime >= this.nextEliteTime) {
      const hasBoss = this.enemies.enemies.some((e) => e.isElite || e.kind === 'core');
      if (hasBoss) {
        this.nextEliteTime = this.survivalTime + 10;
      } else {
        this.nextEliteTime += WaveDirectorService.getNextEliteInterval(this.overdriveTier);
        const kind = this.eliteWaveCount % 2 === 0 ? 'harbinger' : 'behemoth';
        const eliteHpMul = (curPhase.hpMul || 1) * (1 + this.eliteWaveCount * 0.35);
        this.eliteWaveCount++;
        const elite = this.enemies.spawnElite(
          kind,
          this.worldWidth,
          this.worldHeight,
          Math.min(1.65, curPhase.speedScale + this.overdriveTier * 0.05),
          this.player,
          this.width,
          this.height,
          { hpBonus: curPhase.hpBonus || 0, hpMul: eliteHpMul }
        );
        if (elite) {
          this.audio.playPhaseShift();
          this.ui.showPhaseBanner({
            name: elite.label,
            subtitle: 'ELITE THREAT · DEFEAT FOR A BONUS CARD',
          });
        }
      }
    }

    // Endless Overdrive escalation beyond Phase 5 (time-gated so score spikes cannot jump tiers early)
    if (this.currentPhaseIndex === PHASES.length - 1 && this.survivalTime >= 100) {
      this.overdriveTier = WaveDirectorService.computeOverdriveTier(
        this.currentPhaseIndex,
        this.survivalTime,
        this.score
      );
      while (this.overdriveTier >= this.nextOverdriveWave) {
        const waveDef = OVERDRIVE_WAVES[(this.nextOverdriveWave - 1) % OVERDRIVE_WAVES.length];
        this.ui.showPhaseBanner({
          code: `WAVE ${this.nextOverdriveWave}`,
          name: waveDef.name,
          subtitle: `${waveDef.subtitle} · ESCALATION TIER +${this.overdriveTier}`,
        });
        const shardPos = this.collectibles._pickSafeSpot(
          this.worldWidth,
          this.worldHeight,
          this.player.x,
          this.player.y,
          140,
          720
        );
        this.collectibles.spawnShard(shardPos.x, shardPos.y, 30);
        this.nextOverdriveWave++;
      }
      if (this.survivalTime >= this.nextOverdriveCoreTime) {
        this.nextOverdriveCoreTime += 48;
        const p = PHASES[this.currentPhaseIndex];
        const petalHp = WaveDirectorService.getCorePetalHp(
          p.id,
          this.overdriveTier,
          this.activeDifficulty?.hpMul || 1
        );
        this.enemies.spawnEclipseCore(
          this.worldWidth,
          this.worldHeight,
          Math.min(1.75, p.speedScale + this.overdriveTier * 0.07),
          Math.min(5, 2 + this.overdriveTier),
          this.player,
          this.width,
          this.height,
          petalHp
        );
      }
    }
  }

  _updateTutorial(dt) {
    if (this.tutorialStep === 0) return;
    this.tutorialStepTimer += dt;

    if (this.tutorialStep === 1) {
      this.tutorialMoveAccum += Math.hypot(this.player.vx, this.player.vy) * dt;
      if (this.tutorialMoveAccum > 170 || this.tutorialStepTimer > 5.0) {
        this.tutorialStep = 2;
        this.tutorialStepTimer = 0;
        const dashHint = this.ui.isTouchMode
          ? 'Starlight fires automatically! Tap DASH to evade danger safely'
          : 'Starlight fires automatically! Press SPACE, SHIFT, or Right-Click to evade';
        this.ui.showTutorialStep(2, 3, dashHint);
      }
    } else if (this.tutorialStep === 2 && this.tutorialStepTimer > 7.0) {
      this.tutorialStep = 3;
      this.tutorialStepTimer = 0;
      this.ui.showTutorialStep(
        3,
        3,
        'Gather Light Motes & defeat shadows to level up and draft Ability Cards'
      );
    } else if (this.tutorialStep === 3 && this.tutorialStepTimer > 5.5) {
      this.tutorialStep = 0;
      this.ui.hideTutorial();
      storage.markTutorialCompleted();
    }
  }

  _update(rawDt) {
    this.globalTime += rawDt;

    if (this.blessingDraftLockTimer > 0) {
      this.blessingDraftLockTimer = Math.max(0, this.blessingDraftLockTimer - rawDt);
    }

    // Pause keeps canvas calmly breathing at subtle speed without progressing gameplay
    if (this.state === GAME_STATES.PAUSED || this.blessingDraftOpen) {
      this._syncShaders(rawDt * 0.25);
      return;
    }

    // Hit-stop freeze frames for crisp impact feel
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - rawDt);
      this._updateCameraShake(rawDt);
      this._syncShaders(rawDt);
      return;
    }

    const phase = PHASES[this.currentPhaseIndex];
    let simDt = rawDt;

    if (this.state === GAME_STATES.DYING) {
      simDt = rawDt * 0.16;
      this.dyingTimer -= rawDt;
      if (this.dyingTimer <= 0) {
        this._finishGameOver();
      }
    }

    if (this.state === GAME_STATES.GAMEOVER) {
      this.gameOverAge += rawDt;
    }

    if (this.titleCursorSparkTimer > 0) {
      this.titleCursorSparkTimer = Math.max(0, this.titleCursorSparkTimer - rawDt);
    }

    const audioPulse = Math.max(
      this.audio.getVisualPulse(rawDt),
      this.audio.unlocked && storage.ambientEnabled ? 0 : 0.14 + 0.1 * Math.sin(this.globalTime * 1.9)
    );

    if (this.state === GAME_STATES.TITLE) {
      this.cameraX = this.worldWidth * 0.5;
      this.cameraY = this.worldHeight * 0.5;
      this.worldContainer?.pivot.set(this.cameraX, this.cameraY);
      const upperCutoffY = this.cameraY - this.height * 0.22;
      // Gently weave between upper-sky attract positions & responsive motes
      const upperTarget =
        this.collectibles.items.find((it) => it.y < upperCutoffY) || null;
      const titleWp = this._screenToWorld(this.pointer.x, this.pointer.y);

      this.player.updateTitleIdle(
        rawDt,
        this.cameraX,
        this.cameraY,
        this.width,
        this.height,
        { ...this.pointer, x: titleWp.x, y: titleWp.y },
        upperTarget
      );
      if (Math.random() < rawDt * 7.5) {
        this.particles.emitTrailEmber(
          this.player.x,
          this.player.y,
          this.player.vx,
          this.player.vy,
          this.activeSpirit?.colorHex || COLORS.lumenCyan,
          this.activeSpirit?.trailId || 'mist',
          this.activeSpirit?.accentHex || COLORS.lumenGold
        );
      }
      // Gently animate decorative motes & trigger soft attract-mode pickup sparkles
      for (let idx = this.collectibles.items.length - 1; idx >= 0; idx--) {
        const item = this.collectibles.items[idx];
        item.age = 0.5;
        item.root.y = item.y + Math.sin(this.globalTime * 2.4 + item.phase) * 5;
        item.core.rotation = Math.sin(this.globalTime * 1.8 + item.phase) * 0.25;
        item.glint.rotation += rawDt * 1.2;

        if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 28) {
          this.particles.emitMotePickup(
            item.x,
            item.y,
            item.isGolden ? COLORS.moteGold : COLORS.moteCyan
          );
          const leftScreen = this.cameraX - this.width * 0.5;
          const topScreen = this.cameraY - this.height * 0.5;
          const nextX =
            Math.random() < 0.5
              ? leftScreen + randRange(70, this.width * 0.25)
              : leftScreen + randRange(this.width * 0.75, this.width - 70);
          const nextY = topScreen + randRange(56, Math.max(85, this.height * 0.24));
          item.x = nextX;
          item.y = nextY;
          item.root.x = nextX;
          item.root.y = nextY;
        }
      }
      this.environment.update(
        rawDt,
        this.player.x,
        this.player.y,
        Math.hypot(this.player.vx, this.player.vy),
        0,
        phase.accentHex,
        audioPulse,
        this.shockWaves
      );
      this.particles.update(rawDt);
    } else if (this.state === GAME_STATES.PLAYING) {
      this.survivalTime += simDt;

      // Gentle ambient survival score trickle
      this.score +=
        simDt *
        18 *
        SCORE_GAIN_SCALE *
        (this.activeDifficulty?.scoreMul || 1);

      if (!this.player.isDashing) {
        this.lastPurgePos = null;
      }

      if (!storage.zenMode && this.player.health > 0 && this.player.health <= this.player.maxHealth * 0.3) {
        this.lowHealthPulseTimer -= rawDt;
        if (this.lowHealthPulseTimer <= 0) {
          this.lowHealthPulseTimer = 1.15;
          this.audio.playLowRadiancePulse();
        }
      }

      const input = this._readMoveInput();

      const gravitySources = this.enemies.getGravitySources();
      const currentForce = this.environment.sampleCurrent(this.player.x, this.player.y);
      let pullVx = currentForce.vx * 0.95;
      let pullVy = currentForce.vy * 0.95;
      for (const src of gravitySources) {
        const gdx = src.x - this.player.x;
        const gdy = src.y - this.player.y;
        const gdSq = gdx * gdx + gdy * gdy;
        if (gdSq < src.radius * src.radius && gdSq > 144) {
          const gd = Math.sqrt(gdSq);
          const pull = (1 - gd / src.radius) * src.strength * 1.15;
          pullVx += (gdx / gd) * pull;
          pullVy += (gdy / gd) * pull;
        }
      }

      if (this.purgeSoundCooldown > 0) {
        this.purgeSoundCooldown = Math.max(0, this.purgeSoundCooldown - rawDt);
      }
      if (this.purgeChainTimer > 0) {
        this.purgeChainTimer = Math.max(0, this.purgeChainTimer - simDt);
        if (this.purgeChainTimer <= 0) this.purgeChainCount = 0;
      }
      if (this.aegisSpeedTimer > 0) {
        this.aegisSpeedTimer = Math.max(0, this.aegisSpeedTimer - simDt);
        if (this.aegisSpeedTimer <= 0) {
          this.aegisSpeedMul = 1;
          this._syncPlayerCardModifiers();
        }
      }
      if (this.phoenixEmpowerTimer > 0) {
        this.phoenixEmpowerTimer = Math.max(0, this.phoenixEmpowerTimer - simDt);
        if (this.phoenixEmpowerTimer <= 0) this.phoenixEmpowerMul = 1;
      }

      const shieldRank = this._getCardRank('astral_shield');
      let shieldDmgBonus = 1;
      if (shieldRank > 0 && this.player.maxShield > 0) {
        const shieldSt = this.buildState.astral_shield;
        const shieldFx = this._getGroupTalent('astral_shield');
        if (this.shieldRegenDelayTimer > 0) {
          this.shieldWasDelaying = true;
          this.shieldRegenDelayTimer = Math.max(0, this.shieldRegenDelayTimer - simDt);
        } else {
          if (this.shieldWasDelaying && this.player.shield < this.player.maxShield) {
            this.shieldWasDelaying = false;
            this.particles.emitShockRing(this.player.x, this.player.y, 0.12, 1.35, 0x7ec8ff, 0.26, 0.45);
          }
          if (this.player.shield < this.player.maxShield) {
            const regenRate = 3.5 * (shieldSt?.shieldRegenMul || 1) * (shieldFx?.regenMul || 1);
            const prevShield = this.player.shield;
            this.player.shield = Math.min(this.player.maxShield, this.player.shield + regenRate * simDt);
            if (prevShield < this.player.maxShield && this.player.shield >= this.player.maxShield && shieldRank >= 5) {
              this._triggerShieldStaticPulse(shieldRank);
            }
          }
        }
        if (this.player.shield > 0 && (shieldFx?.mendHpPerSec || 0) > 0 && this.player.health < this.player.maxHealth) {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + shieldFx.mendHpPerSec * simDt);
        }
        if ((shieldFx?.shieldedDmgBonus || 0) > 0 && this.player.shield >= this.player.maxShield * 0.5) {
          shieldDmgBonus = 1 + shieldFx.shieldedDmgBonus;
        }
      }
      const aegisRank = this._getCardRank('aegis_bloom');
      if (aegisRank > 0 && !this.aegisWardReady) {
        this.aegisWardCooldown = Math.max(0, this.aegisWardCooldown - simDt);
        if (this.aegisWardCooldown <= 0) {
          this.aegisWardReady = true;
          this._syncPlayerCardModifiers();
          this.particles.emitShockRing(this.player.x, this.player.y, 0.2, 1.5, 0xb9fff8, 0.35, 0.45);
        }
      } else if (aegisRank > 0 && this.aegisWardReady) {
        const aegisFx = this._getGroupTalent('aegis_bloom');
        if (aegisFx?.bulwarkPulseDmg > 0) {
          this.bulwarkAuraTimer -= simDt;
          if (this.bulwarkAuraTimer <= 0) {
            this.bulwarkAuraTimer = 1.6;
            const dmgBonus = (this.upgradeFx?.globalDmgMul || 1) * (this.activeDailyTwist?.dmgMul || 1);
            const hits = this.enemies.damageRadius(
              this.player.x,
              this.player.y,
              96,
              +(aegisFx.bulwarkPulseDmg * dmgBonus).toFixed(3),
              140,
              0.3,
              this._getCombatCallbacks('aegis_bloom')
            );
            if (hits > 0) {
              this.particles.emitShockRing(this.player.x, this.player.y, 0.14, 1.65, 0xb9fff8, 0.32, 0.5);
            }
          }
        }
      }

      if (this.dashBufferTimer > 0) {
        this.dashBufferTimer = Math.max(0, this.dashBufferTimer - simDt);
        this.triggerDash(this.dashBufferDirX, this.dashBufferDirY, true);
      }

      this.player.update(
        simDt,
        input,
        this.worldWidth,
        this.worldHeight,
        this.particles,
        {
          vx: pullVx,
          vy: pullVy,
        }
      );

      // Lock camera on the Spirit so Lumen stays dead-center on screen across the larger map
      this.cameraX = this.player.x;
      this.cameraY = this.player.y;
      this.worldContainer.pivot.set(this.cameraX, this.cameraY);
      if (this.player.pointerTargetGlow?.visible) {
        const ptrWorld = this._screenToWorld(this.pointer.x, this.pointer.y);
        this.player.pointerTargetGlow.x = ptrWorld.x;
        this.player.pointerTargetGlow.y = ptrWorld.y;
      }

      const gravSt = this.buildState.gravity_harvest;
      const gravFx = this._getGroupTalent('gravity_harvest');
      const magnetMul =
        (this.activeSpirit.magnetMul || 1) *
        (gravSt?.magnetMul || 1) *
        (gravFx?.magnetMul || 1) *
        (this.upgradeFx?.magnetMul || 1) *
        (this.activeDailyTwist?.magnetMul || 1);
      const starPull = Boolean(gravSt?.starPull);

      this.collectibles.update(
        simDt,
        this.player,
        this.worldWidth,
        this.worldHeight,
        (item) => this._onCollectItem(item),
        gravitySources,
        magnetMul,
        starPull
      );

      const twist = this.activeDailyTwist;
      const effectivePhase = WaveDirectorService.buildEffectivePhase(
        phase,
        this.overdriveTier,
        this.activeDifficulty,
        twist
      );

      const combatCallbacks = this._getCombatCallbacks();

      this.abilities.update(
        simDt,
        this.player,
        this.enemies,
        this.particles,
        this.audio,
        combatCallbacks,
        {
          ranks: this.abilityRanks,
          build: this.buildState,
          talentRanks: storage.data.talentRanks,
          synergies: this.activeSynergySet,
          upgradeDmgMul:
            (this.upgradeFx?.globalDmgMul || 1) *
            (twist?.dmgMul || 1) *
            (this.phoenixEmpowerTimer > 0 ? this.phoenixEmpowerMul : 1) *
            shieldDmgBonus,
          upgradeHasteMul: (this.upgradeFx?.hasteMul || 1) * (twist?.hasteMul || 1),
          arcReachMul: this.activeSpirit.arcReachMul || 1,
          spiritColorHex: this.activeSpirit.colorHex,
          spiritAccentHex: this.activeSpirit.accentHex,
          boundsW: this.worldWidth,
          boundsH: this.worldHeight,
        }
      );

      this.enemies.update(
        simDt,
        this.player,
        effectivePhase,
        this.worldWidth,
        this.worldHeight,
        combatCallbacks,
        this.width,
        this.height
      );

      this.environment.update(
        simDt,
        this.player.x,
        this.player.y,
        Math.hypot(this.player.vx, this.player.vy),
        this.player.dashTimer,
        phase.accentHex,
        audioPulse,
        this.shockWaves
      );
      this.particles.update(simDt);

      // Celebrate breaking Sanctuary / Daily Record live mid-run!
      if (
        !this.recordBrokenThisRun &&
        storage.gameMode !== GAME_MODES.ZEN &&
        this.runStartBest > 0 &&
        Math.floor(this.score) > this.runStartBest
      ) {
        this.recordBrokenThisRun = true;
        this.audio.playRecordChime();
        this._triggerShockwave(this.player.x, this.player.y, 0.9);
        this.particles.emitPrismBurst(this.player.x, this.player.y);
        this._callout(
          this.player.x,
          this.player.y - 38,
          storage.isDailyMode ? '★ NEW DAILY RECORD!' : '★ NEW SANCTUARY RECORD!',
          '#ffe699',
          1.34
        );
      }

      this._checkPhaseEscalation();
      this._checkMedalMilestones();
      this._updateTutorial(simDt);
      this._maybeOpenPendingLevelDraft();

      const diffTag =
        this.activeDifficulty?.id !== 'normal' ? ` · ${this.activeDifficulty.label}` : '';
      const phaseLabel =
        this.overdriveTier > 0
          ? `${phase.code} · +${this.overdriveTier}${diffTag}`
          : storage.zenMode
            ? `${phase.code} · ZEN`
            : `${phase.code}${diffTag}`;

      this.ui.updateHUD(rawDt, {
        score: this.score,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        shield: this.player.shield,
        maxShield: this.player.maxShield,
        maxDashes: this.player.maxDashCharges,
        dashCharges: this.player.dashCharges,
        dashRechargeProgress: this.player.dashRechargeProgress,
        phaseCode: phaseLabel,
        targetBest: this.runStartBest,
        mode: storage.gameMode,
        level: this.level,
        exp: this.exp,
        expToNext: this.expToNext,
        abilityRanks: this.abilityRanks,
        talentRanks: storage.data.talentRanks,
        activeSynergies: this.activeSynergies,
        minimap: {
          worldW: this.worldWidth,
          worldH: this.worldHeight,
          viewW: this.width,
          viewH: this.height,
          camX: this.cameraX,
          camY: this.cameraY,
          playerX: this.player.x,
          playerY: this.player.y,
          spiritHex: this.activeSpirit?.colorHex || COLORS.lumenCyan,
          items: this.collectibles.items,
          enemies: this.enemies.enemies,
        },
      });
    } else if (this.state === GAME_STATES.DYING || this.state === GAME_STATES.GAMEOVER) {
      this.cameraX = this.player.x;
      this.cameraY = this.player.y;
      this.worldContainer?.pivot.set(this.cameraX, this.cameraY);
      this.environment.update(
        rawDt,
        this.player.x,
        this.player.y,
        0,
        0,
        phase.accentHex,
        audioPulse,
        this.shockWaves
      );
      this.particles.update(this.state === GAME_STATES.DYING ? simDt * 2.2 : rawDt * 0.75);
      this.enemies.update(
        simDt * 0.7,
        this.player,
        phase,
        this.worldWidth,
        this.worldHeight,
        {
          onPurge: () => {},
          onHit: () => {},
        },
        this.width,
        this.height
      );
    }

    this._updateCameraShake(rawDt);
    this._syncShaders(rawDt);
  }

  _updateCameraShake(dt) {
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);
    const shakeScale = storage.screenShake ? 1 : 0;
    const shakeAmt = this.shakeTrauma * this.shakeTrauma * 14 * shakeScale;
    if (shakeAmt > 0.05) {
      const sx = (Math.random() - 0.5) * 2 * shakeAmt;
      const sy = (Math.random() - 0.5) * 2 * shakeAmt;
      this.worldContainer.position.set(this.width * 0.5 + sx, this.height * 0.5 + sy);
      this.worldContainer.rotation = (Math.random() - 0.5) * 0.008 * this.shakeTrauma;
      if (this.particles?.calloutLayer) {
        this.particles.calloutLayer.position.set(sx * 0.5, sy * 0.5);
      }
    } else {
      this.worldContainer.position.set(this.width * 0.5, this.height * 0.5);
      this.worldContainer.rotation = 0;
      if (this.particles?.calloutLayer) {
        this.particles.calloutLayer.position.set(0, 0);
      }
    }
  }

  _syncShaders(dt) {
    const phase = PHASES[this.currentPhaseIndex];
    const colorBlend = 1 - Math.exp(-1.2 * dt);
    lerpVec3(this.currentDeep, this.currentDeep, phase.deepColor, colorBlend);
    lerpVec3(this.currentMid, this.currentMid, phase.midColor, colorBlend);
    lerpVec3(this.currentGlow, this.currentGlow, phase.glowColor, colorBlend);

    this.damageFlash = damp(this.damageFlash, 0, 5.5, dt);

    for (const sw of this.shockWaves) {
      if (sw.progress < 1.0) {
        sw.progress = Math.min(1.0, sw.progress + dt * 2.1);
        if (sw.progress >= 1.0) sw.strength = 0;
      }
      if (sw.age < 1.5) {
        sw.age += dt;
      }
    }

    const pScr = this._worldToScreen(this.player.x, this.player.y);
    const bu = this.backdropFilter.uniforms;
    bu.uTime = this.globalTime;
    bu.uResolution[0] = this.width;
    bu.uResolution[1] = this.height;
    bu.uCameraOffset[0] = this.cameraX - this.worldWidth * 0.5;
    bu.uCameraOffset[1] = this.cameraY - this.worldHeight * 0.5;
    bu.uPlayerPos[0] = pScr.x;
    bu.uPlayerPos[1] = pScr.y;
    const glowFactor = 0.4 + 0.6 * (storage.bloomLevel / 0.65);
    bu.uPlayerGlow = clamp(
      (0.36 + (this.player.isDashing ? 0.55 : 0)) * glowFactor,
      0.12,
      1.0
    );
    const bWaves = [bu.uWave0, bu.uWave1, bu.uWave2, bu.uWave3];
    for (let i = 0; i < 4; i++) {
      const sw = this.shockWaves[i];
      const swScr = this._worldToScreen(sw.x, sw.y);
      bWaves[i][0] = swScr.x;
      bWaves[i][1] = swScr.y;
      bWaves[i][2] = sw.age;
      bWaves[i][3] = sw.strength;
    }
    bu.uColorDeep[0] = this.currentDeep[0];
    bu.uColorDeep[1] = this.currentDeep[1];
    bu.uColorDeep[2] = this.currentDeep[2];
    bu.uColorMid[0] = this.currentMid[0];
    bu.uColorMid[1] = this.currentMid[1];
    bu.uColorMid[2] = this.currentMid[2];
    bu.uColorGlow[0] = this.currentGlow[0];
    bu.uColorGlow[1] = this.currentGlow[1];
    bu.uColorGlow[2] = this.currentGlow[2];
    this.backdropFilter.sync();

    const au = this.atmosphereFilter.uniforms;
    au.uResolution[0] = this.width;
    au.uResolution[1] = this.height;
    const aWaves = [au.uWave0, au.uWave1, au.uWave2, au.uWave3];
    for (let i = 0; i < 4; i++) {
      const sw = this.shockWaves[i];
      const swScr = this._worldToScreen(sw.x, sw.y);
      aWaves[i][0] = swScr.x;
      aWaves[i][1] = swScr.y;
      aWaves[i][2] = sw.progress;
      aWaves[i][3] = sw.strength;
    }
    au.uDamageFlash = this.damageFlash;
    const lowHealth =
      !storage.zenMode &&
      this.state === GAME_STATES.PLAYING &&
      this.player.health > 0 &&
      this.player.health <= this.player.maxHealth * 0.3
        ? 0.55 + 0.45 * Math.sin(this.globalTime * 4.5)
        : 0;
    au.uDangerVignette = lowHealth;
    au.uEdgeGlow[0] = this.player.edgeContact[0];
    au.uEdgeGlow[1] = this.player.edgeContact[1];
    au.uEdgeGlow[2] = this.player.edgeContact[2];
    au.uEdgeGlow[3] = this.player.edgeContact[3];
    au.uBloomScale = storage.bloomLevel;
    this.atmosphereFilter.sync();
  }
}

export { LumenGame as Game, LumenGame as GameCoordinator };
