import { Observable } from '../core/Observable.js';
import { GAME_MODES } from '../core/Constants.js';

/**
 * Reactive Domain Model wrapping persistent player meta-progression and preferences.
 * Zero PixiJS or DOM dependencies (SRP + DIP).
 */
export class MetaProfileModel {
  constructor(storageService) {
    this.storage = storageService;
    this.luminance = new Observable(storageService?.luminance ?? 0);
    this.lifetimeLuminance = new Observable(storageService?.lifetimeLuminance ?? 0);
    this.highScore = new Observable(storageService?.highScore ?? 0);
    this.dailyHighScore = new Observable(storageService?.dailyHighScore ?? 0);
    this.dailyStreak = new Observable(storageService?.dailyStreak ?? 0);
    this.gameMode = new Observable(storageService?.gameMode ?? GAME_MODES.ARCADE);
    this.selectedDifficulty = new Observable(storageService?.selectedDifficulty ?? 'normal');
    this.selectedSpirit = new Observable(storageService?.selectedSpirit ?? 'wisp');
    this.selectedStartAbility = new Observable(
      storageService?.selectedStartAbility ?? 'resonant_volley'
    );
    this.sfxVolume = new Observable(storageService?.sfxVolume ?? 0.85);
    this.ambientVolume = new Observable(storageService?.ambientVolume ?? 0.75);
    this.bloomLevel = new Observable(storageService?.bloomLevel ?? 0.65);
    this.screenShake = new Observable(storageService?.screenShake ?? true);
    this.cursorGlide = new Observable(storageService?.cursorGlide ?? false);
    this.tutorialCompleted = new Observable(storageService?.tutorialCompleted ?? false);
  }

  syncFromStorage() {
    const s = this.storage;
    if (!s) return;
    this.luminance.value = s.luminance;
    this.lifetimeLuminance.value = s.lifetimeLuminance;
    this.highScore.value = s.highScore;
    this.dailyHighScore.value = s.dailyHighScore;
    this.dailyStreak.value = s.dailyStreak;
    this.gameMode.value = s.gameMode;
    this.selectedDifficulty.value = s.selectedDifficulty;
    this.selectedSpirit.value = s.selectedSpirit;
    this.selectedStartAbility.value = s.selectedStartAbility;
    this.sfxVolume.value = s.sfxVolume;
    this.ambientVolume.value = s.ambientVolume;
    this.bloomLevel.value = s.bloomLevel;
    this.screenShake.value = s.screenShake;
    this.cursorGlide.value = s.cursorGlide;
    this.tutorialCompleted.value = s.tutorialCompleted;
  }
}
