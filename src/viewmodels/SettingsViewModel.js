import { Observable } from '../core/Observable.js';
import { GAME_MODES } from '../core/Constants.js';
import { clamp } from '../core/MathUtils.js';

const MODE_LABELS = {
  [GAME_MODES.ARCADE]: 'ARCADE',
  [GAME_MODES.DAILY]: 'DAILY TIDE',
  [GAME_MODES.ZEN]: 'ZEN FLOW',
};

/**
 * MVVM ViewModel for the Settings Modal & HUD Audio Mixer.
 */
export class SettingsViewModel {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.isOpen = new Observable(false);
    this.sfxPct = new Observable(85);
    this.ambientPct = new Observable(75);
    this.bloomPct = new Observable(65);
    this.allMuted = new Observable(false);
    this.cursorGlide = new Observable(false);
    this.screenShake = new Observable(true);
    this.showTips = new Observable(true);
    this.modeLabel = new Observable('ARCADE');
  }

  sync({
    sfxVolume = 0.85,
    ambientVolume = 0.75,
    cursorGlide = false,
    gameMode = GAME_MODES.ARCADE,
    bloomLevel = 0.65,
    screenShake = true,
    tutorialCompleted = false,
  } = {}) {
    const sfx = Math.round(clamp(sfxVolume, 0, 1) * 100);
    const amb = Math.round(clamp(ambientVolume, 0, 1) * 100);
    const bloom = Math.round(clamp(bloomLevel, 0, 1) * 100);

    this.sfxPct.value = sfx;
    this.ambientPct.value = amb;
    this.bloomPct.value = bloom;
    this.allMuted.value = sfx === 0 && amb === 0;
    this.cursorGlide.value = Boolean(cursorGlide);
    this.screenShake.value = Boolean(screenShake);
    this.showTips.value = !tutorialCompleted;
    this.modeLabel.value = MODE_LABELS[gameMode] || 'ARCADE';
  }
}
