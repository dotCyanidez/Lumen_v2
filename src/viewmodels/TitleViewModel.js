import { Observable } from '../core/Observable.js';
import {
  DIFFICULTIES_BY_ID,
  GAME_MODES,
  RANK_MEDALS,
} from '../core/Constants.js';
import { getAbilityInfo } from '../services/DraftService.js';

/**
 * MVVM ViewModel for the Title Screen & How-to-Play Codex modal.
 */
export class TitleViewModel {
  constructor() {
    this.highScore = new Observable(0);
    this.dailyHighScore = new Observable(0);
    this.luminance = new Observable(0);
    this.lifetimeLuminance = new Observable(0);
    this.gameMode = new Observable(GAME_MODES.ARCADE);
    this.selectedDifficulty = new Observable('normal');
    this.runNoteText = new Observable('');
    this.dailyStreakText = new Observable('');
    this.bestMedal = new Observable(null);
    this.canAffordSanctuary = new Observable(false);
    this.firstDailyAvailable = new Observable(false);
    this.activeQuests = new Observable([]);
  }

  sync(meta = {}) {
    const {
      highScore = 0,
      dailyHighScore = 0,
      luminance = 0,
      lifetimeLuminance = 0,
      selectedSpirit = 'wisp',
      selectedStartAbility = 'resonant_volley',
      gameMode = GAME_MODES.ARCADE,
      selectedDifficulty = 'normal',
      dailyTwist = null,
      firstDailyAvailable = false,
      activeQuests = [],
      canAffordSanctuary = false,
      dailyStreak = 0,
      bestMedals = { arcade: '', daily: '' },
    } = meta;

    this.highScore.value = highScore;
    this.dailyHighScore.value = dailyHighScore;
    this.luminance.value = luminance;
    this.lifetimeLuminance.value = lifetimeLuminance;
    this.gameMode.value = gameMode;
    this.selectedDifficulty.value = selectedDifficulty;
    this.canAffordSanctuary.value = Boolean(canAffordSanctuary);
    this.firstDailyAvailable.value = Boolean(firstDailyAvailable);
    this.activeQuests.value = activeQuests;

    const notes = [];
    const diffObj = DIFFICULTIES_BY_ID[selectedDifficulty];
    if (diffObj && selectedDifficulty !== 'normal' && gameMode !== GAME_MODES.ZEN) {
      notes.push(`${diffObj.label}: ${diffObj.desc}`);
    }
    if (gameMode === GAME_MODES.DAILY && dailyTwist) {
      const doubleTag = firstDailyAvailable ? ' · FIRST DAILY 2× LUM!' : '';
      notes.push(`DAILY TWIST — ${dailyTwist.name}: ${dailyTwist.desc}${doubleTag}`);
    } else if (gameMode === GAME_MODES.ZEN) {
      notes.push('ZEN FLOW: Peaceful indefinite drift · 0.65× LUM');
    }
    if (selectedStartAbility && selectedStartAbility !== 'resonant_volley') {
      const startInfo = getAbilityInfo(selectedStartAbility);
      if (startInfo) notes.push(`START: ${startInfo.name}`);
    }
    this.runNoteText.value = notes.join('  ·  ');

    if (dailyStreak > 0) {
      const bonusPct = Math.min(60, Math.max(0, (dailyStreak - 1) * 15));
      this.dailyStreakText.value =
        bonusPct > 0 ? `${dailyStreak}D (+${bonusPct}%)` : `${dailyStreak}D`;
    } else {
      this.dailyStreakText.value = '';
    }

    const bestMedalId = gameMode === GAME_MODES.DAILY ? bestMedals?.daily : bestMedals?.arcade;
    this.bestMedal.value = RANK_MEDALS.find((m) => m.id === bestMedalId) || null;
    this.selectedSpirit = selectedSpirit;
  }
}
