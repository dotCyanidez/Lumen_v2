import { Observable } from '../core/Observable.js';
import { GAME_MODES } from '../core/Constants.js';
import { clamp } from '../core/MathUtils.js';

const MODE_LABELS = {
  [GAME_MODES.ARCADE]: 'ARCADE',
  [GAME_MODES.DAILY]: 'DAILY TIDE',
  [GAME_MODES.ZEN]: 'ZEN FLOW',
};

/**
 * MVVM ViewModel for the live Gameplay HUD.
 * Translates raw run & player state into formatted, bindable observables so
 * DOM Views only update elements whose values actually changed.
 */
export class HudViewModel {
  constructor() {
    this.scoreText = new Observable('0');
    this.hpText = new Observable('100 / 100');
    this.hpRatio = new Observable(1);
    this.hpState = new Observable('healthy'); // 'healthy' | 'warning' | 'critical'
    this.shieldVisible = new Observable(false);
    this.shieldText = new Observable('0 / 0');
    this.shieldRatio = new Observable(0);
    this.levelText = new Observable('LV 1');
    this.expRatio = new Observable(0);
    this.phaseCode = new Observable('01 · FIRST SPARK');
    this.modeTagVisible = new Observable(false);
    this.modeTagText = new Observable('ARCADE');
    this.maxDashes = new Observable(2);
    this.dashCharges = new Observable(2);
    this.dashRechargeProgress = new Observable(0);

    this._displayScore = 0;
  }

  reset({
    maxHealth = 100,
    maxDashes = 2,
    mode = GAME_MODES.ARCADE,
    maxShield = 0,
    shield = 0,
  } = {}) {
    this._displayScore = 0;
    this.scoreText.value = '0';
    this.syncHealth(maxHealth, maxHealth);
    this.syncShield(shield, maxShield);
    this.levelText.value = 'LV 1';
    this.expRatio.value = 0;
    this.phaseCode.value = '01 · FIRST SPARK';
    this.syncMode(mode);
    this.maxDashes.value = maxDashes;
    this.dashCharges.value = maxDashes;
    this.dashRechargeProgress.value = 0;
  }

  syncHealth(health, maxHealth) {
    const cleanMax = Math.max(1, Math.round(maxHealth || 100));
    const cleanHp = clamp(Math.ceil(health), 0, cleanMax);
    const ratio = clamp(cleanHp / cleanMax, 0, 1);
    this.hpText.value = `${cleanHp} / ${cleanMax}`;
    this.hpRatio.value = ratio;
    this.hpState.value = ratio <= 0.28 ? 'critical' : ratio <= 0.55 ? 'warning' : 'healthy';
  }

  syncShield(shield = 0, maxShield = 0) {
    const cleanMax = Math.max(0, Math.round(maxShield || 0));
    if (cleanMax <= 0) {
      this.shieldVisible.value = false;
      this.shieldRatio.value = 0;
      return;
    }
    this.shieldVisible.value = true;
    const cleanShield = clamp(Math.ceil(shield), 0, cleanMax);
    this.shieldText.value = `${cleanShield} / ${cleanMax}`;
    this.shieldRatio.value = clamp(cleanShield / cleanMax, 0, 1);
  }

  syncMode(mode = GAME_MODES.ARCADE) {
    const show = mode !== GAME_MODES.ARCADE;
    this.modeTagVisible.value = show;
    if (show) {
      this.modeTagText.value = MODE_LABELS[mode] || 'ARCADE';
    }
  }

  updateFrame(dt, {
    score = 0,
    health = 100,
    maxHealth = 100,
    shield = 0,
    maxShield = 0,
    maxDashes = 2,
    dashCharges = 2,
    dashRechargeProgress = 0,
    phaseCode = '01 · FIRST SPARK',
    mode = GAME_MODES.ARCADE,
    level = 1,
    exp = 0,
    expToNext = 45,
  } = {}) {
    this._displayScore += (score - this._displayScore) * Math.min(1, dt * 15);
    if (Math.abs(score - this._displayScore) < 0.8) this._displayScore = score;
    this.scoreText.value = Math.floor(this._displayScore).toLocaleString();

    this.syncHealth(health, maxHealth);
    this.syncShield(shield, maxShield);
    this.syncMode(mode);

    this.levelText.value = `LV ${level}`;
    this.expRatio.value = expToNext > 0 ? clamp(exp / expToNext, 0, 1) : 0;
    this.phaseCode.value = phaseCode;
    this.maxDashes.value = maxDashes;
    this.dashCharges.value = dashCharges;
    this.dashRechargeProgress.value = clamp(dashRechargeProgress, 0, 1);
  }
}
