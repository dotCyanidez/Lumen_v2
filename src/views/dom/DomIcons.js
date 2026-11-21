import { GAME_MODES } from '../../core/Constants.js';

export const SVG_MIXER = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><circle cx="9" cy="7" r="2.2" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="10" cy="17" r="2.2" fill="currentColor"/></svg>`;

export const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="17" height="17"><rect x="6" y="5" width="4.2" height="14" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4" fill="currentColor" stroke="none"/></svg>`;

export const ABILITY_ICONS = {
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

export const MODE_LABELS = {
  [GAME_MODES.ARCADE]: 'ARCADE',
  [GAME_MODES.DAILY]: 'DAILY TIDE',
  [GAME_MODES.ZEN]: 'ZEN FLOW',
};

export const TALENT_GLYPHS = {
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

export const CRYSTAL_POINTS = [
  '46,7 50.5,12 46,17 41.5,12',
  '80,41.5 85,46 80,50.5 75,46',
  '46,75 50.5,80 46,85 41.5,80',
  '12,41.5 17,46 12,50.5 7,46',
];

export function buildTalentRingSvg(level, maxLevel) {
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

export function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
