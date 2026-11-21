import { Observable } from '../core/Observable.js';

/**
 * MVVM ViewModel for the in-run Blessing / Level-Up Card Draft modal.
 * Manages card selection, Reroll, and Void Banish state cleanly outside the DOM.
 */
export class DraftViewModel {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.isOpen = new Observable(false);
    this.eyebrowText = new Observable('RESONANCE LEVEL UP');
    this.titleText = new Observable('Choose an Upgrade Card');
    this.isEliteBonus = new Observable(false);
    this.options = new Observable([]);
    this.rerollsLeft = new Observable(0);
    this.banishesLeft = new Observable(0);
    this.banishMode = new Observable(false);
    this.canBanishAny = new Observable(false);
  }

  openDraft(options = [], level = null, extra = {}) {
    const {
      eyebrow = '',
      title = '',
      isBonus = false,
      rerollsLeft = 0,
      banishesLeft = 0,
      abilityRanks = null,
      banishedAbilities = null,
    } = extra;

    this.banishMode.value = false;
    this.rerollsLeft.value = Math.max(0, rerollsLeft);
    this.banishesLeft.value = Math.max(0, banishesLeft);
    this.isEliteBonus.value = Boolean(isBonus);
    this.eyebrowText.value =
      eyebrow || (level ? `RESONANCE LEVEL ${level}` : 'RESONANCE LEVEL UP');
    this.titleText.value = title || 'Choose an Upgrade Card';

    const hasEquippedUnbanished =
      abilityRanks instanceof Map
        ? [...abilityRanks.entries()].some(([id, r]) => r > 0 && !banishedAbilities?.has(id))
        : false;
    const hasCardUnbanished = options.some(
      (o) => !banishedAbilities?.has(o.abilityId || o.id)
    );
    this.canBanishAny.value =
      this.banishesLeft.value > 0 && (hasEquippedUnbanished || hasCardUnbanished);
    this.options.value = options;
    this.isOpen.value = true;
  }

  closeDraft() {
    this.banishMode.value = false;
    this.isOpen.value = false;
  }

  toggleBanishMode() {
    if (this.banishesLeft.value <= 0) return false;
    this.banishMode.value = !this.banishMode.value;
    return this.banishMode.value;
  }

  selectCardOrBanish(optionUid, onChoose = null) {
    if (!this.isOpen.value) return;
    if (this.banishMode.value) {
      this.banishMode.value = false;
      this.callbacks.onBanishOption?.(optionUid);
      return { action: 'banish', uid: optionUid };
    }
    this.closeDraft();
    onChoose?.(optionUid);
    return { action: 'choose', uid: optionUid };
  }

  reroll() {
    if (this.rerollsLeft.value <= 0) return false;
    this.banishMode.value = false;
    this.callbacks.onRerollDraft?.();
    return true;
  }
}
