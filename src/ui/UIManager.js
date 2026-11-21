import {
  ABILITY_EVOLUTIONS,
  ABILITY_TALENT_GROUPS,
  ABILITY_TALENTS_BY_ID,
  DIFFICULTIES_BY_ID,
  GAME_MODES,
  GAME_STATES,
  MAX_ABILITY_SLOTS,
  RANK_MEDALS,
  SANCTUARY_UPGRADES,
  SPIRIT_ASPECTS,
  SPIRIT_PALETTES,
  SPIRIT_TRAILS,
  getAbilityInfo,
  getAbilityModifierLines,
} from '../core/Constants.js';
import { formatDuration } from '../core/MathUtils.js';

const SVG_MIXER = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><circle cx="9" cy="7" r="2.2" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="10" cy="17" r="2.2" fill="currentColor"/></svg>`;

const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="17" height="17"><rect x="6" y="5" width="4.2" height="14" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4" fill="currentColor" stroke="none"/></svg>`;

const ABILITY_ICONS = {
  resonant_volley: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z" fill="currentColor" fill-opacity="0.22"/></svg>`,
  solar_orbitals: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7.5" stroke-dasharray="3 2.5"/><circle cx="12" cy="4.5" r="2" fill="currentColor"/><circle cx="12" cy="19.5" r="2" fill="currentColor"/></svg>`,
  voltaic_chain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 5 13 12 13 11 22 19 11 12 11 13 2"/></svg>`,
  astral_pulse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="6.5" opacity="0.75"/><circle cx="12" cy="12" r="10" opacity="0.4"/></svg>`,
  seeker_barrage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 7l6 5-6 5"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="7" cy="17" r="1.5" fill="currentColor"/></svg>`,
  starbloom_spores: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2.4" fill="currentColor"/><circle cx="12" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><circle cx="15.5" cy="17.5" r="2"/><circle cx="8.5" cy="17.5" r="2"/><circle cx="6" cy="10" r="2"/></svg>`,
  celestial_spear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="20" x2="20" y2="4"/><polyline points="12 4 20 4 20 12"/></svg>`,
  gravity_harvest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6v5a6 6 0 0 0 12 0V6"/><line x1="6" y1="5" x2="6" y2="7"/><line x1="18" y1="5" x2="18" y2="7"/></svg>`,
  aegis_bloom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z" fill="currentColor" fill-opacity="0.16"/></svg>`,
  astral_shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="12 3 19.5 7.5 19.5 16.5 12 21 4.5 16.5 4.5 7.5" fill="currentColor" fill-opacity="0.16"/><circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity="0.45"/></svg>`,
  echo_conduit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
};

const MODE_LABELS = {
  [GAME_MODES.ARCADE]: 'ARCADE',
  [GAME_MODES.DAILY]: 'DAILY TIDE',
  [GAME_MODES.ZEN]: 'ZEN FLOW',
};

const TALENT_GLYPHS = {
  blast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>`,
  burn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3c2.5 3.4 5 5.8 5 9.2a5 5 0 1 1-10 0c0-2 1-3.8 2.2-5.2.3 1.4 1.3 2.2 2.2 2.5C11 7 11.4 4.8 12 3z" fill="currentColor" fill-opacity="0.22"/></svg>`,
  chain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="14 3 6 13 12 13 10 21 18 11 12 11 14 3"/></svg>`,
  force: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6M9 6l-6 6 6 6"/></svg>`,
  prism: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="12 4 20 18 4 18" fill="currentColor" fill-opacity="0.18"/><line x1="12" y1="4" x2="12" y2="18"/></svg>`,
  hoard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><polygon points="12 3 19 9 16 20 8 20 5 9" fill="currentColor" fill-opacity="0.18"/></svg>`,
  tempo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9.5-4-1.9-7-5-7-9.5V6z" fill="currentColor" fill-opacity="0.18"/><path d="M9 12l2 2 4-4"/></svg>`,
  zone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="15" rx="8" ry="4" fill="currentColor" fill-opacity="0.16"/><ellipse cx="12" cy="15" rx="4.5" ry="2.2"/><path d="M9 9.5c0-1.5 1.5-2.5 1.5-4M15 9.5c0-1.5-1.5-2.5-1.5-4" stroke-linecap="round"/></svg>`,
};

const CRYSTAL_POINTS = [
  '46,7 50.5,12 46,17 41.5,12',
  '80,41.5 85,46 80,50.5 75,46',
  '46,75 50.5,80 46,85 41.5,80',
  '12,41.5 17,46 12,50.5 7,46',
];

function buildTalentRingSvg(level, maxLevel) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const ratio = maxLevel > 0 ? Math.min(1, Math.max(0, level / maxLevel)) : 0;
  const litLen = c * ratio;
  const maxed = level >= maxLevel && maxLevel > 0;
  const strokeColor = maxed ? '#ffe699' : '#5ff7eb';

  // Four crystal thresholds clockwise from top: 0+, 25%, 50%, 75%
  const crystals = CRYSTAL_POINTS.map((pts, idx) => {
    const threshold = idx * 0.25;
    const isLit = idx === 0 ? ratio > 0 : ratio >= threshold;
    return `<polygon class="fork-ring-crystal${isLit ? ' is-lit' : ''}" points="${pts}" />`;
  }).join('');

  return `
    <svg class="fork-node-svg${maxed ? ' is-maxed is-active' : level > 0 ? ' is-unlocked' : ''}" viewBox="0 0 92 92" aria-hidden="true">
      <circle class="fork-ring-track" cx="46" cy="46" r="${r}" />
      ${
        ratio > 0
          ? `<circle class="fork-ring-progress" cx="46" cy="46" r="${r}" stroke="${strokeColor}" stroke-dasharray="${litLen.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 46 46)" />`
          : ''
      }
      ${crystals}
    </svg>
  `;
}

function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

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
    this.activeSanctuaryTab = 'upgrades';
    this.sanctuaryPanelEl = document.querySelector('#screen-sanctuary .sanctuary-panel');
    this.selectedTalentGroupId = 'resonant_volley';
    this.selectedTalentId = null;
    this._lastSanctuaryInfo = null;

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
    this.banishMode = false;
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

    this.dashPips = [];
    this.builtMaxHealth = 100;
    this.builtMaxDashes = 2;
    this._buildHudPips(100, 2);

    this.displayedScore = 0;
    this.targetScore = 0;
    this.lastHealth = -1;
    this.lastMaxHealth = -1;
    this.bannerTimeout = null;
    this.guideReturnState = GAME_STATES.TITLE;
    this.settingsReturnState = GAME_STATES.TITLE;
    this.isTouchMode = false;
    this.lastGameOverInfo = null;
    this.shareResetTimer = null;

    this._bindEvents();
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
    document.getElementById('btn-sanctuary-close')?.addEventListener('click', () => {
      this.callbacks.onUIClick();
      this.closeSanctuary();
    });
    for (const tabBtn of this.sanctuaryTabs) {
      tabBtn.addEventListener('click', () => {
        this.callbacks.onUIClick();
        this._setSanctuaryTab(tabBtn.dataset.tab);
      });
    }
    this.btnBlessingReroll?.addEventListener('click', () => {
      this._onReroll?.();
    });
    this.btnBlessingBanish?.addEventListener('click', () => {
      if (this.btnBlessingBanish.disabled) return;
      this.callbacks.onUIClick();
      this.banishMode = !this.banishMode;
      this._syncBanishModeUI();
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
      .addEventListener('click', click(this.callbacks.onReturnTitle));

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

  syncPreferences({
    sfxVolume = 0.85,
    ambientVolume = 0.75,
    cursorGlide = false,
    gameMode = GAME_MODES.ARCADE,
    bloomLevel = 0.65,
    screenShake = true,
    tutorialCompleted = false,
  }) {
    const sfx = Math.max(0, Math.min(1, sfxVolume));
    const amb = Math.max(0, Math.min(1, ambientVolume));
    const bloom = Math.max(0, Math.min(1, bloomLevel));

    const sfxPct = Math.round(sfx * 100);
    const ambPct = Math.round(amb * 100);
    const bloomPct = Math.round(bloom * 100);

    for (const slider of this.sfxSliders) {
      slider.value = String(sfxPct);
      slider.style.setProperty('--val', `${sfxPct}%`);
    }
    for (const slider of this.ambientSliders) {
      slider.value = String(ambPct);
      slider.style.setProperty('--val', `${ambPct}%`);
    }
    for (const lbl of this.sfxValLabels) {
      lbl.textContent = sfxPct === 0 ? 'OFF' : `${sfxPct}%`;
    }
    for (const lbl of this.ambientValLabels) {
      lbl.textContent = ambPct === 0 ? 'OFF' : `${ambPct}%`;
    }

    if (this.bloomSlider) {
      this.bloomSlider.value = String(bloomPct);
      this.bloomSlider.style.setProperty('--val', `${bloomPct}%`);
    }
    if (this.bloomValLabel) {
      this.bloomValLabel.textContent = bloomPct === 0 ? 'OFF' : `${bloomPct}%`;
    }

    const allMuted = sfxPct === 0 && ambPct === 0;
    this.btnSettingsMute?.classList.toggle('is-on', allMuted);
    if (this.lblSettingsMute) {
      this.lblSettingsMute.textContent = allMuted ? 'MUTE ALL (M): ON' : 'MUTE ALL (M): OFF';
    }

    this.btnSettingsGlide?.classList.toggle('is-on', cursorGlide);
    if (this.lblSettingsGlide) this.lblSettingsGlide.textContent = cursorGlide ? 'HOVER' : 'HOLD';

    this.btnSettingsShake?.classList.toggle('is-on', screenShake);
    if (this.lblSettingsShake) this.lblSettingsShake.textContent = screenShake ? 'ON' : 'OFF';

    const showTips = !tutorialCompleted;
    this.btnSettingsTips?.classList.toggle('is-on', showTips);
    if (this.lblSettingsTips) this.lblSettingsTips.textContent = showTips ? 'ON NEXT RUN' : 'COMPLETED';

    const modeLabel = MODE_LABELS[gameMode] || 'ARCADE';
    const isAltMode = gameMode !== GAME_MODES.ARCADE;
    this.btnSettingsMode?.classList.toggle('is-on', isAltMode);
    if (this.lblSettingsMode) this.lblSettingsMode.textContent = modeLabel;
    for (const btn of this.titleModeButtons) {
      btn.classList.toggle('active', btn.dataset.mode === gameMode);
    }
  }

  renderTitleMeta({
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
  }) {
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
        const bonusPct = Math.min(60, Math.max(0, (dailyStreak - 1) * 15));
        this.titleStreakVal.textContent = bonusPct > 0 ? `${dailyStreak}D (+${bonusPct}%)` : `${dailyStreak}D`;
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
    if (banishesLeft <= 0) this.banishMode = false;
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
    this.banishMode = false;

    if (this.blessingEyebrowEl) {
      this.blessingEyebrowEl.textContent =
        eyebrow || (level ? `RESONANCE LEVEL ${level}` : 'RESONANCE LEVEL UP');
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
      const rarityTag =
        rarity === 'epic'
          ? 'EPIC · '
          : rarity === 'rare'
            ? 'RARE · '
            : rarity === 'uncommon'
              ? 'UNCOMMON · '
              : '';
      const rankLabel = isNew ? 'NEW' : `${rarityTag}LV ${nextRank}`;
      const rankCls = isNew ? '' : `is-${rarity}`;
      const displayTitle = blessing.title || blessing.name || '';

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
      const hintsHtml =
        hintLines.length > 0 ? `<div class="blessing-card-hints">${hintLines.join('')}</div>` : '';

      card.innerHTML = `
        <div class="blessing-card-head">
          <span class="blessing-card-tag">${blessing.tag}</span>
          <div class="blessing-card-badges">
            <span class="blessing-card-rank ${rankCls}">${rankLabel}</span>
            <span class="blessing-card-key">${idx + 1}</span>
          </div>
        </div>
        <div class="blessing-card-title">${displayTitle}</div>
        <div class="blessing-card-desc">${blessing.desc}</div>
        ${hintsHtml}
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
    this.banishMode = false;
    this.blessingTooltipEl?.classList.add('hidden');
    this.screens.blessing.classList.remove('active');
    this.screens.blessing.classList.add('hidden');
    this.screens.blessing.setAttribute('aria-hidden', 'true');
    if (this.hud && document.querySelector('#screen-gameover.hidden') && document.querySelector('#screen-title.hidden')) {
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
    this._showScreen('settings');
  }

  closeSettings() {
    this._showScreen(this.settingsReturnState);
  }

  isSettingsOpen() {
    return Boolean(this.screens.settings?.classList.contains('active'));
  }

  openSanctuary() {
    this._showScreen('sanctuary');
  }

  closeSanctuary() {
    this._showScreen(GAME_STATES.TITLE);
  }

  isSanctuaryOpen() {
    return Boolean(this.screens.sanctuary?.classList.contains('active'));
  }

  resetSanctuarySelection() {
    this.selectedTalentGroupId = 'resonant_volley';
    this.selectedTalentId = null;
  }

  _setSanctuaryTab(tabName) {
    this.activeSanctuaryTab = tabName || 'upgrades';
    this.sanctuaryPanelEl?.classList.toggle('is-tree-mode', this.activeSanctuaryTab === 'talents');
    for (const btn of this.sanctuaryTabs) {
      btn.classList.toggle('active', btn.dataset.tab === this.activeSanctuaryTab);
    }
    for (const [key, pane] of Object.entries(this.sanctuaryPanes)) {
      if (!pane) continue;
      const on = key === this.activeSanctuaryTab;
      pane.classList.toggle('hidden', !on);
      pane.classList.toggle('active', on);
    }
  }

  _makeSanctuaryCard({
    title,
    desc,
    badge = '',
    swatches = [],
    pips = null,
    btnText,
    disabled = false,
    equipped = false,
    onAction,
  }) {
    const card = document.createElement('div');
    card.className = `sanctuary-item${equipped ? ' is-equipped' : ''}`;

    const head = document.createElement('div');
    head.className = 'sanctuary-item-head';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'sanctuary-item-titlewrap';
    for (const hex of swatches) {
      const dot = document.createElement('span');
      dot.className = 'sanctuary-swatch';
      dot.style.background = hexToCss(hex);
      dot.style.boxShadow = `0 0 8px ${hexToCss(hex)}`;
      titleWrap.appendChild(dot);
    }
    const nameEl = document.createElement('span');
    nameEl.className = 'sanctuary-item-name';
    nameEl.textContent = title;
    titleWrap.appendChild(nameEl);
    head.appendChild(titleWrap);

    if (badge) {
      const badgeEl = document.createElement('span');
      badgeEl.className = 'sanctuary-item-badge';
      badgeEl.textContent = badge;
      head.appendChild(badgeEl);
    }

    const descEl = document.createElement('div');
    descEl.className = 'sanctuary-item-desc';
    descEl.textContent = desc;

    const foot = document.createElement('div');
    foot.className = 'sanctuary-item-foot';
    if (pips) {
      if (pips.total > 8) {
        const barWrap = document.createElement('div');
        barWrap.className = 'sanctuary-bar-wrap';
        const pct = Math.min(100, Math.round((pips.filled / pips.total) * 100));
        barWrap.innerHTML = `
          <div class="sanctuary-bar"><span class="sanctuary-bar-fill" style="width:${pct}%"></span></div>
          <span class="sanctuary-bar-label">${pips.filled}/${pips.total}</span>
        `;
        foot.appendChild(barWrap);
      } else {
        const pipRow = document.createElement('div');
        pipRow.className = 'sanctuary-pips';
        for (let i = 0; i < pips.total; i++) {
          const p = document.createElement('span');
          p.className = `sanctuary-pip${i < pips.filled ? ' filled' : ''}`;
          pipRow.appendChild(p);
        }
        foot.appendChild(pipRow);
      }
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sanctuary-buy-btn${equipped ? ' is-active' : ''}`;
    btn.textContent = btnText;
    btn.disabled = disabled;
    if (!disabled) {
      btn.addEventListener('click', onAction);
    }
    foot.appendChild(btn);

    card.append(head, descEl, foot);
    return card;
  }

  _renderTalentsTree({
    luminance = 0,
    selectedStartAbility = 'resonant_volley',
    unlockedStartAbilities = ['resonant_volley'],
    talentRanks = {},
  }) {
    const groupId = ABILITY_TALENT_GROUPS.has(this.selectedTalentGroupId)
      ? this.selectedTalentGroupId
      : ABILITY_TALENT_GROUPS.keys().next().value;
    this.selectedTalentGroupId = groupId;
    const groupNodes = ABILITY_TALENT_GROUPS.get(groupId) || [];
    if (!groupNodes.some((n) => n.id === this.selectedTalentId)) {
      this.selectedTalentId = groupNodes[0]?.id || null;
    }

    const layout = document.createElement('div');
    layout.className = 'fork-tree-layout';

    // 1. Left Column: TALENT GROUPS
    const groupsCol = document.createElement('section');
    groupsCol.className = 'fork-col fork-groups-col';
    groupsCol.innerHTML = `<div class="fork-col-heading">TALENT GROUPS</div>`;
    const groupsList = document.createElement('div');
    groupsList.className = 'fork-groups-list';

    for (const [abId, nodes] of ABILITY_TALENT_GROUPS.entries()) {
      const info = getAbilityInfo(abId);
      const investedRanks = nodes.reduce(
        (sum, n) => sum + Math.max(0, Number(talentRanks?.[n.id]) || 0),
        0
      );
      const totalPossible = nodes.reduce((sum, n) => sum + (n.maxLevel || n.costs.length), 0);
      const hasAny = investedRanks > 0;
      const isStart = selectedStartAbility === abId;
      const isGroupSelected = abId === groupId;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.groupId = abId;
      btn.className = `fork-group-btn${isGroupSelected ? ' is-selected' : ''}${hasAny ? ' is-active' : ''}${isStart ? ' is-start' : ''}`;
      btn.setAttribute('aria-pressed', String(isGroupSelected));
      btn.innerHTML = `
        <span class="fork-group-icon">${ABILITY_ICONS[abId] || ABILITY_ICONS.resonant_volley}</span>
        <span class="fork-group-name">${info?.name || abId}</span>
        <span class="fork-group-meta">${isStart ? '<span class="fork-group-star" title="Start Ability">★</span>' : ''}<span>${investedRanks}/${totalPossible}</span></span>
      `;
      btn.addEventListener('click', () => {
        this.callbacks.onUIClick?.();
        this.selectedTalentGroupId = abId;
        this.selectedTalentId = nodes[0]?.id || null;
        if (this._lastSanctuaryInfo) this._renderTalentsTree(this._lastSanctuaryInfo);
      });
      groupsList.appendChild(btn);
    }
    groupsCol.appendChild(groupsList);

    // 2. Center Column: 5-node (1 -> 2 -> 2) TALENT TREE
    const treeCol = document.createElement('section');
    treeCol.className = 'fork-col fork-tree-col';
    const groupInfo = getAbilityInfo(groupId);
    const groupName = groupInfo?.name || groupId;
    const canStart = unlockedStartAbilities.includes(groupId);
    const isStartGroup = selectedStartAbility === groupId;

    const headRow = document.createElement('div');
    headRow.className = 'fork-col-headrow';
    headRow.innerHTML = `<div class="fork-col-heading">${groupName.toUpperCase()} · TALENT TREE</div>`;
    if (canStart) {
      const startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = `sanctuary-start-btn${isStartGroup ? ' is-active' : ''}`;
      startBtn.textContent = isStartGroup ? '★ START ABILITY' : 'SET START';
      startBtn.disabled = isStartGroup;
      startBtn.addEventListener('click', () => this.callbacks.onSelectStartAbility?.(groupId));
      headRow.appendChild(startBtn);
    } else {
      const lockNote = document.createElement('span');
      lockNote.className = 'sanctuary-start-lock';
      lockNote.textContent = 'Talent unlocks Start';
      headRow.appendChild(lockNote);
    }
    treeCol.appendChild(headRow);

    const SLOT_POS = {
      root: { xPct: 50, top: 10, svgX: 200, svgY: 41 },
      leftMid: { xPct: 26, top: 120, svgX: 104, svgY: 151 },
      rightMid: { xPct: 74, top: 120, svgX: 296, svgY: 151 },
      leftCap: { xPct: 26, top: 230, svgX: 104, svgY: 261 },
      rightCap: { xPct: 74, top: 230, svgX: 296, svgY: 261 },
    };

    const stage = document.createElement('div');
    stage.className = 'fork-tree-stage';

    const linkLines = groupNodes
      .filter((n) => n.requires)
      .map((n) => {
        const parent = groupNodes.find((p) => p.id === n.requires) || ABILITY_TALENTS_BY_ID[n.requires];
        const pPos = SLOT_POS[parent?.slot || 'root'];
        const cPos = SLOT_POS[n.slot || 'leftMid'];
        const pRank = Math.max(0, Number(talentRanks?.[parent?.id]) || 0);
        const cRank = Math.max(0, Number(talentRanks?.[n.id]) || 0);
        const parentMet = pRank >= (parent?.maxLevel || 1);
        const cls = parentMet && cRank > 0 ? 'is-active' : parentMet ? 'is-unlocked' : '';
        return `
          <line class="fork-link-glow ${cls}" x1="${pPos.svgX}" y1="${pPos.svgY}" x2="${cPos.svgX}" y2="${cPos.svgY}" vector-effect="non-scaling-stroke" />
          <line class="fork-link-line ${cls}" x1="${pPos.svgX}" y1="${pPos.svgY}" x2="${cPos.svgX}" y2="${cPos.svgY}" vector-effect="non-scaling-stroke" />
        `;
      })
      .join('');
    stage.innerHTML = `<svg class="fork-tree-svg" viewBox="0 0 400 340" preserveAspectRatio="none" aria-hidden="true">${linkLines}</svg>`;

    for (const t of groupNodes) {
      const pos = SLOT_POS[t.slot] || SLOT_POS.root;
      const maxLevel = t.maxLevel || t.costs.length;
      const level = Math.max(0, Math.min(maxLevel, Number(talentRanks?.[t.id]) || 0));
      const maxed = level >= maxLevel;
      const reqNode = t.requires ? ABILITY_TALENTS_BY_ID[t.requires] : null;
      const reqRank = reqNode ? Math.max(0, Number(talentRanks?.[reqNode.id]) || 0) : 0;
      const needed = reqNode ? reqNode.maxLevel : 0;
      const prereqMet = !reqNode || reqRank >= needed;
      const isSelected = t.id === this.selectedTalentId;
      const glyph = TALENT_GLYPHS[t.glyph] || ABILITY_ICONS[groupId] || ABILITY_ICONS.resonant_volley;

      const nodeBtn = document.createElement('button');
      nodeBtn.type = 'button';
      nodeBtn.dataset.talentId = t.id;
      nodeBtn.dataset.slot = t.slot;
      nodeBtn.style.left = `${pos.xPct}%`;
      nodeBtn.style.top = `${pos.top}px`;
      nodeBtn.className = `fork-tree-node${isSelected ? ' is-selected' : ''}${level > 0 ? ' is-unlocked' : ''}${maxed ? ' is-active is-maxed' : ''}${!prereqMet ? ' is-locked-node' : ''}`;
      nodeBtn.setAttribute('aria-pressed', String(isSelected));
      nodeBtn.innerHTML = `
        <div class="fork-node-ring-wrap">
          ${buildTalentRingSvg(level, maxLevel)}
          <div class="fork-node-circle">${glyph}</div>
        </div>
        <div class="fork-node-name">${t.name}</div>
        <div class="fork-node-level">Level ${level} / ${maxLevel}</div>
      `;
      nodeBtn.addEventListener('click', () => {
        this.callbacks.onUIClick?.();
        this.selectedTalentId = t.id;
        if (this._lastSanctuaryInfo) this._renderTalentsTree(this._lastSanctuaryInfo);
      });
      stage.appendChild(nodeBtn);
    }
    treeCol.appendChild(stage);

    // 3. Right Column: SELECTED TALENT Detail Panel
    const detailCol = document.createElement('section');
    detailCol.className = 'fork-col fork-detail-col';
    detailCol.innerHTML = `<div class="fork-col-heading">SELECTED TALENT</div>`;

    const sel = groupNodes.find((n) => n.id === this.selectedTalentId) || groupNodes[0];
    if (sel) {
      const maxLevel = sel.maxLevel || sel.costs.length;
      const level = Math.max(0, Math.min(maxLevel, Number(talentRanks?.[sel.id]) || 0));
      const maxed = level >= maxLevel;
      const reqNode = sel.requires ? ABILITY_TALENTS_BY_ID[sel.requires] : null;
      const reqRank = reqNode ? Math.max(0, Number(talentRanks?.[reqNode.id]) || 0) : 0;
      const needed = reqNode ? reqNode.maxLevel : 0;
      const prereqMet = !reqNode || reqRank >= needed;
      const nextCost = maxed ? 0 : sel.costs[level];
      const canBuy = !maxed && prereqMet && luminance >= nextCost;

      const statusText = maxed
        ? 'MAXED'
        : !prereqMet
          ? 'LOCKED'
          : level > 0
            ? `RANK ${level}/${maxLevel}`
            : 'AVAILABLE';
      const statusCls = maxed ? 'is-active' : level > 0 ? 'is-unlocked' : '';
      const shortfall =
        !maxed && prereqMet && luminance < nextCost
          ? ` Need ${(nextCost - luminance).toLocaleString()} more LUM.`
          : '';

      const card = document.createElement('div');
      card.className = `fork-detail-card${maxed ? ' is-active' : level > 0 ? ' is-unlocked' : ''}`;

      const pipsHtml = Array.from({ length: maxLevel }, (_, idx) =>
        `<span class="sanctuary-pip${idx < level ? ' filled' : ''}"></span>`
      ).join('');

      const currentHtml =
        level > 0
          ? `<div class="fork-detail-next is-current">
              <div class="fork-detail-next-label">ACTIVE BONUS</div>
              <div class="fork-detail-next-text">${sel.rankText(level)}</div>
            </div>`
          : '';

      const nextHeading = maxed ? 'STATUS' : !prereqMet ? 'REQUIREMENT' : `NEXT (LEVEL ${level + 1} / ${maxLevel})`;
      let nextBody;
      if (maxed) {
        nextBody = `Max Level reached · Full celestial potency active on ${groupName}.`;
      } else if (!prereqMet) {
        nextBody = `Requires ${reqNode.name} Level ${needed} (${reqRank}/${needed}). Next rank: ${sel.rankText(level + 1)}.`;
      } else {
        const startNote =
          sel.slot === 'root' && level === 0
            ? ` Unlocks ${groupName} as a Start Ability.`
            : '';
        nextBody = `${sel.rankText(level + 1)} · Cost: ${nextCost.toLocaleString()} LUM.${startNote}${shortfall}`;
      }

      card.innerHTML = `
        <div class="fork-detail-head">
          <span class="fork-detail-group">${groupName.toUpperCase()}</span>
          <span class="fork-detail-status ${statusCls}">${statusText}</span>
        </div>
        <h3 class="fork-detail-title">${sel.name}</h3>
        <div class="fork-detail-level-row">
          <span class="fork-detail-level">Level ${level} / ${maxLevel}</span>
          <div class="sanctuary-pips">${pipsHtml}</div>
        </div>
        <p class="fork-detail-desc">${sel.desc}</p>
        ${currentHtml}
        <div class="fork-detail-next">
          <div class="fork-detail-next-label">${nextHeading}</div>
          <div class="fork-detail-next-text">${nextBody}</div>
        </div>
      `;

      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = `sanctuary-buy-btn fork-detail-action${maxed ? ' is-active' : ''}`;
      actionBtn.textContent = maxed
        ? 'MAXED'
        : !prereqMet
          ? `LOCKED (${reqNode.name} Lv ${needed})`
          : `UPGRADE  ${nextCost.toLocaleString()} LUM`;
      actionBtn.disabled = !canBuy;
      if (canBuy) {
        actionBtn.addEventListener('click', () => this.callbacks.onTalentAction?.(sel.id));
      }
      card.appendChild(actionBtn);
      detailCol.appendChild(card);
    }

    layout.append(groupsCol, treeCol, detailCol);
    this.sanctuaryTalentsEl.innerHTML = '';
    this.sanctuaryTalentsEl.appendChild(layout);
  }

  renderSanctuary(payload = {}) {
    this._lastSanctuaryInfo = payload;
    const {
      luminance = 0,
      lifetimeLuminance = luminance,
      selectedSpirit = 'wisp',
      selectedStartAbility = 'resonant_volley',
      unlockedStartAbilities = ['resonant_volley'],
      selectedTrail = 'mist',
      selectedPalette = 'default',
      upgrades = {},
      talentRanks = {},
      unlockedTrails = ['mist'],
      unlockedPalettes = ['default'],
    } = payload;
    this.sanctuaryPanelEl?.classList.toggle('is-tree-mode', this.activeSanctuaryTab === 'talents');
    if (this.sanctuaryLumBadgeEl) {
      this.sanctuaryLumBadgeEl.textContent = `${luminance.toLocaleString()} LUM`;
    }

    if (this.sanctuaryUpgradesEl) {
      this.sanctuaryUpgradesEl.innerHTML = '';
      for (const u of SANCTUARY_UPGRADES) {
        const rank = Math.max(0, Number(upgrades?.[u.id]) || 0);
        const maxed = rank >= u.costs.length;
        const cost = maxed ? 0 : u.costs[rank];
        const canBuy = !maxed && luminance >= cost;
        this.sanctuaryUpgradesEl.appendChild(
          this._makeSanctuaryCard({
            title: u.name,
            desc: u.desc,
            badge: rank > 0 ? u.effectLabel(rank) : `RANK 0/${u.costs.length}`,
            pips: { total: u.costs.length, filled: rank },
            btnText: maxed ? 'MAXED' : `${cost.toLocaleString()} LUM`,
            disabled: maxed || !canBuy,
            equipped: maxed,
            onAction: () => this.callbacks.onUpgradeSanctuary?.(u.id),
          })
        );
      }
    }

    if (this.sanctuaryTalentsEl) {
      this._renderTalentsTree({
        luminance,
        selectedStartAbility,
        unlockedStartAbilities,
        talentRanks,
      });
    }

    if (this.sanctuaryTrailsEl) {
      this.sanctuaryTrailsEl.innerHTML = '';
      for (const tr of SPIRIT_TRAILS) {
        const unlocked = unlockedTrails.includes(tr.id);
        const equipped = selectedTrail === tr.id;
        const canBuy = unlocked || luminance >= tr.cost;
        this.sanctuaryTrailsEl.appendChild(
          this._makeSanctuaryCard({
            title: tr.name,
            desc: tr.desc,
            btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `${tr.cost} LUM`,
            disabled: equipped || !canBuy,
            equipped,
            onAction: () => this.callbacks.onSelectTrail?.(tr.id),
          })
        );
      }
    }

    if (this.sanctuaryPalettesEl) {
      this.sanctuaryPalettesEl.innerHTML = '';
      for (const pal of SPIRIT_PALETTES) {
        const unlocked = unlockedPalettes.includes(pal.id);
        const equipped = selectedPalette === pal.id;
        const canBuy = unlocked || luminance >= pal.cost;
        const swatches = pal.colorHex ? [pal.colorHex, pal.accentHex || pal.colorHex] : [0x5df7eb, 0xffe699];
        this.sanctuaryPalettesEl.appendChild(
          this._makeSanctuaryCard({
            title: pal.name,
            desc: pal.colorHex ? 'Applies across spirit aura & projectiles.' : 'Uses each Spirit aspect native colors.',
            swatches,
            btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `${pal.cost} LUM`,
            disabled: equipped || !canBuy,
            equipped,
            onAction: () => this.callbacks.onSelectPalette?.(pal.id),
          })
        );
      }
    }

    if (this.sanctuarySpiritsEl) {
      this.sanctuarySpiritsEl.innerHTML = '';
      for (const sp of SPIRIT_ASPECTS) {
        const unlocked = lifetimeLuminance >= sp.unlockLuminance;
        const equipped = unlocked && selectedSpirit === sp.id;
        this.sanctuarySpiritsEl.appendChild(
          this._makeSanctuaryCard({
            title: sp.name,
            desc: sp.desc,
            badge: sp.tag,
            swatches: [sp.colorHex, sp.accentHex || sp.colorHex],
            btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `🔒 ${sp.unlockLuminance} LIFE`,
            disabled: equipped || !unlocked,
            equipped,
            onAction: () => this.callbacks.onSelectSpirit?.(sp.id),
          })
        );
      }
    }
  }

  setGameState(state, info = {}) {
    if (state !== GAME_STATES.PLAYING) {
      this.hudMixerPopover?.classList.add('hidden');
    }

    if (state === GAME_STATES.PLAYING) {
      this._showScreen(null);
      this.hud.classList.remove('hidden');
      this.hud.setAttribute('aria-hidden', 'false');
      this.hudMinimap?.classList.remove('hidden');
      this.hudMinimap?.classList.toggle('has-touch-dash', this.isTouchMode);
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
      this.pauseScoreEl.textContent = Math.floor(info.score || 0).toLocaleString();
      this.pauseBestEl.textContent = (info.bestScore ?? info.highScore ?? 0).toLocaleString();
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
          .map(
            (s) =>
              `<span class="pause-synergy-pill" title="${s.desc}">◈ ${s.name}</span>`
          )
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

      const score = Math.floor(info.score || 0);
      const isDaily = info.mode === GAME_MODES.DAILY;
      const showBadge = Boolean(info.isNewRecord || info.isDailyRecord);
      this.goRecordBadge.textContent =
        isDaily && info.isDailyRecord && !info.isNewRecord
          ? '✦ DAILY TIDE RECORD ✦'
          : '✦ NEW SANCTUARY RECORD ✦';
      this.goRecordBadge.classList.toggle('hidden', !showBadge);

      this.goScoreEl.textContent = score.toLocaleString();
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
      this.goTimeEl.textContent = formatDuration(info.time ?? info.survivalTime ?? 0);

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
      this._renderDamageBreakdown(info);

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
      this._renderRunConstellation(points);
      this._showScreen(GAME_STATES.GAMEOVER);
    }
  }

  _renderDamageBreakdown(info) {
    if (!this.goDmgSection || !this.goDmgListEl || !this.goDmgDetailEl) return;
    this.goDmgExpanded = false;
    if (this.btnGoDmgDetails) {
      this.btnGoDmgDetails.textContent = 'DETAILED INFO';
      this.btnGoDmgDetails.setAttribute('aria-expanded', 'false');
    }
    this.goDmgDetailEl.classList.add('hidden');

    const report = info.damageReport;
    const entries = report?.entries || [];
    if (entries.length === 0) {
      this.goDmgSection.classList.add('hidden');
      return;
    }

    this.goDmgSection.classList.remove('hidden');
    this.goDmgListEl.innerHTML = '';
    for (const row of entries) {
      const ab = getAbilityInfo(row.abilityId);
      const item = document.createElement('div');
      item.className = 'go-dmg-row';
      item.innerHTML = `
        <span class="go-dmg-icon">${ABILITY_ICONS[row.abilityId] || ABILITY_ICONS.resonant_volley}</span>
        <span class="go-dmg-name">${ab?.name || row.abilityId}</span>
        <div class="go-dmg-bar"><span class="go-dmg-bar-fill" style="width:${Math.max(4, Math.min(100, row.rawPct || row.pct))}%"></span></div>
        <span class="go-dmg-pct">${row.pct}%</span>
      `;
      this.goDmgListEl.appendChild(item);
    }

    const metaBits = [];
    if (info.difficulty) metaBits.push(`Difficulty: ${info.difficulty.label}`);
    if (info.dailyTwist) metaBits.push(`Twist: ${info.dailyTwist.name}`);
    if (info.isFirstDailyDouble) metaBits.push(`First Daily 2× LUM (+${info.firstDailyBonusLum || 0})`);
    if ((info.bonusLuminance || 0) > 0) metaBits.push(`Shards & Events: +${info.bonusLuminance} LUM`);
    const syns = info.activeSynergies || [];
    const synHtml =
      syns.length > 0
        ? `<div class="go-dmg-synergies"><strong>Synergies:</strong> ${syns.map((s) => `${s.name}`).join(' · ')}</div>`
        : '';
    const detailRows = entries
      .map((row) => {
        const ab = getAbilityInfo(row.abilityId);
        const dotStr = row.dot > 0 ? ` (${row.dot} DoT)` : '';
        return `<div class="go-dmg-detail-row"><span>${ab?.name || row.abilityId}</span><span>${row.total} DMG${dotStr} · ${row.kills} kills · ${row.pct}%</span></div>`;
      })
      .join('');
    this.goDmgDetailEl.innerHTML = `
      <div class="go-dmg-detail-meta">Total Ability Damage: ${report.grandTotal} · ${metaBits.join(' · ')}</div>
      ${synHtml}
      <div class="go-dmg-detail-list">${detailRows}</div>
    `;
  }

  _renderRunConstellation(points, targetCtx = null, dims = { w: 360, h: 120 }) {
    const ctx = targetCtx || this.goConstellationCanvas?.getContext('2d');
    if (!ctx) return;

    const w = dims.w;
    const h = dims.h;
    if (!targetCtx) ctx.clearRect(0, 0, w, h);

    if (points.length < 2) {
      if (!targetCtx) {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 2, w * 0.5, h * 0.5, 42);
        g.addColorStop(0, 'rgba(95, 247, 235, 0.35)');
        g.addColorStop(1, 'rgba(95, 247, 235, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      return;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ox = dims.x || 0;
    const oy = dims.y || 0;
    const padX = Math.max(16, w * 0.08);
    const padY = Math.max(14, h * 0.14);

    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const frac = i / points.length;
      const x1 = ox + padX + a.nx * (w - padX * 2);
      const y1 = oy + padY + a.ny * (h - padY * 2);
      const x2 = ox + padX + b.nx * (w - padX * 2);
      const y2 = oy + padY + b.ny * (h - padY * 2);
      ctx.strokeStyle =
        b.gold || b.dashing
          ? `rgba(255, 229, 148, ${0.42 + frac * 0.5})`
          : `rgba(95, 247, 235, ${0.14 + frac * 0.48})`;
      ctx.lineWidth = b.gold || b.dashing ? 2.4 : 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const last = points[points.length - 1];
    const lx = ox + padX + last.nx * (w - padX * 2);
    const ly = oy + padY + last.ny * (h - padY * 2);
    const star = ctx.createRadialGradient(lx, ly, 1, lx, ly, 16);
    star.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
    star.addColorStop(0.4, 'rgba(95, 247, 235, 0.5)');
    star.addColorStop(1, 'rgba(95, 247, 235, 0)');
    ctx.fillStyle = star;
    ctx.beginPath();
    ctx.arc(lx, ly, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
    this._renderRunConstellation(info.runHighlights || info.trailPoints || [], ctx, {
      x: 420,
      y: 74,
      w: 340,
      h: 220,
    });

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
    this.displayedScore = 0;
    this.targetScore = 0;
    this.lastHealth = -1;
    this.lastMaxHealth = -1;
    this._syncHpBar(maxHealth, maxHealth, false);
    this._syncShieldBar(shield, maxShield);
    this.scoreEl.textContent = '0';
    this.phaseEl.textContent = phaseCode;

    if (this.hudLevelEl && this.hudExpFillEl) {
      this.hudLevelEl.textContent = `LV ${level}`;
      const ratio = expToNext > 0 ? Math.min(1, Math.max(0, exp / expToNext)) : 0;
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
      targetBest = 0,
      mode = GAME_MODES.ARCADE,
      level = 1,
      exp = 0,
      expToNext = 45,
      abilityRanks = null,
      minimap = null,
    }
  ) {
    if (maxHealth !== this.builtMaxHealth || (maxDashes !== undefined && maxDashes !== this.builtMaxDashes)) {
      this._buildHudPips(maxHealth, maxDashes ?? this.builtMaxDashes);
    }

    if (this.hudLevelEl && this.hudExpFillEl) {
      this.hudLevelEl.textContent = `LV ${level}`;
      const expRatio = expToNext > 0 ? Math.min(1, Math.max(0, exp / expToNext)) : 0;
      this.hudExpFillEl.style.transform = `scaleX(${Math.max(0.01, expRatio)})`;
    }

    if (abilityRanks) {
      this.renderLoadoutBar(this.hudLoadoutEl, abilityRanks);
    }

    this.targetScore = score;
    this.displayedScore += (this.targetScore - this.displayedScore) * (1 - Math.exp(-16 * dt));
    const shown =
      Math.abs(this.targetScore - this.displayedScore) < 1
        ? Math.floor(this.targetScore)
        : Math.floor(this.displayedScore);
    this.scoreEl.textContent = shown.toLocaleString();

    if (this.hudModeRow && this.hudModeTag) {
      const showMode = mode !== GAME_MODES.ARCADE;
      this.hudModeTag.classList.toggle('hidden', !showMode);
      this.hudModeRow.classList.toggle('hidden', !showMode);
    }

    this.phaseEl.textContent = phaseCode;

    if (health !== this.lastHealth || maxHealth !== this.lastMaxHealth) {
      this._syncHpBar(health, maxHealth, this.lastHealth >= 0);
    }
    this._syncShieldBar(shield, maxShield);

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
      this._renderMinimap(minimap);
    }
  }

  _syncHpBar(health, maxHealth, animate = false) {
    const safeMax = Math.max(1, Math.round(maxHealth || 100));
    const cur = Math.max(0, Math.min(safeMax, Math.round(health ?? safeMax)));
    const ratio = cur / safeMax;

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

  _renderMinimap(m) {
    const ctx = this.hudMinimapCtx;
    const canvas = this.hudMinimapCanvas;
    if (!ctx || !canvas) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const pad = 8;
    const mapW = cw - pad * 2;
    const mapH = ch - pad * 2;
    const sx = mapW / Math.max(1, m.worldW);
    const sy = mapH / Math.max(1, m.worldH);

    ctx.clearRect(0, 0, cw, ch);

    // Subtle deep background fill + world perimeter rectangle
    ctx.fillStyle = 'rgba(4, 10, 26, 0.65)';
    ctx.fillRect(pad, pad, mapW, mapH);

    // Subtle quadrant guide lines
    ctx.strokeStyle = 'rgba(95, 247, 235, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + mapW * 0.5, pad);
    ctx.lineTo(pad + mapW * 0.5, pad + mapH);
    ctx.moveTo(pad, pad + mapH * 0.5);
    ctx.lineTo(pad + mapW, pad + mapH * 0.5);
    ctx.stroke();

    // World outer border
    ctx.strokeStyle = 'rgba(95, 247, 235, 0.34)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, mapW, mapH);

    // Camera viewport frame clamped gently visually while preserving world-relative box
    const vx = pad + (m.camX - m.viewW * 0.5) * sx;
    const vy = pad + (m.camY - m.viewH * 0.5) * sy;
    const vw = m.viewW * sx;
    const vh = m.viewH * sy;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, mapW, mapH);
    ctx.clip();
    ctx.fillStyle = 'rgba(95, 247, 235, 0.06)';
    ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeStyle = 'rgba(190, 255, 248, 0.28)';
    ctx.lineWidth = 1.25;
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.restore();

    // Collectibles (motes, prisms, shards, constellation stars)
    const stars = [];
    for (const item of m.items) {
      const ix = pad + item.x * sx;
      const iy = pad + item.y * sy;
      if (item.type === 'star') {
        stars.push({ x: ix, y: iy, cid: item.constellationId });
      } else if (item.type === 'prism') {
        ctx.fillStyle = '#9efff5';
        ctx.beginPath();
        ctx.moveTo(ix, iy - 4.5);
        ctx.lineTo(ix + 4.5, iy);
        ctx.lineTo(ix, iy + 4.5);
        ctx.lineTo(ix - 4.5, iy);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'shard') {
        ctx.fillStyle = '#e2a6ff';
        ctx.beginPath();
        ctx.arc(ix, iy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = item.isGolden ? 'rgba(255, 227, 143, 0.85)' : 'rgba(125, 249, 255, 0.58)';
        ctx.beginPath();
        ctx.arc(ix, iy, item.isGolden ? 2.4 : 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (stars.length > 0) {
      if (stars.length > 1) {
        ctx.strokeStyle = 'rgba(255, 228, 147, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < stars.length; i++) {
          const s1 = stars[i];
          const s2 = stars[(i + 1) % stars.length];
          if (s1.cid === s2.cid) {
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
          }
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#ffe599';
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Enemies (highlight Eclipse Core boss prominently)
    for (const e of m.enemies) {
      if (e.x < -30 || e.x > m.worldW + 30 || e.y < -30 || e.y > m.worldH + 30) continue;
      const ex = pad + e.x * sx;
      const ey = pad + e.y * sy;
      if (e.kind === 'core' || e.isElite) {
        ctx.strokeStyle = e.isElite ? '#ffcf7d' : '#ff6b95';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ex, ey, 6.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = e.isElite ? '#ff4fa8' : '#ff2e6a';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const isSpecial = e.kind === 'warden' || e.kind === 'vortex' || e.kind === 'spitter' || e.kind === 'artillery';
        ctx.fillStyle =
          e.kind === 'spitter' || e.kind === 'artillery'
            ? 'rgba(218, 120, 255, 0.88)'
            : isSpecial
              ? 'rgba(255, 118, 92, 0.85)'
              : 'rgba(255, 62, 112, 0.72)';
        ctx.beginPath();
        ctx.arc(ex, ey, isSpecial ? 2.6 : 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spirit (Player) marker
    const px = pad + m.playerX * sx;
    const py = pad + m.playerY * sy;
    const spiritCss = hexToCss(m.spiritHex || 0x5ff7eb);
    ctx.fillStyle = spiritCss;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = spiritCss;
    ctx.lineWidth = 2;
    ctx.stroke();
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
