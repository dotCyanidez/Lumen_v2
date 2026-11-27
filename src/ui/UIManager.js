import {
  DIFFICULTIES_BY_ID,
  GAME_MODES,
  GAME_STATES,
  MAX_ABILITY_SLOTS,
  RANK_MEDALS,
  SPIRIT_ASPECTS,
  getAbilityInfo,
  getAbilityModifierLines,
} from '../core/Constants.js';
import { formatDuration } from '../core/MathUtils.js';
import { DraftViewModel } from '../viewmodels/DraftViewModel.js';
import { HudViewModel } from '../viewmodels/HudViewModel.js';
import { PauseGameOverViewModel } from '../viewmodels/PauseGameOverViewModel.js';
import { SanctuaryViewModel } from '../viewmodels/SanctuaryViewModel.js';
import { SettingsViewModel } from '../viewmodels/SettingsViewModel.js';
import { TitleViewModel } from '../viewmodels/TitleViewModel.js';
import {
  ABILITY_CARD_EMBLEMS,
  ABILITY_ICONS,
  MODE_LABELS,
  SVG_MIXER,
  SVG_PAUSE,
  TAROT_ASTROLABE_SVG,
  TAROT_STAR_SVG,
  hexToCss,
} from '../views/dom/DomIcons.js';
import {
  renderDamageBreakdown,
  renderRunConstellation,
} from '../views/dom/GameOverSummaryView.js';
import { renderMinimap } from '../views/dom/HudMinimapView.js';
import { SanctuaryModalView } from '../views/dom/SanctuaryModalView.js';

export class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks;

    this.hud = document.getElementById('hud');
    this.hpBarEl = document.getElementById('hud-hp-bar');
    this.hpFillEl = document.getElementById('hud-hp-fill');
    this.hpTextEl = document.getElementById('hud-hp-text');
    this.shieldWrapEl = document.getElementById('hud-shield-wrap');
    this.shieldFillEl = document.getElementById('hud-shield-fill');
    this.shieldTextEl = document.getElementById('hud-shield-text');
    this.dashesEl = document.getElementById('hud-dashes');
    this.scoreEl = document.getElementById('hud-score');
    this.phaseEl = document.getElementById('hud-phase');
    this.hudLevelEl = document.getElementById('hud-level');
    this.hudExpFillEl = document.getElementById('hud-exp-fill');
    this.hudModeRow = document.getElementById('hud-mode-row');
    this.hudModeTag = document.getElementById('hud-mode-tag');
    this.hudLoadoutEl = document.getElementById('hud-loadout');

    if (new URLSearchParams(window.location.search).get('dev') === '1') {
      this._isDevMode = true;
      document.querySelector('.title-dev-actions')?.classList.remove('hidden');
    }

    this.screens = {
      [GAME_STATES.TITLE]: document.getElementById('screen-title'),
      [GAME_STATES.PAUSED]: document.getElementById('screen-pause'),
      [GAME_STATES.GAMEOVER]: document.getElementById('screen-gameover'),
      guide: document.getElementById('screen-guide'),
      settings: document.getElementById('screen-settings'),
      sanctuary: document.getElementById('screen-sanctuary'),
      blessing: document.getElementById('screen-blessing'),
    };

    this.phaseBanner = document.getElementById('phase-banner');
    this.phaseBannerSub = document.getElementById('phase-banner-sub');
    this.phaseBannerTitle = document.getElementById('phase-banner-title');
    this.tutorialToast = document.getElementById('tutorial-toast');
    this.tutorialBadge = document.getElementById('tutorial-badge');
    this.tutorialText = document.getElementById('tutorial-text');
    this.touchDashBtn = document.getElementById('touch-dash-btn');
    this.hudMinimap = document.getElementById('hud-minimap');
    this.hudMinimapCanvas = document.getElementById('hud-minimap-canvas');
    this.hudMinimapCtx = this.hudMinimapCanvas ? this.hudMinimapCanvas.getContext('2d') : null;

    // Title & Sanctuary elements
    this.titleHighscorePill = document.getElementById('title-highscore-pill');
    this.titleHighscoreVal = document.getElementById('title-highscore-value');
    this.titleDailyPill = document.getElementById('title-daily-pill');
    this.titleDailyVal = document.getElementById('title-daily-value');
    this.titleLuminanceVal = document.getElementById('title-luminance-value');
    this.titleStreakPill = document.getElementById('title-streak-pill');
    this.titleStreakVal = document.getElementById('title-streak-value');
    this.titleMedalPill = document.getElementById('title-medal-pill');
    this.titleMedalVal = document.getElementById('title-medal-value');
    this.sanctuaryAffordDot = document.getElementById('sanctuary-afford-dot');
    this.settingsLumValEl = document.getElementById('settings-lum-val');
    this.spiritChipsEl = document.getElementById('spirit-chips');
    this.spiritDescEl = document.getElementById('spirit-desc');
    this.titleQuestsListEl = document.getElementById('title-quests-list');
    this.titleModeButtons = Array.from(document.querySelectorAll('[data-mode]'));
    this.titleDaily2xBadge = document.getElementById('title-daily-2x-badge');
    this.titleDiffButtons = Array.from(document.querySelectorAll('[data-diff]'));
    this.titleRunNoteEl = document.getElementById('title-run-note');

    this.sanctuaryLumBadgeEl = document.getElementById('sanctuary-lum-badge');
    this.sanctuaryUpgradesEl = document.getElementById('sanctuary-upgrades-list');
    this.sanctuaryTalentsEl = document.getElementById('sanctuary-talents-tree');
    this.sanctuaryTrailsEl = document.getElementById('sanctuary-trails-list');
    this.sanctuaryPalettesEl = document.getElementById('sanctuary-palettes-list');
    this.sanctuarySpiritsEl = document.getElementById('sanctuary-spirits-list');
    this.sanctuaryTabs = Array.from(document.querySelectorAll('.sanctuary-tab'));
    this.sanctuaryPanes = {
      upgrades: document.getElementById('sanctuary-tab-upgrades'),
      talents: document.getElementById('sanctuary-tab-talents'),
      looks: document.getElementById('sanctuary-tab-looks'),
      spirits: document.getElementById('sanctuary-tab-spirits'),
    };
    this.sanctuaryPanelEl = document.querySelector('#screen-sanctuary .sanctuary-panel');

    // Pause elements
    this.pauseScoreEl = document.getElementById('pause-score');
    this.pauseBestEl = document.getElementById('pause-best');
    this.pauseLoadoutEl = document.getElementById('pause-loadout');
    this.pauseTooltipEl = document.getElementById('pause-tooltip');
    this.pauseSynergiesEl = document.getElementById('pause-synergies');

    // Blessing elements
    this.blessingEyebrowEl = document.getElementById('blessing-eyebrow');
    this.blessingLoadoutEl = document.getElementById('blessing-loadout');
    this.blessingTooltipEl = document.getElementById('blessing-tooltip');
    this.blessingCardsEl = document.getElementById('blessing-cards');
    this.blessingHintEl = document.querySelector('#screen-blessing .panel-hint');
    this.btnBlessingReroll = document.getElementById('btn-blessing-reroll');
    this.btnBlessingBanish = document.getElementById('btn-blessing-banish');
    this.blessingOpenTimestamp = 0;
    this.hadRerollInDraft = false;
    this.hadBanishInDraft = false;
    this._onReroll = null;
    this._onBanish = null;

    // Game Over elements
    this.goRecordBadge = document.getElementById('gameover-record-badge');
    this.goScoreEl = document.getElementById('go-score');
    this.goPhaseEl = document.getElementById('go-phase');
    this.goMedalPillEl = document.getElementById('go-medal-pill');
    this.goTargetCalloutEl = document.getElementById('go-target-callout');
    this.goLoadoutEl = document.getElementById('go-loadout');
    this.goDmgSection = document.getElementById('go-dmg-section');
    this.btnGoDmgDetails = document.getElementById('btn-go-dmg-details');
    this.goDmgListEl = document.getElementById('go-dmg-list');
    this.goDmgDetailEl = document.getElementById('go-dmg-detail');
    this.goDmgExpanded = false;
    this.goBestLabelEl = document.getElementById('go-best-label');
    this.goBestEl = document.getElementById('go-best');
    this.goLevelEl = document.getElementById('go-level');
    this.goPurgedEl = document.getElementById('go-purged');
    this.goElitesEl = document.getElementById('go-elites');
    this.goTimeEl = document.getElementById('go-time');
    this.goConstellationCanvas = document.getElementById('go-constellation-canvas');
    this.goQuestsListEl = document.getElementById('go-quests-list');
    this.btnShareRun = document.getElementById('btn-share-run');

    // HUD buttons & mobile mixer
    this.btnHudMixer = document.getElementById('btn-hud-mixer');
    this.btnHudPause = document.getElementById('btn-hud-pause');
    this.hudMixerPopover = document.getElementById('hud-mixer-popover');
    this.btnHudMixer.innerHTML = SVG_MIXER;
    this.btnHudPause.innerHTML = SVG_PAUSE;

    // Synchronized sliders across Settings, Pause, HUD inline, HUD mobile popover
    this.sfxSliders = [
      document.getElementById('slider-settings-sfx'),
      document.getElementById('slider-pause-sfx'),
      document.getElementById('slider-hud-sfx'),
      document.getElementById('slider-pop-sfx'),
    ].filter(Boolean);

    this.ambientSliders = [
      document.getElementById('slider-settings-ambient'),
      document.getElementById('slider-pause-ambient'),
      document.getElementById('slider-hud-ambient'),
      document.getElementById('slider-pop-ambient'),
    ].filter(Boolean);

    this.sfxValLabels = [
      document.getElementById('val-settings-sfx'),
      document.getElementById('val-pause-sfx'),
      document.getElementById('val-hud-sfx'),
    ].filter(Boolean);

    this.ambientValLabels = [
      document.getElementById('val-settings-ambient'),
      document.getElementById('val-pause-ambient'),
      document.getElementById('val-hud-ambient'),
    ].filter(Boolean);

    // Settings & Mode controls
    this.bloomSlider = document.getElementById('slider-settings-bloom');
    this.bloomValLabel = document.getElementById('val-settings-bloom');
    this.btnSettingsMute = document.getElementById('btn-settings-mute');
    this.lblSettingsMute = document.getElementById('label-settings-mute');
    this.btnSettingsGlide = document.getElementById('btn-settings-glide');
    this.lblSettingsGlide = document.getElementById('label-settings-glide');
    this.btnSettingsShake = document.getElementById('btn-settings-shake');
    this.lblSettingsShake = document.getElementById('label-settings-shake');
    this.btnSettingsTips = document.getElementById('btn-settings-tips');
    this.lblSettingsTips = document.getElementById('label-settings-tips');

    this.btnSettingsMode = document.getElementById('btn-settings-mode');
    this.lblSettingsMode = document.getElementById('label-settings-mode');

    // ViewModels & modular DOM Views
    this.hudVM = new HudViewModel();
    this.draftVM = new DraftViewModel({
      onRerollDraft: () => this._onReroll?.(),
      onBanishOption: (id) => this._onBanish?.(id),
    });
    this.sanctuaryVM = new SanctuaryViewModel(callbacks);
    this.settingsVM = new SettingsViewModel(callbacks);
    this.titleVM = new TitleViewModel();
    this.pauseGameOverVM = new PauseGameOverViewModel();

    this.sanctuaryView = new SanctuaryModalView(
      {
        panelEl: this.sanctuaryPanelEl,
        lumBadgeEl: this.sanctuaryLumBadgeEl,
        upgradesEl: this.sanctuaryUpgradesEl,
        talentsEl: this.sanctuaryTalentsEl,
        trailsEl: this.sanctuaryTrailsEl,
        palettesEl: this.sanctuaryPalettesEl,
        spiritsEl: this.sanctuarySpiritsEl,
        tabs: this.sanctuaryTabs,
        panes: this.sanctuaryPanes,
      },
      this.sanctuaryVM,
      this.callbacks
    );

    this.dashPips = [];
    this.builtMaxHealth = 100;
    this.builtMaxDashes = 2;
    this._buildHudPips(100, 2);

    this.lastHealth = -1;
    this.lastMaxHealth = -1;
    this.bannerTimeout = null;
    this.guideReturnState = GAME_STATES.TITLE;
    this.settingsReturnState = GAME_STATES.TITLE;
    this.isTouchMode = false;
    this.lastGameOverInfo = null;
    this.shareResetTimer = null;

    this._bindViewModels();
    this._bindEvents();
  }

  get banishMode() {
    return this.draftVM.banishMode.value;
  }

  set banishMode(val) {
    this.draftVM.banishMode.value = Boolean(val);
  }

  _bindViewModels() {
    this.draftVM.banishMode.subscribe(() => this._syncBanishModeUI(), { immediate: false });

    this.hudVM.scoreText.subscribe((txt) => {
      this.scoreEl.textContent = txt;
    }, { immediate: false });
    this.hudVM.hpText.subscribe((txt) => {
      if (this.hpTextEl) this.hpTextEl.textContent = txt;
    }, { immediate: false });
    this.hudVM.hpRatio.subscribe((ratio) => {
      if (this.hpFillEl) this.hpFillEl.style.transform = `scaleX(${ratio})`;
    }, { immediate: false });
    this.hudVM.shieldVisible.subscribe((vis) => {
      this.shieldWrapEl?.classList.toggle('hidden', !vis);
    }, { immediate: false });
    this.hudVM.shieldText.subscribe((txt) => {
      if (this.shieldTextEl) this.shieldTextEl.textContent = txt;
    }, { immediate: false });
    this.hudVM.shieldRatio.subscribe((ratio) => {
      if (this.shieldFillEl) this.shieldFillEl.style.transform = `scaleX(${ratio})`;
    }, { immediate: false });
    this.hudVM.levelText.subscribe((txt) => {
      if (this.hudLevelEl) this.hudLevelEl.textContent = txt;
    }, { immediate: false });
    this.hudVM.expRatio.subscribe((ratio) => {
      if (this.hudExpFillEl) {
        this.hudExpFillEl.style.transform = `scaleX(${Math.max(0.01, ratio)})`;
      }
    }, { immediate: false });
    this.hudVM.phaseCode.subscribe((code) => {
      this.phaseEl.textContent = code;
    }, { immediate: false });
    this.hudVM.modeTagVisible.subscribe((show) => {
      this.hudModeTag?.classList.toggle('hidden', !show);
      this.hudModeRow?.classList.toggle('hidden', !show);
    }, { immediate: false });
    this.hudVM.modeTagText.subscribe((label) => {
      if (this.hudModeTag) this.hudModeTag.textContent = label;
    }, { immediate: false });

    this.settingsVM.sfxPct.subscribe((pct) => {
      for (const slider of this.sfxSliders) {
        slider.value = String(pct);
        slider.style.setProperty('--val', `${pct}%`);
      }
      for (const lbl of this.sfxValLabels) {
        lbl.textContent = pct === 0 ? 'OFF' : `${pct}%`;
      }
    });
    this.settingsVM.ambientPct.subscribe((pct) => {
      for (const slider of this.ambientSliders) {
        slider.value = String(pct);
        slider.style.setProperty('--val', `${pct}%`);
      }
      for (const lbl of this.ambientValLabels) {
        lbl.textContent = pct === 0 ? 'OFF' : `${pct}%`;
      }
    });
    this.settingsVM.bloomPct.subscribe((pct) => {
      if (this.bloomSlider) {
        this.bloomSlider.value = String(pct);
        this.bloomSlider.style.setProperty('--val', `${pct}%`);
      }
      if (this.bloomValLabel) {
        this.bloomValLabel.textContent = pct === 0 ? 'OFF' : `${pct}%`;
      }
    });
    this.settingsVM.allMuted.subscribe((allMuted) => {
      this.btnSettingsMute?.classList.toggle('is-on', allMuted);
      if (this.lblSettingsMute) {
        this.lblSettingsMute.textContent = allMuted ? 'MUTE ALL (M): ON' : 'MUTE ALL (M): OFF';
      }
    });
    this.settingsVM.cursorGlide.subscribe((cursorGlide) => {
      this.btnSettingsGlide?.classList.toggle('is-on', cursorGlide);
      if (this.lblSettingsGlide) this.lblSettingsGlide.textContent = cursorGlide ? 'HOVER' : 'HOLD';
    });
    this.settingsVM.screenShake.subscribe((screenShake) => {
      this.btnSettingsShake?.classList.toggle('is-on', screenShake);
      if (this.lblSettingsShake) this.lblSettingsShake.textContent = screenShake ? 'ON' : 'OFF';
    });
    this.settingsVM.showTips.subscribe((showTips) => {
      this.btnSettingsTips?.classList.toggle('is-on', showTips);
      if (this.lblSettingsTips) {
        this.lblSettingsTips.textContent = showTips ? 'ON NEXT RUN' : 'COMPLETED';
      }
    });
    this.settingsVM.modeLabel.subscribe((modeLabel) => {
      if (this.lblSettingsMode) this.lblSettingsMode.textContent = modeLabel;
    });
  }

  _buildHudPips(maxHealth = 100, maxDashes = 2) {
    this.builtMaxHealth = maxHealth;
    this.builtMaxDashes = maxDashes;
    this.hpBarEl?.setAttribute('aria-valuemax', String(Math.round(maxHealth)));

    this.dashesEl.innerHTML = '';
    this.dashPips = [];
    for (let i = 0; i < maxDashes; i++) {
      const pip = document.createElement('div');
      pip.className = 'dash-pip ready';
      const fill = document.createElement('div');
      fill.className = 'dash-pip-fill';
      pip.appendChild(fill);
      this.dashesEl.appendChild(pip);
      this.dashPips.push({ pip, fill });
    }
  }

  _bindEvents() {
    const click = (fn) => () => {
      this.callbacks.onUIClick();
      fn();
    };

    document.getElementById('btn-play').addEventListener('click', click(this.callbacks.onStart));
    document.getElementById('btn-guide').addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.openGuide(GAME_STATES.TITLE);
    });
    document.getElementById('btn-guide-close').addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.closeGuide();
    });
    document.getElementById('btn-title-settings')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.openSettings(GAME_STATES.TITLE);
    });
    document.getElementById('btn-title-sanctuary')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.openSanctuary();
    });
    document.getElementById('btn-dev-reset')?.addEventListener('click', () => {
      this.callbacks.onDevReset?.();
    });
    document.getElementById('btn-dev-money')?.addEventListener('click', () => {
      this.callbacks.onDevMoney?.();
    });
    document.getElementById('btn-dev-skip-60')?.addEventListener('click', () => {
      this.callbacks.onDevSkipTime?.(60);
    });
    document.getElementById('btn-dev-spawn-core')?.addEventListener('click', () => {
      this.callbacks.onDevSpawnCore?.();
    });
    document.getElementById('btn-sanctuary-close')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.closeSanctuary();
    });
    for (const tabBtn of this.sanctuaryTabs) {
      tabBtn.addEventListener('click', () => {
        this.callbacks.onUIClick();
        this.sanctuaryView.setTab(tabBtn.dataset.tab);
      });
    }
    this.btnBlessingReroll?.addEventListener('click', () => {
      this._onReroll?.();
    });
    this.btnBlessingBanish?.addEventListener('click', () => {
      if (this.btnBlessingBanish.disabled) return;
      this.callbacks.onUIClick();
      this.draftVM.toggleBanishMode();
    });

    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.openSettings(GAME_STATES.PAUSED);
    });
    document.getElementById('btn-settings-close')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.closeSettings();
    });

    document.getElementById('btn-resume').addEventListener('click', click(this.callbacks.onResume));
    document
      .getElementById('btn-pause-restart')
      .addEventListener('click', click(this.callbacks.onRestart));
    document.getElementById('btn-pause-guide').addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.openGuide(GAME_STATES.PAUSED);
    });
    document
      .getElementById('btn-pause-title')
      .addEventListener('click', click(this.callbacks.onEndRun || this.callbacks.onReturnTitle));

    document.getElementById('btn-restart').addEventListener('click', click(this.callbacks.onRestart));
    document
      .getElementById('btn-go-title')
      .addEventListener('click', click(this.callbacks.onReturnTitle));

    this.btnShareRun?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.shareRunCard();
    });

    for (const btn of this.titleModeButtons) {
      btn.addEventListener('click', () => {
        this.callbacks.onSelectMode?.(btn.dataset.mode);
      });
    }
    for (const btn of this.titleDiffButtons) {
      btn.addEventListener('click', () => {
        this.callbacks.onSelectDifficulty?.(btn.dataset.diff);
      });
    }
    this.btnGoDmgDetails?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.goDmgExpanded = !this.goDmgExpanded;
      this.btnGoDmgDetails.textContent = this.goDmgExpanded ? 'HIDE DETAILS' : 'DETAILED INFO';
      this.btnGoDmgDetails.setAttribute('aria-expanded', String(this.goDmgExpanded));
      this.goDmgDetailEl?.classList.toggle('hidden', !this.goDmgExpanded);
    });

    this.btnHudPause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hudMixerPopover?.classList.add('hidden');
      this.callbacks.onUIClick();
      this.callbacks.onPauseToggle();
    });

    this.btnHudMixer?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onUIClick();
      this.hudMixerPopover?.classList.toggle('hidden');
    });

    this.hudMixerPopover?.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.hudMixerPopover?.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('pointerdown', (e) => {
      if (
        this.hudMixerPopover &&
        !this.hudMixerPopover.classList.contains('hidden') &&
        !this.hudMixerPopover.contains(e.target) &&
        e.target !== this.btnHudMixer &&
        !this.btnHudMixer.contains(e.target)
      ) {
        this.hudMixerPopover.classList.add('hidden');
      }
    });

    for (const slider of this.sfxSliders) {
      slider.addEventListener('pointerdown', (e) => e.stopPropagation());
      slider.addEventListener('input', (e) => {
        const vol = Math.max(0, Math.min(1, Number(e.target.value) / 100));
        this.callbacks.onSfxVolume(vol);
      });
      slider.addEventListener('change', (e) => {
        if (Number(e.target.value) > 0) this.callbacks.onUIClick();
      });
    }

    for (const slider of this.ambientSliders) {
      slider.addEventListener('pointerdown', (e) => e.stopPropagation());
      slider.addEventListener('input', (e) => {
        const vol = Math.max(0, Math.min(1, Number(e.target.value) / 100));
        this.callbacks.onAmbientVolume(vol);
      });
    }

    this.bloomSlider?.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.bloomSlider?.addEventListener('input', (e) => {
      const val = Math.max(0, Math.min(1, Number(e.target.value) / 100));
      this.callbacks.onBloomLevel?.(val);
    });

    this.btnSettingsMute?.addEventListener('click', () => this.callbacks.onMuteAll?.());
    this.btnSettingsMode?.addEventListener('click', click(this.callbacks.onToggleMode));
    this.btnSettingsGlide?.addEventListener('click', click(this.callbacks.onToggleGlide));
    this.btnSettingsShake?.addEventListener('click', () => this.callbacks.onToggleScreenShake?.());
    this.btnSettingsTips?.addEventListener('click', () => this.callbacks.onToggleTutorialTips?.());

    this.touchDashBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.callbacks.onTouchDash();
    });
  }

  enableTouchControls() {
    this.isTouchMode = true;
    this.touchDashBtn.classList.remove('hidden');
    this.hudMinimap?.classList.add('has-touch-dash');
  }

  syncPreferences(prefs = {}) {
    const gameMode = prefs.gameMode ?? GAME_MODES.ARCADE;
    this.settingsVM.sync(prefs);
    this.btnSettingsMode?.classList.toggle('is-on', gameMode !== GAME_MODES.ARCADE);
    for (const btn of this.titleModeButtons) {
      btn.classList.toggle('active', btn.dataset.mode === gameMode);
    }
  }

  renderTitleMeta(payload = {}) {
    const {
      highScore = 0,
      dailyHighScore = 0,
      luminance = 0,
      lifetimeLuminance = luminance,
      selectedSpirit = 'wisp',
      selectedStartAbility = 'resonant_volley',
      dailyStreak = 0,
      dailyTwist = null,
      firstDailyAvailable = false,
      bestMedals = {},
      canAffordSanctuary = false,
      activeQuests = [],
      gameMode = GAME_MODES.ARCADE,
      difficulty = 'normal',
    } = payload;

    this.titleVM.sync({
      ...payload,
      selectedDifficulty: payload.difficulty ?? payload.selectedDifficulty ?? 'normal',
    });

    this.titleHighscorePill.classList.toggle('hidden', highScore <= 0);
    this.titleHighscoreVal.textContent = highScore.toLocaleString();

    const showDaily = dailyHighScore > 0 || gameMode === GAME_MODES.DAILY;
    this.titleDailyPill?.classList.toggle('hidden', !showDaily);
    if (this.titleDailyVal) this.titleDailyVal.textContent = dailyHighScore.toLocaleString();
    if (this.titleLuminanceVal) this.titleLuminanceVal.textContent = `${luminance.toLocaleString()} LUM`;

    for (const btn of this.titleModeButtons) {
      btn.classList.toggle('active', btn.dataset.mode === gameMode);
    }
    this.titleDaily2xBadge?.classList.toggle('hidden', !firstDailyAvailable);
    for (const btn of this.titleDiffButtons) {
      btn.classList.toggle('active', btn.dataset.diff === difficulty);
    }

    if (this.titleRunNoteEl) {
      const notes = [];
      const diffObj = DIFFICULTIES_BY_ID[difficulty];
      if (diffObj && diffObj.id !== 'normal') {
        notes.push(`${diffObj.label}: ${diffObj.shortDesc}`);
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
      this.titleRunNoteEl.textContent = notes.join('  ·  ');
      this.titleRunNoteEl.classList.toggle('hidden', notes.length === 0);
    }

    if (this.titleStreakPill && this.titleStreakVal) {
      this.titleStreakPill.classList.toggle('hidden', dailyStreak <= 0);
      if (dailyStreak > 0) {
        this.titleStreakVal.textContent = this.titleVM.dailyStreakText.value;
      }
    }

    const bestMedalId = gameMode === GAME_MODES.DAILY ? bestMedals?.daily : bestMedals?.arcade;
    const bestMedal = RANK_MEDALS.find((m) => m.id === bestMedalId) || null;
    if (this.titleMedalPill && this.titleMedalVal) {
      this.titleMedalPill.classList.toggle('hidden', !bestMedal);
      if (bestMedal) {
        this.titleMedalVal.textContent = bestMedal.label;
        this.titleMedalVal.style.color = bestMedal.color;
      }
    }

    this.sanctuaryAffordDot?.classList.toggle('hidden', !canAffordSanctuary);

    this.renderSpiritSelector({ luminance: lifetimeLuminance, selectedSpirit });

    if (this.titleQuestsListEl) {
      this._renderQuestPills(this.titleQuestsListEl, activeQuests);
    }
  }

  renderSpiritSelector({ luminance = 0, selectedSpirit = 'wisp', isPaused = false }) {
    if (this.settingsLumValEl) {
      this.settingsLumValEl.textContent = `${luminance.toLocaleString()} LUM`;
    }
    if (!this.spiritChipsEl) return;

    this.spiritChipsEl.innerHTML = '';
    let activeObj = SPIRIT_ASPECTS[0];
    for (const spirit of SPIRIT_ASPECTS) {
      const unlocked = luminance >= spirit.unlockLuminance;
      const active = unlocked && spirit.id === selectedSpirit;
      if (active) activeObj = spirit;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `spirit-chip${active ? ' active' : ''}${unlocked ? '' : ' locked'}`;
      btn.dataset.spiritId = spirit.id;

      const dot = document.createElement('span');
      dot.className = 'spirit-chip-dot';
      dot.style.background = hexToCss(spirit.colorHex);
      dot.style.boxShadow = `0 0 8px ${hexToCss(spirit.colorHex)}`;

      const nameEl = document.createElement('span');
      nameEl.className = 'spirit-chip-name';
      nameEl.textContent = spirit.name;

      const tagEl = document.createElement('span');
      tagEl.className = 'spirit-chip-tag';
      tagEl.textContent = unlocked ? spirit.tag : `🔒 ${spirit.unlockLuminance} LUM`;

      btn.append(dot, nameEl, tagEl);
      if (unlocked) {
        btn.addEventListener('click', () => {
          this.callbacks.onUIClick();
          this.callbacks.onSelectSpirit?.(spirit.id);
        });
      }
      this.spiritChipsEl.appendChild(btn);
    }

    if (this.spiritDescEl) {
      this.spiritDescEl.textContent = isPaused
        ? `${activeObj.name} · ${activeObj.desc} (Applies next run)`
        : `${activeObj.name} · ${activeObj.desc}`;
    }
  }

  _renderQuestPills(container, quests = [], runMetrics = null, completedIds = new Set()) {
    if (!container) return;
    container.innerHTML = '';
    for (const q of quests.slice(0, 3)) {
      const done = completedIds.has(q.id);
      const pill = document.createElement('div');
      pill.className = `quest-pill${done ? ' done' : ''}`;

      const head = document.createElement('div');
      head.className = 'quest-pill-head';

      const name = document.createElement('span');
      name.className = 'quest-pill-name';
      name.textContent = q.label;

      const reward = document.createElement('span');
      reward.className = 'quest-pill-reward';
      if (done) {
        reward.textContent = `✓ +${q.reward} LUM`;
      } else if (runMetrics) {
        const prog = Math.min(q.target, Math.floor(runMetrics[q.metric] || 0));
        reward.textContent = `${prog}/${q.target} · +${q.reward}`;
      } else {
        reward.textContent = `+${q.reward} LUM`;
      }

      head.append(name, reward);

      const desc = document.createElement('div');
      desc.className = 'quest-pill-desc';
      desc.textContent = q.desc;

      pill.append(head, desc);
      container.appendChild(pill);
    }
  }

  _normalizeRanks(abilityRanks) {
    if (!abilityRanks) return [];
    const raw =
      abilityRanks instanceof Map
        ? Array.from(abilityRanks.entries())
        : Object.entries(abilityRanks);
    return raw.filter(([, r]) => r > 0).slice(0, MAX_ABILITY_SLOTS);
  }

  renderLoadoutBar(
    container,
    abilityRanks,
    {
      interactive = false,
      buildState = null,
      tooltipEl = null,
      talentRanks = null,
      activeSynergies = [],
      banishedAbilities = null,
      onBanish = null,
    } = {}
  ) {
    if (!container) return;
    const entries = this._normalizeRanks(abilityRanks);
    const sig = entries.map(([id, r]) => `${id}:${r}`).join('|');
    if (!interactive && container._loadoutSig === sig) return;
    container._loadoutSig = sig;
    container._pinnedId = null;

    container.classList.toggle('hidden', entries.length === 0);
    container.innerHTML = '';

    for (const [id, rank] of entries) {
      const info = getAbilityInfo(id);
      const isBanished = Boolean(banishedAbilities?.has(id));
      const chip = document.createElement(interactive ? 'button' : 'div');
      if (interactive) chip.type = 'button';
      const catCls = info?.category === 'utility' ? 'loadout-chip--utility' : 'loadout-chip--damage';
      const evoCls = rank >= 10 ? ' is-supernova' : rank >= 5 ? ' is-ascended' : '';
      const banishCls = isBanished ? ' is-banished' : '';
      chip.className = `loadout-chip ${catCls}${evoCls}${banishCls}`;
      chip.dataset.abilityId = id;
      chip.setAttribute(
        'aria-label',
        `${info?.name || id} Level ${rank}${isBanished ? ' (Banished)' : ''}`
      );
      chip.innerHTML = `
        <span class="loadout-chip-icon">${ABILITY_ICONS[id] || ABILITY_ICONS.resonant_volley}</span>
        <span class="loadout-chip-lv">${isBanished ? '× ' : ''}LV ${rank}</span>
      `;

      if (interactive && tooltipEl) {
        const show = () =>
          this._showDraftTooltip(
            id,
            rank,
            buildState,
            tooltipEl,
            talentRanks,
            activeSynergies,
            isBanished
          );
        const hide = () => {
          if (!container._pinnedId) tooltipEl.classList.add('hidden');
        };
        chip.addEventListener('mouseenter', show);
        chip.addEventListener('focus', show);
        chip.addEventListener('mouseleave', hide);
        chip.addEventListener('blur', hide);
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.banishMode && onBanish && !isBanished) {
            this.callbacks.onUIClick();
            this.banishMode = false;
            onBanish(id);
            return;
          }
          const already = container._pinnedId === id;
          container._pinnedId = already ? null : id;
          container.querySelectorAll('.loadout-chip').forEach((el) => {
            el.classList.toggle('is-inspected', el === chip && !already);
          });
          if (already) tooltipEl.classList.add('hidden');
          else show();
        });
      }
      container.appendChild(chip);
    }
  }

  _showDraftTooltip(
    id,
    rank,
    buildState,
    tooltipEl,
    talentRanks = null,
    activeSynergies = [],
    isBanished = false
  ) {
    if (!tooltipEl) return;
    const info = getAbilityInfo(id);
    const lines = getAbilityModifierLines(id, buildState?.[id], rank, talentRanks, activeSynergies);
    const itemsHtml = [
      ...(isBanished ? ['<li class="tooltip-banished">✕ BANISHED FROM DRAFTS THIS RUN</li>'] : []),
      ...lines.map((line) => `<li>${line}</li>`),
    ].join('');
    tooltipEl.innerHTML = `
      <div class="tooltip-head">
        <span class="tooltip-title">${info?.name || id}</span>
        <span class="tooltip-lv">LV ${rank}</span>
      </div>
      <ul class="tooltip-mods">${itemsHtml}</ul>
    `;
    tooltipEl.classList.remove('hidden');
  }

  _syncBanishModeUI(banishesLeft = this._currentBanishesLeft || 0) {
    this._currentBanishesLeft = banishesLeft;
    if (banishesLeft <= 0 && this.banishMode) this.banishMode = false;
    this.blessingCardsEl?.classList.toggle('is-banish-mode', this.banishMode);
    this.blessingLoadoutEl?.classList.toggle('is-banish-mode', this.banishMode);
    if (this.btnBlessingBanish) {
      const showBanish = banishesLeft > 0 || this.hadBanishInDraft;
      this.btnBlessingBanish.classList.toggle('hidden', !showBanish);
      this.btnBlessingBanish.disabled = banishesLeft <= 0;
      this.btnBlessingBanish.classList.toggle('is-active', this.banishMode);
      this.btnBlessingBanish.textContent = this.banishMode
        ? `CANCEL BANISH (${banishesLeft})`
        : `BANISH (${banishesLeft})`;
    }
    if (this.blessingHintEl) {
      this.blessingHintEl.textContent = this.banishMode
        ? 'CLICK A CARD OR EQUIPPED ABILITY TO BANISH ALL ITS CARDS THIS RUN'
        : 'PRESS 1, 2 OR 3 · HOVER ABILITIES FOR MODIFIERS';
    }
  }

  showBlessingDraft(options, onChoose, level = null, extra = {}) {
    if (!this.screens.blessing || !this.blessingCardsEl) return;
    const {
      eyebrow = null,
      rerollsLeft = 0,
      banishesLeft = 0,
      banishedAbilities = null,
      abilityRanks = null,
      buildState = null,
      talentRanks = null,
      activeSynergies = [],
      onReroll = null,
      onBanish = null,
    } = extra || {};
    if (onReroll) this._onReroll = onReroll;
    if (onBanish) this._onBanish = onBanish;
    const freshOpen = this.screens.blessing.classList.contains('hidden');
    if (freshOpen) {
      this.hadRerollInDraft = rerollsLeft > 0;
      this.hadBanishInDraft = banishesLeft > 0;
    }

    this.draftVM.openDraft(options, level, extra);

    if (this.blessingEyebrowEl) {
      this.blessingEyebrowEl.textContent = this.draftVM.eyebrowText.value;
    }
    this.blessingTooltipEl?.classList.add('hidden');
    this.renderLoadoutBar(this.blessingLoadoutEl, abilityRanks, {
      interactive: true,
      buildState,
      talentRanks,
      activeSynergies,
      tooltipEl: this.blessingTooltipEl,
      banishedAbilities,
      onBanish: this._onBanish,
    });

    if (this.btnBlessingReroll) {
      const showReroll = rerollsLeft > 0 || this.hadRerollInDraft;
      this.btnBlessingReroll.classList.toggle('hidden', !showReroll);
      this.btnBlessingReroll.disabled = rerollsLeft <= 0;
      this.btnBlessingReroll.textContent = `REROLL (${rerollsLeft})`;
    }
    this._syncBanishModeUI(banishesLeft);

    this.blessingOpenTimestamp = performance.now();
    this.blessingCardsEl.innerHTML = '';
    options.forEach((blessing, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      const catClass =
        blessing.category === 'damage' ? 'blessing-card--damage' : 'blessing-card--utility';
      const isNew = Boolean(blessing.isNew || (blessing.nextRank || 1) <= 1);
      const rarity = isNew ? 'new' : blessing.rarity || 'common';
      const rarityClass = !isNew ? ` blessing-card--${rarity}` : '';
      const nextRank = blessing.nextRank || 1;
      card.className = `blessing-card ${catClass}${rarityClass}`;
      card.dataset.blessingId = blessing.abilityId || blessing.id;
      card.dataset.blessingUid = blessing.uid || blessing.id;
      const rarityBadge = isNew
        ? 'NEW'
        : rarity === 'epic'
          ? 'EPIC'
          : rarity === 'rare'
            ? 'RARE'
            : rarity === 'uncommon'
              ? 'UNCOMMON'
              : 'COMMON';
      const rankPill = isNew ? 'LV 1' : `LV ${nextRank}`;
      const rankCls = isNew ? '' : `is-${rarity}`;
      const displayTitle = blessing.title || blessing.name || '';
      const abilityId = blessing.abilityId || blessing.id || 'resonant_volley';
      const abilityInfo = getAbilityInfo(abilityId);
      const abilityName = (abilityInfo?.name || blessing.name || blessing.tag || '').toUpperCase();
      const emblemSvg = ABILITY_CARD_EMBLEMS[abilityId] || ABILITY_CARD_EMBLEMS.resonant_volley;

      const hintLines = [];
      if (blessing.ascensionHint) {
        const evo = blessing.ascensionHint;
        hintLines.push(
          `<span class="blessing-card-hint is-evo">${evo.isSupernova ? '✦ SUPERNOVA' : '★ ASCENDS'} LV ${evo.rank}: ${evo.name}</span>`
        );
      }
      if (Array.isArray(blessing.synergyHints) && blessing.synergyHints.length > 0) {
        const h = blessing.synergyHints[0];
        if (h.readyNow) {
          hintLines.push(
            `<span class="blessing-card-hint is-ready">◈ Completes Synergy: ${h.name} (${h.partnerName})</span>`
          );
        } else if (h.active) {
          hintLines.push(
            `<span class="blessing-card-hint">◈ Synergy Active: ${h.name}</span>`
          );
        } else {
          hintLines.push(
            `<span class="blessing-card-hint">Pairs with ${h.partnerName} → ${h.name}</span>`
          );
        }
      }
      const footerHtml =
        hintLines.length > 0
          ? `<div class="blessing-card-footer"><div class="blessing-star-divider">✦</div><div class="blessing-card-hints">${hintLines.join('')}</div></div>`
          : '';

      card.innerHTML = `
        <span class="blessing-crest">${TAROT_STAR_SVG}</span>
        <span class="blessing-corner tl">${TAROT_STAR_SVG}</span>
        <span class="blessing-corner tr">${TAROT_STAR_SVG}</span>
        <span class="blessing-corner bl">${TAROT_STAR_SVG}</span>
        <span class="blessing-corner br">${TAROT_STAR_SVG}</span>
        <div class="blessing-medallion">
          ${TAROT_ASTROLABE_SVG}
          ${emblemSvg}
        </div>
        <div class="blessing-card-pills">
          <span class="blessing-card-rank ${rankCls}">${rarityBadge}</span>
          <span class="blessing-card-rank ${rankCls}">${rankPill}</span>
          <span class="blessing-card-key">${idx + 1}</span>
        </div>
        <div class="blessing-card-tag"><span>✦</span> ${abilityName}</div>
        <div class="blessing-card-title">${displayTitle}</div>
        <div class="blessing-card-desc">${blessing.desc}</div>
        ${footerHtml}
      `;
      card.addEventListener('click', () => {
        if (performance.now() - this.blessingOpenTimestamp < 260) return;
        this.callbacks.onUIClick();
        const uid = blessing.uid || blessing.id;
        if (this.banishMode && this._onBanish) {
          this.banishMode = false;
          this._onBanish(uid);
          return;
        }
        onChoose(uid);
      });
      this.blessingCardsEl.appendChild(card);
    });

    this.hud.classList.add('hidden');
    this.touchDashBtn.classList.add('hidden');
    this.hideTutorial();
    this.screens.blessing.classList.remove('hidden');
    this.screens.blessing.classList.add('active');
    this.screens.blessing.setAttribute('aria-hidden', 'false');
  }

  hideBlessingDraft() {
    if (!this.screens.blessing) return;
    this.draftVM.closeDraft();
    this.blessingTooltipEl?.classList.add('hidden');
    this.screens.blessing.classList.remove('active');
    this.screens.blessing.classList.add('hidden');
    this.screens.blessing.setAttribute('aria-hidden', 'true');
    if (
      this.hud &&
      document.querySelector('#screen-gameover.hidden') &&
      document.querySelector('#screen-title.hidden')
    ) {
      this.hud.classList.remove('hidden');
      if (this.isTouchMode) this.touchDashBtn.classList.remove('hidden');
    }
  }

  _showScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      if (!el) continue;
      const match = key === name;
      if (match) {
        el.classList.remove('hidden');
        requestAnimationFrame(() => el.classList.add('active'));
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.classList.remove('active');
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
      }
    }
  }

  openGuide(returnTo) {
    this.guideReturnState = returnTo;
    this._showScreen('guide');
  }

  closeGuide() {
    this._showScreen(this.guideReturnState);
  }

  isGuideOpen() {
    return this.screens.guide.classList.contains('active');
  }

  openSettings(returnTo) {
    this.settingsReturnState = returnTo;
    this.settingsVM.isOpen.value = true;
    this._showScreen('settings');
  }

  closeSettings() {
    this.settingsVM.isOpen.value = false;
    this._showScreen(this.settingsReturnState);
  }

  isSettingsOpen() {
    return Boolean(this.screens.settings?.classList.contains('active'));
  }

  openSanctuary() {
    this.sanctuaryVM.open();
    this._showScreen('sanctuary');
  }

  closeSanctuary() {
    this.sanctuaryVM.close();
    this._showScreen(GAME_STATES.TITLE);
  }

  isSanctuaryOpen() {
    return Boolean(this.screens.sanctuary?.classList.contains('active'));
  }

  resetSanctuarySelection() {
    this.sanctuaryView.resetSelection();
  }

  renderSanctuary(payload = {}) {
    this.sanctuaryView.renderSanctuary(payload);
  }

  setGameState(state, info = {}) {
    if (state !== GAME_STATES.PLAYING) {
      this.hudMixerPopover?.classList.add('hidden');
      document.getElementById('hud-dev-actions')?.classList.add('hidden');
    }

    if (state === GAME_STATES.PLAYING) {
      this._showScreen(null);
      this.hud.classList.remove('hidden');
      this.hud.setAttribute('aria-hidden', 'false');
      this.hudMinimap?.classList.remove('hidden');
      this.hudMinimap?.classList.toggle('has-touch-dash', this.isTouchMode);
      if (this._isDevMode) {
        document.getElementById('hud-dev-actions')?.classList.remove('hidden');
      }
      if (this.isTouchMode) this.touchDashBtn.classList.remove('hidden');
    } else if (state === GAME_STATES.DYING) {
      this._showScreen(null);
      this.hud.classList.add('hidden');
      this.hudMinimap?.classList.add('hidden');
      this.touchDashBtn.classList.add('hidden');
      this.hideTutorial();
    } else if (state === GAME_STATES.TITLE) {
      this.hud.classList.add('hidden');
      this.hudMinimap?.classList.add('hidden');
      this.touchDashBtn.classList.add('hidden');
      this.phaseBanner?.classList.add('hidden');
      this.hideTutorial();
      this.renderTitleMeta(info);
      this.renderSanctuary(info);
      this._showScreen(GAME_STATES.TITLE);
    } else if (state === GAME_STATES.PAUSED) {
      this.hud.classList.add('hidden');
      this.hudMinimap?.classList.add('hidden');
      this.touchDashBtn.classList.add('hidden');
      this.phaseBanner?.classList.add('hidden');
      this.hideTutorial();
      const pauseBest = info.bestScore ?? info.highScore ?? 0;
      this.pauseGameOverVM.syncPause({ score: info.score || 0, highScore: pauseBest });
      this.pauseScoreEl.textContent = Math.floor(info.score || 0).toLocaleString();
      this.pauseBestEl.textContent = pauseBest.toLocaleString();
      this.pauseTooltipEl?.classList.add('hidden');
      this.renderLoadoutBar(this.pauseLoadoutEl, info.abilityRanks, {
        interactive: true,
        buildState: info.buildState,
        talentRanks: info.talentRanks,
        activeSynergies: info.activeSynergies || [],
        banishedAbilities: info.banishedAbilities || null,
        tooltipEl: this.pauseTooltipEl,
      });
      if (this.pauseSynergiesEl) {
        const syns = info.activeSynergies || [];
        this.pauseSynergiesEl.classList.toggle('hidden', syns.length === 0);
        this.pauseSynergiesEl.innerHTML = syns
          .map((s) => `<span class="pause-synergy-pill" title="${s.desc}">◈ ${s.name}</span>`)
          .join('');
      }
      this._showScreen(GAME_STATES.PAUSED);
    } else if (state === GAME_STATES.GAMEOVER) {
      this.hud.classList.add('hidden');
      this.hudMinimap?.classList.add('hidden');
      this.touchDashBtn.classList.add('hidden');
      this.phaseBanner?.classList.add('hidden');
      this.hideTutorial();
      this.lastGameOverInfo = info;

      const durationSec = info.time ?? info.survivalTime ?? 0;
      this.pauseGameOverVM.syncGameOver({ ...info, survivalTime: durationSec });

      const score = Math.floor(info.score || 0);
      const isDaily = info.mode === GAME_MODES.DAILY;
      const showBadge = Boolean(info.isNewRecord || info.isDailyRecord);
      this.goRecordBadge.textContent =
        isDaily && info.isDailyRecord && !info.isNewRecord
          ? '✦ DAILY TIDE RECORD ✦'
          : '✦ NEW SANCTUARY RECORD ✦';
      this.goRecordBadge.classList.toggle('hidden', !showBadge);

      this.goScoreEl.textContent = this.pauseGameOverVM.finalScoreText.value;
      this.goPhaseEl.textContent = `Reached ${info.phaseName || 'First Spark'}${info.level ? ` · LV ${info.level}` : ''}`;

      const achievedMedal = info.medal?.achieved || null;
      if (this.goMedalPillEl) {
        this.goMedalPillEl.classList.toggle('hidden', !achievedMedal);
        if (achievedMedal) {
          this.goMedalPillEl.textContent = `${achievedMedal.label} MEDAL`;
          this.goMedalPillEl.style.color = achievedMedal.color;
          this.goMedalPillEl.style.borderColor = `${achievedMedal.color}66`;
        }
      }

      if (this.goBestLabelEl) {
        this.goBestLabelEl.textContent = isDaily ? 'DAILY BEST' : 'HIGH SCORE';
      }
      this.goBestEl.textContent = Math.floor(
        isDaily ? info.dailyHighScore || 0 : info.highScore || 0
      ).toLocaleString();

      if (this.goLevelEl) this.goLevelEl.textContent = `LV ${info.level || 1}`;
      this.goPurgedEl.textContent = (info.purgedCount || 0).toLocaleString();
      if (this.goElitesEl) {
        this.goElitesEl.textContent = (info.elitesDefeated || 0).toLocaleString();
      }
      this.goTimeEl.textContent = this.pauseGameOverVM.finalTimeText.value;

      // Build compelling "So close" / reward callout
      if (this.goTargetCalloutEl) {
        const lumEarned = info.luminanceEarned || 0;
        const unlocked = info.newlyUnlockedSpirits || [];
        const targetBest = isDaily ? info.prevDailyHighScore || 0 : info.prevHighScore || 0;
        let msg = `+${lumEarned} Luminance earned`;
        let isMilestone = false;

        if (unlocked.length > 0) {
          const lead = unlocked[0].name.toUpperCase();
          const more = unlocked.length > 1 ? ` +${unlocked.length - 1} MORE` : '';
          msg = `✦ UNLOCKED ${lead}${more} · +${lumEarned} LUM`;
          isMilestone = true;
        } else if (info.isNewRecord || (isDaily && info.isDailyRecord)) {
          msg = `✦ NEW RECORD SHATTERED · +${lumEarned} LUM`;
          isMilestone = true;
        } else if (info.mode !== GAME_MODES.ZEN && targetBest > score) {
          const gap = targetBest - score;
          msg = `Only ${gap.toLocaleString()} pts shy of Best · +${lumEarned} LUM`;
        }

        const streakSuffix =
          isDaily && (info.dailyStreak || 0) > 1 ? ` · ${info.dailyStreak}D STREAK` : '';
        const doubleSuffix =
          info.isFirstDailyDouble && (info.firstDailyBonusLum || 0) > 0
            ? ` · FIRST DAILY 2× (+${info.firstDailyBonusLum})`
            : '';
        const milestoneSuffix =
          (info.awardedMilestones || []).length > 0
            ? ` · ★ ${info.awardedMilestones.map((m) => m.name.toUpperCase()).join(', ')} (+${info.milestoneBounties})`
            : '';
        if (info.isFirstDailyDouble || (info.awardedMilestones || []).length > 0) {
          isMilestone = true;
        }
        this.goTargetCalloutEl.textContent = `${msg}${doubleSuffix}${milestoneSuffix}${streakSuffix}`;
        this.goTargetCalloutEl.classList.toggle('is-milestone', isMilestone);
        this.goTargetCalloutEl.classList.remove('hidden');
      }

      this.renderLoadoutBar(this.goLoadoutEl, info.abilityRanks);
      this.goDmgExpanded = renderDamageBreakdown(
        {
          section: this.goDmgSection,
          listEl: this.goDmgListEl,
          detailEl: this.goDmgDetailEl,
          detailsBtn: this.btnGoDmgDetails,
        },
        info
      );

      // Render evaluated Contracts (show completed quests highlighted + active slots up to 3)
      const completed = info.completedQuests || [];
      const completedIds = new Set(completed.map((q) => q.id));
      const mergedQuests = [
        ...completed,
        ...(info.activeQuests || []).filter((q) => !completedIds.has(q.id)),
      ].slice(0, 3);
      this._renderQuestPills(this.goQuestsListEl, mergedQuests, info.runMetrics || null, completedIds);

      if (this.btnShareRun) {
        this.btnShareRun.textContent = 'SHARE';
      }

      const points = info.runHighlights || info.trailPoints || [];
      renderRunConstellation(
        points,
        this.goConstellationCanvas?.getContext('2d'),
        { w: 360, h: 120 },
        true
      );
      this._showScreen(GAME_STATES.GAMEOVER);
    }
  }

  async shareRunCard() {
    const info = this.lastGameOverInfo;
    if (!info) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep abyss gradient backdrop
    const bg = ctx.createLinearGradient(0, 0, 800, 440);
    bg.addColorStop(0, '#040a1a');
    bg.addColorStop(0.55, '#081733');
    bg.addColorStop(1, '#050c20');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 440);

    // Bioluminescent radial highlights
    const glowL = ctx.createRadialGradient(180, 140, 10, 180, 140, 260);
    glowL.addColorStop(0, 'rgba(95, 247, 235, 0.22)');
    glowL.addColorStop(1, 'rgba(95, 247, 235, 0)');
    ctx.fillStyle = glowL;
    ctx.fillRect(0, 0, 800, 440);

    const glowR = ctx.createRadialGradient(640, 310, 10, 640, 310, 240);
    glowR.addColorStop(0, 'rgba(255, 225, 130, 0.16)');
    glowR.addColorStop(1, 'rgba(255, 225, 130, 0)');
    ctx.fillStyle = glowR;
    ctx.fillRect(0, 0, 800, 440);

    // Outer glass border
    ctx.strokeStyle = 'rgba(120, 240, 235, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 764, 404);

    // Constellation panel on right half
    ctx.fillStyle = 'rgba(7, 16, 36, 0.55)';
    ctx.fillRect(420, 74, 340, 220);
    ctx.strokeStyle = 'rgba(120, 240, 235, 0.2)';
    ctx.strokeRect(420, 74, 340, 220);
    renderRunConstellation(
      info.runHighlights || info.trailPoints || [],
      ctx,
      { x: 420, y: 74, w: 340, h: 220 },
      false
    );

    // Header & score text
    const modeLabel = MODE_LABELS[info.mode] || 'ARCADE';
    ctx.fillStyle = '#8ef5ec';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(`LUMEN · SANCTUARY VOYAGE · ${modeLabel}`, 44, 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 62px sans-serif';
    ctx.fillText(Math.floor(info.score || 0).toLocaleString(), 44, 146);

    ctx.fillStyle = '#ffe699';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`${info.phaseName || 'First Spark'}`, 44, 182);

    if (info.spiritName) {
      ctx.fillStyle = 'rgba(205, 236, 248, 0.78)';
      ctx.font = '500 15px sans-serif';
      ctx.fillText(`Aspect: ${info.spiritName}`, 44, 212);
    }

    // Bottom stats strip
    const cells = [
      ['LEVEL', `LV ${info.level || 1}`],
      ['PEAK CHAIN', `x${info.peakChain || 1}`],
      ['PURGED', `${info.purgedCount || 0}`],
      ['ELITES', `${info.elitesDefeated || 0}`],
      ['TIME', formatDuration(info.time || 0)],
    ];
    cells.forEach(([lbl, val], idx) => {
      const cx = 44 + idx * 144;
      ctx.fillStyle = 'rgba(13, 25, 52, 0.72)';
      ctx.fillRect(cx, 322, 132, 70);
      ctx.strokeStyle = 'rgba(130, 225, 235, 0.18)';
      ctx.strokeRect(cx, 322, 132, 70);
      ctx.fillStyle = 'rgba(185, 220, 238, 0.68)';
      ctx.font = '600 11px sans-serif';
      ctx.fillText(lbl, cx + 14, 346);
      ctx.fillStyle = '#f6fcff';
      ctx.font = '700 22px sans-serif';
      ctx.fillText(val, cx + 14, 376);
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    let label = 'CARD SAVED!';
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        label = 'COPIED PNG!';
      } else {
        throw new Error('Clipboard write unavailable');
      }
    } catch {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lumen-sanctuary-card.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    if (this.btnShareRun) {
      this.btnShareRun.textContent = label;
      if (this.shareResetTimer) window.clearTimeout(this.shareResetTimer);
      this.shareResetTimer = window.setTimeout(() => {
        if (this.btnShareRun) this.btnShareRun.textContent = 'SHARE';
      }, 2200);
    }
  }

  resetHUD(
    phaseCode,
    maxHealth = 100,
    maxDashes = 2,
    mode = GAME_MODES.ARCADE,
    { level = 1, exp = 0, expToNext = 45, abilityRanks = null, shield = 0, maxShield = 0 } = {}
  ) {
    if (maxHealth !== this.builtMaxHealth || maxDashes !== this.builtMaxDashes) {
      this._buildHudPips(maxHealth, maxDashes);
    }
    this.hudVM.reset({ maxHealth, maxDashes, mode, shield, maxShield });
    this.hudVM.phaseCode.value = phaseCode;
    this.hudVM.levelText.value = `LV ${level}`;
    const ratio = expToNext > 0 ? Math.min(1, Math.max(0, exp / expToNext)) : 0;
    this.hudVM.expRatio.value = ratio;

    this.lastHealth = -1;
    this.lastMaxHealth = -1;
    this._syncHpBar(maxHealth, maxHealth, false);
    this._syncShieldBar(shield, maxShield);
    this.scoreEl.textContent = '0';
    this.phaseEl.textContent = phaseCode;

    if (this.hudLevelEl && this.hudExpFillEl) {
      this.hudLevelEl.textContent = `LV ${level}`;
      this.hudExpFillEl.style.transform = `scaleX(${Math.max(0.01, ratio)})`;
    }

    if (this.hudLoadoutEl) {
      this.hudLoadoutEl._loadoutSig = null;
      this.renderLoadoutBar(this.hudLoadoutEl, abilityRanks);
    }

    if (this.hudModeRow && this.hudModeTag) {
      const showMode = mode !== GAME_MODES.ARCADE;
      this.hudModeTag.textContent = MODE_LABELS[mode] || 'ARCADE';
      this.hudModeTag.classList.toggle('is-daily', mode === GAME_MODES.DAILY);
      this.hudModeTag.classList.toggle('hidden', !showMode);
      this.hudModeRow.classList.toggle('hidden', !showMode);
    }
  }

  updateHUD(
    dt,
    {
      score,
      health,
      maxHealth = 100,
      shield = 0,
      maxShield = 0,
      maxDashes,
      dashCharges,
      dashRechargeProgress,
      phaseCode,
      mode = GAME_MODES.ARCADE,
      level = 1,
      exp = 0,
      expToNext = 45,
      abilityRanks = null,
      minimap = null,
    }
  ) {
    if (
      maxHealth !== this.builtMaxHealth ||
      (maxDashes !== undefined && maxDashes !== this.builtMaxDashes)
    ) {
      this._buildHudPips(maxHealth, maxDashes ?? this.builtMaxDashes);
    }

    this.hudVM.updateFrame(dt, {
      score,
      health,
      maxHealth,
      shield,
      maxShield,
      maxDashes: maxDashes ?? this.builtMaxDashes,
      dashCharges,
      dashRechargeProgress,
      phaseCode,
      mode,
      level,
      exp,
      expToNext,
    });

    if (abilityRanks) {
      this.renderLoadoutBar(this.hudLoadoutEl, abilityRanks);
    }

    if (this.hudModeTag) {
      this.hudModeTag.classList.toggle('is-daily', mode === GAME_MODES.DAILY);
    }

    if (health !== this.lastHealth || maxHealth !== this.lastMaxHealth) {
      this._syncHpBar(health, maxHealth, this.lastHealth >= 0);
    }

    for (let i = 0; i < this.dashPips.length; i++) {
      const { pip, fill } = this.dashPips[i];
      if (i < dashCharges) {
        pip.classList.add('ready');
        fill.style.transform = 'scaleX(1)';
      } else if (i === dashCharges) {
        pip.classList.remove('ready');
        fill.style.transform = `scaleX(${Math.max(0.04, dashRechargeProgress)})`;
      } else {
        pip.classList.remove('ready');
        fill.style.transform = 'scaleX(0)';
      }
    }

    if (this.isTouchMode) {
      this.touchDashBtn.classList.toggle('hidden', false);
      this.touchDashBtn.classList.toggle('depleted', dashCharges <= 0);
    }

    if (minimap) {
      renderMinimap(this.hudMinimapCanvas, this.hudMinimapCtx, minimap);
    }
  }

  _syncHpBar(health, maxHealth, animate = false) {
    const safeMax = Math.max(1, Math.round(maxHealth || 100));
    const cur = Math.max(0, Math.min(safeMax, Math.round(health ?? safeMax)));
    const ratio = cur / safeMax;

    this.hudVM.syncHealth(health ?? safeMax, safeMax);

    if (this.hpTextEl) {
      this.hpTextEl.textContent = `${cur} / ${safeMax}`;
    }
    if (this.hpFillEl) {
      this.hpFillEl.style.transform = `scaleX(${ratio})`;
    }
    if (this.hpBarEl) {
      this.hpBarEl.setAttribute('aria-valuenow', String(cur));
      this.hpBarEl.setAttribute('aria-valuemax', String(safeMax));
      this.hpBarEl.classList.toggle('is-warn', ratio <= 0.55 && ratio > 0.3);
      this.hpBarEl.classList.toggle('is-low', cur > 0 && ratio <= 0.3);

      if (animate && this.lastHealth >= 0 && cur !== this.lastHealth) {
        this.hpBarEl.classList.remove('is-hurt', 'is-heal');
        void this.hpBarEl.offsetWidth;
        const flashClass = cur < this.lastHealth ? 'is-hurt' : 'is-heal';
        this.hpBarEl.classList.add(flashClass);
        clearTimeout(this._hpFlashTimer);
        this._hpFlashTimer = setTimeout(() => {
          this.hpBarEl?.classList.remove('is-hurt', 'is-heal');
        }, 430);
      }
    }

    this.lastHealth = cur;
    this.lastMaxHealth = safeMax;
  }

  _syncShieldBar(shield = 0, maxShield = 0) {
    this.hudVM.syncShield(shield, maxShield);
    if (!this.shieldWrapEl) return;
    const hasShield = maxShield > 0;
    this.shieldWrapEl.classList.toggle('hidden', !hasShield);
    if (!hasShield) return;
    const safeMax = Math.max(1, Math.round(maxShield));
    const cur = Math.max(0, Math.min(safeMax, Math.round(shield)));
    if (this.shieldTextEl) {
      this.shieldTextEl.textContent = `${cur} / ${safeMax}`;
    }
    if (this.shieldFillEl) {
      this.shieldFillEl.style.transform = `scaleX(${cur / safeMax})`;
    }
  }

  showPhaseBanner(phase) {
    if (this.bannerTimeout) window.clearTimeout(this.bannerTimeout);
    this.phaseBannerSub.textContent = phase.subtitle;
    this.phaseBannerTitle.textContent = phase.name;
    this.phaseBanner.classList.add('hidden');
    void this.phaseBanner.offsetWidth;
    this.phaseBanner.classList.remove('hidden');
    this.bannerTimeout = window.setTimeout(() => {
      this.phaseBanner.classList.add('hidden');
    }, 2800);
  }

  showTutorialStep(stepNum, totalSteps, text) {
    this.tutorialBadge.textContent = `TIP ${stepNum}/${totalSteps}`;
    this.tutorialText.textContent = text;
    this.tutorialToast.classList.remove('hidden');
  }

  hideTutorial() {
    this.tutorialToast.classList.add('hidden');
  }
}
