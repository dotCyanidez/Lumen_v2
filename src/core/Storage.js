import {
  ABILITY_TALENTS,
  ABILITY_TALENTS_BY_ID,
  ABILITY_TALENT_GROUPS,
  BLESSINGS,
  DIFFICULTIES_BY_ID,
  GAME_MODES,
  MILESTONES_BY_ID,
  QUEST_POOL,
  RANK_MEDALS,
  SANCTUARY_UPGRADES,
  SPIRIT_ASPECTS,
  SPIRIT_PALETTES,
  SPIRIT_TRAILS,
  getDailyTwist,
  getMedalForScore,
  getScaledQuest,
  getUpgradeEffects,
  isStartAbilityUnlocked,
} from './Constants.js';
import { clamp, getTodayDateKey } from './MathUtils.js';

const STORAGE_KEY = 'lumen_sanctuary_v1';
const VALID_MODES = new Set(Object.values(GAME_MODES));

const DEFAULT_DATA = {
  highScore: 0,
  bestTime: 0,
  bestElites: 0,
  totalElitesDefeated: 0,
  sfxVolume: 0.85,
  ambientVolume: 0.75,
  cursorGlide: false,
  bloomLevel: 0.65,
  screenShake: true,
  gameMode: GAME_MODES.ARCADE,
  selectedDifficulty: 'normal',
  tutorialCompleted: false,
  selectedSpirit: 'wisp',
  selectedStartAbility: 'resonant_volley',
  luminance: 0,
  lifetimeLuminance: 0,
  upgrades: {},
  talentRanks: {},
  unlockedTrails: ['mist'],
  selectedTrail: 'mist',
  unlockedPalettes: ['default'],
  selectedPalette: 'default',
  dailyDate: '',
  dailyHighScore: 0,
  dailyStreak: 0,
  lastDailyPlayedDate: '',
  firstDailyBonusClaimedDate: '',
  bestMedals: { arcade: '', daily: '' },
  activeQuests: ['purge_12', 'stars_2', 'survive_60'],
  questCursor: 3,
  questTiers: {},
  claimedMilestones: [],
  runHistory: [],
};

function getYesterdayDateKey() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createFreshSaveData() {
  return {
    ...DEFAULT_DATA,
    upgrades: {},
    talentRanks: {},
    unlockedTrails: ['mist'],
    unlockedPalettes: ['default'],
    bestMedals: { arcade: '', daily: '' },
    activeQuests: [...DEFAULT_DATA.activeQuests],
    questTiers: {},
    claimedMilestones: [],
    runHistory: [],
  };
}

class StorageService {
  constructor() {
    this.data = this._load();
    this._ensureDailyDate();
    this._ensureValidQuests();
    this._ensureValidSpirit();
  }

  _load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createFreshSaveData();
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_DATA, ...parsed };

      if (parsed.sfxVolume === undefined && typeof parsed.sfxEnabled === 'boolean') {
        merged.sfxVolume = parsed.sfxEnabled ? 0.85 : 0;
      }
      if (parsed.ambientVolume === undefined && typeof parsed.ambientEnabled === 'boolean') {
        merged.ambientVolume = parsed.ambientEnabled ? 0.75 : 0;
      }
      if (!parsed.gameMode && typeof parsed.zenMode === 'boolean') {
        merged.gameMode = parsed.zenMode ? GAME_MODES.ZEN : GAME_MODES.ARCADE;
      }

      merged.sfxVolume = clamp(Number(merged.sfxVolume) || 0, 0, 1);
      merged.ambientVolume = clamp(Number(merged.ambientVolume) || 0, 0, 1);
      const rawBloom =
        parsed.bloomLevel === undefined ? DEFAULT_DATA.bloomLevel : Number(merged.bloomLevel);
      merged.bloomLevel = Number.isFinite(rawBloom) ? clamp(rawBloom, 0, 1) : DEFAULT_DATA.bloomLevel;
      merged.screenShake =
        typeof parsed.screenShake === 'boolean' ? parsed.screenShake : DEFAULT_DATA.screenShake;
      if (!VALID_MODES.has(merged.gameMode)) {
        merged.gameMode = GAME_MODES.ARCADE;
      }
      if (!DIFFICULTIES_BY_ID[merged.selectedDifficulty]) {
        merged.selectedDifficulty = 'normal';
      }
      merged.firstDailyBonusClaimedDate =
        typeof merged.firstDailyBonusClaimedDate === 'string'
          ? merged.firstDailyBonusClaimedDate
          : '';
      merged.luminance = Math.max(0, Math.floor(Number(merged.luminance) || 0));
      merged.lifetimeLuminance = Math.max(
        merged.luminance,
        Math.floor(Number(merged.lifetimeLuminance) || 0)
      );
      merged.highScore = Math.max(0, Math.floor(Number(merged.highScore) || 0));
      delete merged.bestCombo;
      merged.bestTime = Math.max(0, Number(merged.bestTime) || 0);
      merged.dailyHighScore = Math.max(0, Math.floor(Number(merged.dailyHighScore) || 0));
      merged.dailyStreak = Math.max(0, Math.floor(Number(merged.dailyStreak) || 0));
      const rawUpgrades =
        parsed.upgrades && typeof parsed.upgrades === 'object'
          ? parsed.upgrades
          : parsed.talents && typeof parsed.talents === 'object'
            ? parsed.talents
            : {};
      const cleanUpgrades = {};
      for (const def of SANCTUARY_UPGRADES) {
        const r = Math.max(0, Math.min(def.costs.length, Math.floor(Number(rawUpgrades[def.id]) || 0)));
        if (r > 0) cleanUpgrades[def.id] = r;
      }
      merged.upgrades = cleanUpgrades;
      delete merged.talents;
      merged.questTiers =
        merged.questTiers && typeof merged.questTiers === 'object' ? { ...merged.questTiers } : {};
      merged.bestMedals =
        merged.bestMedals && typeof merged.bestMedals === 'object'
          ? { arcade: merged.bestMedals.arcade || '', daily: merged.bestMedals.daily || '' }
          : { arcade: '', daily: '' };

      const trails = Array.isArray(merged.unlockedTrails) ? merged.unlockedTrails : ['mist'];
      if (!trails.includes('mist')) trails.unshift('mist');
      merged.unlockedTrails = [...new Set(trails)];
      if (!merged.unlockedTrails.includes(merged.selectedTrail)) merged.selectedTrail = 'mist';

      const palettes = Array.isArray(merged.unlockedPalettes) ? merged.unlockedPalettes : ['default'];
      if (!palettes.includes('default')) palettes.unshift('default');
      merged.unlockedPalettes = [...new Set(palettes)];
      if (!merged.unlockedPalettes.includes(merged.selectedPalette)) merged.selectedPalette = 'default';

      const rawTalentRanks =
        parsed.talentRanks && typeof parsed.talentRanks === 'object' ? parsed.talentRanks : {};
      const cleanTalentRanks = {};
      for (const [id, r] of Object.entries(rawTalentRanks)) {
        const def = ABILITY_TALENTS_BY_ID[id];
        if (!def) continue;
        const clamped = Math.max(0, Math.min(def.maxLevel, Math.floor(Number(r) || 0)));
        if (clamped > 0) cleanTalentRanks[id] = clamped;
      }
      merged.talentRanks = cleanTalentRanks;
      delete merged.unlockedForks;
      delete merged.selectedForks;

      merged.claimedMilestones = Array.isArray(merged.claimedMilestones)
        ? [...new Set(merged.claimedMilestones.filter((id) => Boolean(MILESTONES_BY_ID[id])))]
        : [];
      merged.runHistory = Array.isArray(parsed.runHistory)
        ? parsed.runHistory.filter((r) => r && typeof r === 'object').slice(0, 12)
        : [];
      if (!isStartAbilityUnlocked(merged.selectedStartAbility, merged.talentRanks)) {
        merged.selectedStartAbility = 'resonant_volley';
      }

      return merged;
    } catch {
      return createFreshSaveData();
    }
  }

  _save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore quota / privacy storage blocks gracefully
    }
  }

  _ensureDailyDate() {
    const today = getTodayDateKey();
    if (this.data.dailyDate !== today) {
      this.data.dailyDate = today;
      this.data.dailyHighScore = 0;
      this._save();
    }
  }

  _ensureValidQuests() {
    const validMap = new Map(QUEST_POOL.map((q) => [q.id, q]));
    const filtered = Array.isArray(this.data.activeQuests)
      ? this.data.activeQuests.filter((id) => validMap.has(id))
      : [];
    const seen = new Set(filtered);
    let cursor = Math.max(0, Number(this.data.questCursor) || 0);
    while (filtered.length < 3 && seen.size < QUEST_POOL.length) {
      const candidate = QUEST_POOL[cursor % QUEST_POOL.length];
      cursor += 1;
      if (!seen.has(candidate.id)) {
        filtered.push(candidate.id);
        seen.add(candidate.id);
      }
    }
    this.data.activeQuests = filtered.slice(0, 3);
    this.data.questCursor = cursor % QUEST_POOL.length;
  }

  _ensureValidSpirit() {
    if (!this.isSpiritUnlocked(this.data.selectedSpirit)) {
      this.data.selectedSpirit = 'wisp';
    }
  }

  get highScore() {
    return this.data.highScore;
  }

  get bestTime() {
    return this.data.bestTime;
  }

  get runHistory() {
    return Array.isArray(this.data.runHistory) ? this.data.runHistory : [];
  }

  get dailyDate() {
    this._ensureDailyDate();
    return this.data.dailyDate;
  }

  get dailyHighScore() {
    this._ensureDailyDate();
    return this.data.dailyHighScore;
  }

  get sfxVolume() {
    return this.data.sfxVolume;
  }

  set sfxVolume(val) {
    this.data.sfxVolume = clamp(Number(val) || 0, 0, 1);
    this._save();
  }

  get ambientVolume() {
    return this.data.ambientVolume;
  }

  set ambientVolume(val) {
    this.data.ambientVolume = clamp(Number(val) || 0, 0, 1);
    this._save();
  }

  get sfxEnabled() {
    return this.data.sfxVolume > 0.005;
  }

  get ambientEnabled() {
    return this.data.ambientVolume > 0.005;
  }

  get cursorGlide() {
    return this.data.cursorGlide;
  }

  set cursorGlide(val) {
    this.data.cursorGlide = Boolean(val);
    this._save();
  }

  get bloomLevel() {
    return this.data.bloomLevel;
  }

  set bloomLevel(val) {
    this.data.bloomLevel = clamp(Number(val) || 0, 0, 1);
    this._save();
  }

  get screenShake() {
    return this.data.screenShake;
  }

  set screenShake(val) {
    this.data.screenShake = Boolean(val);
    this._save();
  }

  get gameMode() {
    return this.data.gameMode;
  }

  set gameMode(val) {
    if (VALID_MODES.has(val)) {
      this.data.gameMode = val;
      this._save();
    }
  }

  get zenMode() {
    return this.data.gameMode === GAME_MODES.ZEN;
  }

  get isDailyMode() {
    return this.data.gameMode === GAME_MODES.DAILY;
  }

  get difficulty() {
    return this.data.selectedDifficulty || 'normal';
  }

  set difficulty(id) {
    if (DIFFICULTIES_BY_ID[id]) {
      this.data.selectedDifficulty = id;
      this._save();
    }
  }

  getDifficultyObj() {
    return DIFFICULTIES_BY_ID[this.difficulty] || DIFFICULTIES_BY_ID.normal;
  }

  isFirstDailyAvailable() {
    return this.data.firstDailyBonusClaimedDate !== getTodayDateKey();
  }

  get claimedMilestones() {
    return this.data.claimedMilestones || [];
  }

  get luminance() {
    return this.data.luminance;
  }

  get lifetimeLuminance() {
    return Math.max(this.data.luminance, this.data.lifetimeLuminance || 0);
  }

  get dailyStreak() {
    const today = getTodayDateKey();
    const last = this.data.lastDailyPlayedDate;
    if (last === today || last === getYesterdayDateKey()) {
      return this.data.dailyStreak || 0;
    }
    return 0;
  }

  get bestMedals() {
    return this.data.bestMedals || { arcade: '', daily: '' };
  }

  get selectedSpirit() {
    return this.data.selectedSpirit;
  }

  set selectedSpirit(id) {
    if (this.isSpiritUnlocked(id)) {
      this.data.selectedSpirit = id;
      this._save();
    }
  }

  getUpgradeRank(id) {
    return Math.max(0, Number(this.data.upgrades?.[id]) || 0);
  }

  getUpgradeEffects() {
    return getUpgradeEffects(this.data.upgrades);
  }

  buySanctuaryUpgrade(id) {
    const def = SANCTUARY_UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const rank = this.getUpgradeRank(id);
    if (rank >= def.costs.length) return false;
    const cost = def.costs[rank];
    if (this.data.luminance < cost) return false;
    this.data.luminance -= cost;
    this.data.upgrades[id] = rank + 1;
    this._save();
    return true;
  }

  isTrailUnlocked(id) {
    return this.data.unlockedTrails.includes(id);
  }

  get selectedTrail() {
    return this.data.selectedTrail || 'mist';
  }

  buyOrSelectTrail(id) {
    const def = SPIRIT_TRAILS.find((t) => t.id === id);
    if (!def) return false;
    if (!this.isTrailUnlocked(id)) {
      if (this.data.luminance < def.cost) return false;
      this.data.luminance -= def.cost;
      this.data.unlockedTrails.push(id);
    }
    this.data.selectedTrail = id;
    this._save();
    return true;
  }

  isPaletteUnlocked(id) {
    return this.data.unlockedPalettes.includes(id);
  }

  get selectedPalette() {
    return this.data.selectedPalette || 'default';
  }

  buyOrSelectPalette(id) {
    const def = SPIRIT_PALETTES.find((p) => p.id === id);
    if (!def) return false;
    if (!this.isPaletteUnlocked(id)) {
      if (this.data.luminance < def.cost) return false;
      this.data.luminance -= def.cost;
      this.data.unlockedPalettes.push(id);
    }
    this.data.selectedPalette = id;
    this._save();
    return true;
  }

  getSelectedAppearance() {
    const spirit = this.getSelectedSpiritObj();
    const pal = SPIRIT_PALETTES.find((p) => p.id === this.selectedPalette);
    return {
      ...spirit,
      colorHex: pal?.colorHex ?? spirit.colorHex,
      accentHex: pal?.accentHex ?? spirit.accentHex,
      trailId: this.selectedTrail,
      paletteId: this.selectedPalette,
    };
  }

  getAbilityTalentRank(nodeId) {
    return Math.max(0, Number(this.data.talentRanks?.[nodeId]) || 0);
  }

  canUpgradeAbilityTalent(nodeId) {
    const def = ABILITY_TALENTS_BY_ID[nodeId];
    if (!def) return { ok: false, reason: 'missing', maxLevel: 0, rank: 0 };
    const rank = this.getAbilityTalentRank(nodeId);
    const maxLevel = def.maxLevel;
    if (rank >= maxLevel) {
      return { ok: false, reason: 'maxed', rank, maxLevel, maxed: true };
    }
    const cost = def.costs[rank];
    if (def.requires) {
      const reqNode = ABILITY_TALENTS_BY_ID[def.requires] || null;
      const reqRank = this.getAbilityTalentRank(def.requires);
      const needed = reqNode ? reqNode.maxLevel : 1;
      if (reqRank < needed) {
        return {
          ok: false,
          reason: 'locked',
          reqNode,
          reqRank: needed,
          currentReqRank: reqRank,
          cost,
          rank,
          nextRank: rank + 1,
          maxLevel,
          maxed: false,
        };
      }
    }
    if (this.data.luminance < cost) {
      return {
        ok: false,
        reason: 'afford',
        cost,
        rank,
        nextRank: rank + 1,
        maxLevel,
        maxed: false,
      };
    }
    return {
      ok: true,
      reason: null,
      cost,
      rank,
      nextRank: rank + 1,
      maxLevel,
      maxed: false,
    };
  }

  buyAbilityTalent(nodeId) {
    const check = this.canUpgradeAbilityTalent(nodeId);
    if (!check.ok) return false;
    this.data.luminance -= check.cost;
    this.data.talentRanks[nodeId] = check.nextRank;
    this._save();
    return true;
  }

  isStartAbilityUnlocked(abilityId) {
    return isStartAbilityUnlocked(abilityId, this.data.talentRanks);
  }

  get selectedStartAbility() {
    return this.isStartAbilityUnlocked(this.data.selectedStartAbility)
      ? this.data.selectedStartAbility
      : 'resonant_volley';
  }

  selectStartAbility(abilityId) {
    if (!this.isStartAbilityUnlocked(abilityId)) return false;
    this.data.selectedStartAbility = abilityId;
    this._save();
    return true;
  }

  canAffordAnySanctuaryUpgrade() {
    const lum = this.data.luminance;
    for (const u of SANCTUARY_UPGRADES) {
      const rank = this.getUpgradeRank(u.id);
      if (rank < u.costs.length && lum >= u.costs[rank]) return true;
    }
    for (const t of ABILITY_TALENTS) {
      if (this.canUpgradeAbilityTalent(t.id).ok) return true;
    }
    return false;
  }

  isSpiritUnlocked(spiritOrId) {
    const spirit =
      typeof spiritOrId === 'string'
        ? SPIRIT_ASPECTS.find((s) => s.id === spiritOrId)
        : spiritOrId;
    if (!spirit) return false;
    return this.lifetimeLuminance >= spirit.unlockLuminance;
  }

  getSelectedSpiritObj() {
    return (
      SPIRIT_ASPECTS.find((s) => s.id === this.data.selectedSpirit) || SPIRIT_ASPECTS[0]
    );
  }

  getActiveQuestObjects() {
    const map = new Map(QUEST_POOL.map((q) => [q.id, q]));
    return this.data.activeQuests
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((q) => getScaledQuest(q, this.data.questTiers?.[q.id] || 1));
  }

  get tutorialCompleted() {
    return this.data.tutorialCompleted;
  }

  markTutorialCompleted() {
    if (!this.data.tutorialCompleted) {
      this.data.tutorialCompleted = true;
      this._save();
    }
  }

  setTutorialCompleted(completed) {
    this.data.tutorialCompleted = Boolean(completed);
    this._save();
  }

  _nextQuestId(excludeSet) {
    let cursor = this.data.questCursor || 0;
    for (let i = 0; i < QUEST_POOL.length; i += 1) {
      const candidate = QUEST_POOL[(cursor + i) % QUEST_POOL.length];
      if (!excludeSet.has(candidate.id)) {
        this.data.questCursor = (cursor + i + 1) % QUEST_POOL.length;
        return candidate.id;
      }
    }
    this.data.questCursor = (cursor + 1) % QUEST_POOL.length;
    return QUEST_POOL[cursor % QUEST_POOL.length].id;
  }

  recordRun({
    score,
    time,
    runStats = {},
    mode = this.gameMode,
    difficultyFx = null,
    bonusLuminance = 0,
    newlyMilestones = [],
    runSummary = null,
  }) {
    this._ensureDailyDate();
    const diffFx = difficultyFx || this.getDifficultyObj();
    const cleanScore = Math.floor(score);
    const prevHighScore = this.data.highScore;
    const prevDailyHighScore = this.data.dailyHighScore;

    const isCompetitive = mode !== GAME_MODES.ZEN;
    const isNewRecord = isCompetitive && cleanScore > this.data.highScore;
    const isDailyRecord = mode === GAME_MODES.DAILY && cleanScore > this.data.dailyHighScore;

    if (isCompetitive && cleanScore > this.data.highScore) {
      this.data.highScore = cleanScore;
    }
    if (isDailyRecord) {
      this.data.dailyHighScore = cleanScore;
    }
    if (time > this.data.bestTime) {
      this.data.bestTime = time;
    }
    const elitesCount = Math.max(0, Math.floor(runStats.elitesDefeated || 0));
    if (elitesCount > 0) {
      this.data.totalElitesDefeated = (this.data.totalElitesDefeated || 0) + elitesCount;
      if (elitesCount > (this.data.bestElites || 0)) {
        this.data.bestElites = elitesCount;
      }
    }

    // Track Daily Tide consecutive day streak, twist & first-daily 2x LUM
    const today = getTodayDateKey();
    let isFirstDailyDouble = false;
    let dailyTwist = null;
    if (mode === GAME_MODES.DAILY) {
      dailyTwist = getDailyTwist(today);
      isFirstDailyDouble = this.data.firstDailyBonusClaimedDate !== today;
      if (isFirstDailyDouble) {
        this.data.firstDailyBonusClaimedDate = today;
      }
      const prevPlayed = this.data.lastDailyPlayedDate;
      if (prevPlayed === getYesterdayDateKey()) {
        this.data.dailyStreak = Math.max(1, (this.data.dailyStreak || 0) + 1);
      } else if (prevPlayed !== today) {
        this.data.dailyStreak = 1;
      }
      this.data.lastDailyPlayedDate = today;
    }

    const medalInfo = getMedalForScore(cleanScore);
    if (isCompetitive && medalInfo.achieved) {
      const slot = mode === GAME_MODES.DAILY ? 'daily' : 'arcade';
      const medalOrder = RANK_MEDALS.map((m) => m.id);
      const curBestIdx = medalOrder.indexOf(this.data.bestMedals?.[slot] || '');
      const newIdx = medalOrder.indexOf(medalInfo.achieved.id);
      if (newIdx > curBestIdx) {
        this.data.bestMedals[slot] = medalInfo.achieved.id;
      }
    }

    const combinedMetrics = {
      ...runStats,
      score: cleanScore,
      survivalTime: time,
    };

    const currentQuests = this.getActiveQuestObjects();
    const completedQuests = [];
    let questBonus = 0;

    for (const q of currentQuests) {
      const val = combinedMetrics[q.metric] || 0;
      if (val >= q.target) {
        completedQuests.push(q);
        questBonus += q.reward;
        this.data.questTiers[q.id] = (this.data.questTiers?.[q.id] || 1) + 1;
      }
    }

    if (completedQuests.length > 0) {
      const completedIds = new Set(completedQuests.map((q) => q.id));
      const kept = this.data.activeQuests.filter((id) => !completedIds.has(id));
      const exclude = new Set([...kept, ...completedIds]);
      while (kept.length < 3) {
        const nextId = this._nextQuestId(exclude);
        kept.push(nextId);
        exclude.add(nextId);
      }
      this.data.activeQuests = kept;
    }

    const claimedSet = new Set(this.data.claimedMilestones || []);
    const awardedMilestones = [];
    let milestoneBounties = 0;
    for (const mId of newlyMilestones || []) {
      const mDef = MILESTONES_BY_ID[mId];
      if (mDef && !claimedSet.has(mId)) {
        claimedSet.add(mId);
        awardedMilestones.push(mDef);
        milestoneBounties += mDef.reward;
      }
    }
    if (awardedMilestones.length > 0) {
      this.data.claimedMilestones = [...claimedSet];
    }

    const baseRate = isCompetitive ? 0.5 : 0.325;
    const diffLumMul = Math.max(1, diffFx?.lumMul || 1);
    const streakBonus =
      mode === GAME_MODES.DAILY && this.dailyStreak > 1
        ? 1 + Math.min(0.6, (this.dailyStreak - 1) * 0.15)
        : 1;
    const baseLuminance = Math.floor(
      (Math.floor(cleanScore / 5) +
        (runStats.purgedCount || 0) * 3 +
        (runStats.constellationsCompleted || 0) * 20 +
        (runStats.elitesDefeated || 0) * 15 +
        Math.floor(time / 6)) *
        baseRate *
        diffLumMul *
        streakBonus
    );
    const cleanBonusLum = Math.max(0, Math.floor(bonusLuminance || 0));
    const runSubtotal = Math.max(4, baseLuminance) + cleanBonusLum;
    const doubledRun = isFirstDailyDouble ? runSubtotal * 2 : runSubtotal;
    const luminanceEarned = doubledRun + questBonus + milestoneBounties;

    const prevLifetime = this.lifetimeLuminance;
    this.data.luminance += luminanceEarned;
    this.data.lifetimeLuminance = Math.max(this.data.luminance, prevLifetime + luminanceEarned);

    const newlyUnlockedSpirits = SPIRIT_ASPECTS.filter(
      (s) => s.unlockLuminance > prevLifetime && s.unlockLuminance <= this.lifetimeLuminance
    );

    const historyEntry = {
      ts: Date.now(),
      score: cleanScore,
      time: Math.max(0, Math.round(time || 0)),
      mode,
      diffId: diffFx?.id || 'normal',
      diffName: diffFx?.name || 'Normal',
      spiritId: runSummary?.spiritId || this.data.selectedSpirit || 'wisp',
      spiritName: runSummary?.spiritName || 'Lumen Wisp',
      level: Math.max(1, Math.floor(runStats.level || 1)),
      phaseCode: runSummary?.phaseCode || '01',
      overdriveTier: Math.max(0, Math.floor(runSummary?.overdriveTier || 0)),
      medalId: medalInfo.achieved?.id || '',
      medalName: medalInfo.achieved?.name || '',
      elites: elitesCount,
      lum: luminanceEarned,
      abilities: Array.isArray(runSummary?.abilities) ? runSummary.abilities.slice(0, 6) : [],
      topAbilityId: runSummary?.topAbilityId || '',
      topAbilityShare: Math.max(0, Math.min(100, Math.round(runSummary?.topAbilityShare || 0))),
    };
    const prevHistory = Array.isArray(this.data.runHistory) ? this.data.runHistory : [];
    this.data.runHistory = [historyEntry, ...prevHistory].slice(0, 12);

    this._save();
    return {
      isNewRecord,
      isDailyRecord,
      prevHighScore,
      prevDailyHighScore,
      completedQuests,
      luminanceEarned,
      totalLuminance: this.data.luminance,
      lifetimeLuminance: this.lifetimeLuminance,
      dailyStreak: this.dailyStreak,
      medal: medalInfo,
      newlyUnlockedSpirits,
      difficulty: diffFx,
      dailyTwist,
      isFirstDailyDouble,
      firstDailyBonusLum: isFirstDailyDouble ? runSubtotal : 0,
      awardedMilestones,
      milestoneBounties,
      bonusLuminance: cleanBonusLum,
    };
  }

  resetProgress() {
    const prefs = {
      sfxVolume: this.data.sfxVolume,
      ambientVolume: this.data.ambientVolume,
      cursorGlide: this.data.cursorGlide,
      bloomLevel: this.data.bloomLevel,
      screenShake: this.data.screenShake,
    };
    this.data = { ...createFreshSaveData(), ...prefs };
    this._ensureDailyDate();
    this._ensureValidQuests();
    this._ensureValidSpirit();
    this._save();
  }

  addLuminance(amount) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    if (!add) return this.data.luminance;
    const prevLifetime = this.lifetimeLuminance;
    this.data.luminance += add;
    this.data.lifetimeLuminance = Math.max(this.data.luminance, prevLifetime + add);
    this._save();
    return this.data.luminance;
  }
}

export const storage = new StorageService();
