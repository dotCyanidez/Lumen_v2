import { Observable } from '../core/Observable.js';
import { PHASES, getExpForNextLevel } from '../core/Constants.js';
import { applyUpgradeOption, createDefaultBuildState } from '../services/DraftService.js';
import { getActiveSynergies } from '../services/SynergyTalentService.js';

/**
 * Pure Domain Model for an active gameplay run session.
 * Encapsulates score, EXP/level progression, equipped ability ranks, build state,
 * synergies, and draft economy (rerolls/banishes) with zero Pixi or DOM imports.
 */
export class RunSessionModel {
  constructor() {
    this.score = new Observable(0);
    this.level = new Observable(1);
    this.exp = new Observable(0);
    this.expToNext = new Observable(getExpForNextLevel(1));
    this.survivalTime = new Observable(0);
    this.currentPhaseIndex = new Observable(0);
    this.overdriveTier = new Observable(0);
    this.purgedCount = new Observable(0);
    this.motesCount = new Observable(0);
    this.constellationsCompleted = new Observable(0);
    this.coresShattered = new Observable(0);
    this.elitesDefeated = new Observable(0);
    this.rerollsLeft = new Observable(1);
    this.banishesLeft = new Observable(0);

    this.abilityRanks = new Map([['resonant_volley', 1]]);
    this.buildState = createDefaultBuildState();
    this.banishedAbilities = new Set();
    this.activeSynergies = [];
    this.pendingLevelUps = 0;
  }

  reset({
    startAbilityId = 'resonant_volley',
    extraRerolls = 1,
    banishes = 0,
  } = {}) {
    this.score.value = 0;
    this.level.value = 1;
    this.exp.value = 0;
    this.expToNext.value = getExpForNextLevel(1);
    this.survivalTime.value = 0;
    this.currentPhaseIndex.value = 0;
    this.overdriveTier.value = 0;
    this.purgedCount.value = 0;
    this.motesCount.value = 0;
    this.constellationsCompleted.value = 0;
    this.coresShattered.value = 0;
    this.elitesDefeated.value = 0;
    this.rerollsLeft.value = Math.max(0, extraRerolls);
    this.banishesLeft.value = Math.max(0, banishes);

    this.abilityRanks.clear();
    this.buildState = createDefaultBuildState();
    for (const st of Object.values(this.buildState)) {
      st.rank = 0;
    }
    applyUpgradeOption(
      { id: startAbilityId, abilityId: startAbilityId, aspect: 'unlock', mode: 'unlock', val: 1 },
      this.abilityRanks,
      this.buildState
    );
    this.banishedAbilities.clear();
    this.activeSynergies = getActiveSynergies(this.abilityRanks);
    this.pendingLevelUps = 0;
  }

  addScore(points) {
    if (!(points > 0)) return this.score.value;
    this.score.value += points;
    return this.score.value;
  }

  addExp(rawAmount, expMultiplier = 1) {
    const gained = Math.max(1, Math.round(rawAmount * expMultiplier));
    let curExp = this.exp.value + gained;
    let curLv = this.level.value;
    let nextNeed = this.expToNext.value;
    let leveledUp = 0;

    while (curExp >= nextNeed) {
      curExp -= nextNeed;
      curLv += 1;
      leveledUp += 1;
      this.pendingLevelUps += 1;
      nextNeed = getExpForNextLevel(curLv);
    }

    this.level.value = curLv;
    this.exp.value = curExp;
    this.expToNext.value = nextNeed;
    return { gained, leveledUp, level: curLv };
  }

  applyDraftOption(option) {
    const nextRank = applyUpgradeOption(option, this.abilityRanks, this.buildState);
    this.activeSynergies = getActiveSynergies(this.abilityRanks);
    return nextRank;
  }

  useReroll() {
    if (this.rerollsLeft.value <= 0) return false;
    this.rerollsLeft.value -= 1;
    return true;
  }

  banishAbility(abilityId) {
    if (!abilityId || this.banishesLeft.value <= 0 || this.banishedAbilities.has(abilityId)) {
      return false;
    }
    this.banishesLeft.value -= 1;
    this.banishedAbilities.add(abilityId);
    return true;
  }

  get currentPhase() {
    return PHASES[this.currentPhaseIndex.value] || PHASES[0];
  }
}
