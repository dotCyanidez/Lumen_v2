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

export const TAROT_STAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.7 8.3L23 12l-8.3 2.7L12 23l-2.7-8.3L1 12l8.3-2.7z"/></svg>`;

export const TAROT_ASTROLABE_SVG = `<svg class="blessing-astrolabe" viewBox="0 0 200 200" fill="none" stroke="currentColor"><circle cx="100" cy="100" r="88" stroke-width="0.9" stroke-dasharray="3 6" opacity="0.55"/><circle cx="100" cy="100" r="74" stroke-width="1.3" opacity="0.72"/><circle cx="100" cy="100" r="56" stroke-width="0.8" stroke-dasharray="10 6" opacity="0.5"/><path d="M100 10v14M100 176v14M10 100h14M176 100h14" stroke-width="1.4" opacity="0.8"/><path d="M36 36l9 9M155 155l9 9M164 36l-9 9M45 155l-9 9" stroke-width="1" opacity="0.55"/><circle cx="100" cy="26" r="2.6" fill="currentColor"/><circle cx="100" cy="174" r="2.6" fill="currentColor"/><circle cx="26" cy="100" r="2.6" fill="currentColor"/><circle cx="174" cy="100" r="2.6" fill="currentColor"/></svg>`;

export const ABILITY_CARD_EMBLEMS = {
  resonant_volley: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><path d="M16 98L82 32" stroke="currentColor" stroke-width="11" stroke-linecap="round" opacity="0.22"/><path d="M16 98L82 32" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/><path d="M28 106L94 48" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.55"/><path d="M12 80L66 20" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.55"/><path d="M84 18L90 32L104 38L90 44L84 58L78 44L64 38L78 32Z" fill="#fff"/><path d="M24 90L82 32" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M96 42L100 48L106 50L100 52L96 58L94 52L88 50L94 48Z" fill="#fff" opacity="0.9"/><path d="M68 14L70 20L76 22L70 24L68 30L66 24L60 22L66 20Z" fill="#fff" opacity="0.9"/><circle cx="38" cy="76" r="2.6" fill="#fff" opacity="0.85"/><circle cx="54" cy="86" r="2.2" fill="currentColor"/></svg>`,
  solar_orbitals: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="60" rx="44" ry="26" transform="rotate(-24 60 60)" stroke="currentColor" stroke-width="2.2" opacity="0.55"/><path d="M22 76C14 58 34 36 62 32" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="0.9"/><path d="M98 44C106 62 86 84 58 88" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="0.9"/><path d="M22 66L31 74L22 86L13 74Z" fill="#fff"/><path d="M98 34L107 46L98 54L89 46Z" fill="#fff"/><path d="M60 47L63.5 56.5L73 60L63.5 63.5L60 73L56.5 63.5L47 60L56.5 56.5Z" fill="#fff" opacity="0.95"/></svg>`,
  voltaic_chain: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><path d="M68 14L34 62H58L46 106L88 54H62L68 14Z" stroke="currentColor" stroke-width="10" stroke-linejoin="round" opacity="0.22"/><path d="M68 14L34 62H58L46 106L88 54H62L68 14Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><path d="M65 22L41 58H60L51 96L80 58H61L65 22Z" fill="#fff"/></svg>`,
  astral_pulse: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="44" stroke="currentColor" stroke-width="2" opacity="0.38"/><circle cx="60" cy="60" r="30" stroke="currentColor" stroke-width="4.5" opacity="0.32"/><circle cx="60" cy="60" r="30" stroke="currentColor" stroke-width="2.2" opacity="0.95"/><circle cx="60" cy="60" r="16" stroke="#fff" stroke-width="1.8" opacity="0.85"/><path d="M60 40L64 56L80 60L64 64L60 80L56 64L40 60L56 56Z" fill="#fff"/></svg>`,
  seeker_barrage: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><path d="M18 96C20 56 46 32 88 26" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M24 106C46 84 68 62 96 42" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" opacity="0.8"/><path d="M14 70C30 40 52 24 76 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.65"/><path d="M74 18L102 22L82 38L84 26Z" fill="#fff" stroke="currentColor" stroke-width="1.4"/><path d="M84 36L108 38L92 54L92 43Z" fill="#fff" stroke="currentColor" stroke-width="1.3"/><path d="M62 12L86 14L70 28L71 19Z" fill="#fff" opacity="0.9"/><circle cx="96" cy="28" r="14" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.7"/></svg>`,
  starbloom_spores: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><circle cx="54" cy="68" r="22" stroke="currentColor" stroke-width="6" opacity="0.2"/><circle cx="54" cy="68" r="18" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2.6"/><circle cx="54" cy="68" r="7.5" fill="#fff"/><circle cx="84" cy="44" r="12" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="2.2"/><circle cx="84" cy="44" r="4.8" fill="#fff"/><circle cx="34" cy="40" r="8.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2"/><circle cx="34" cy="40" r="3.4" fill="#fff"/><circle cx="66" cy="24" r="3" fill="#fff" opacity="0.9"/><circle cx="92" cy="76" r="2.6" fill="#fff" opacity="0.8"/><circle cx="26" cy="78" r="2.4" fill="currentColor" opacity="0.85"/></svg>`,
  celestial_spear: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><circle cx="52" cy="68" r="20" stroke="currentColor" stroke-width="2" opacity="0.55"/><path d="M16 104L96 24" stroke="currentColor" stroke-width="12" stroke-linecap="round" opacity="0.24"/><path d="M16 104L96 24" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/><path d="M20 100L98 22" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M80 20L104 16L100 40L92 28Z" fill="#fff"/></svg>`,
  gravity_harvest: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><path d="M60 18A42 42 0 0 1 98 76" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/><path d="M60 102A42 42 0 0 1 22 44" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/><path d="M60 34A26 26 0 0 1 84 70" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/><path d="M60 86A26 26 0 0 1 36 50" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/><circle cx="60" cy="60" r="8" fill="#fff"/><circle cx="28" cy="26" r="3.4" fill="#fff"/><circle cx="92" cy="94" r="3.4" fill="#fff"/></svg>`,
  aegis_bloom: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><path d="M24 68A36 36 0 0 1 96 68" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity="0.22"/><path d="M24 68A36 36 0 0 1 96 68" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M32 68A28 28 0 0 1 88 68" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/><path d="M60 52L64 64L76 68L64 72L60 84L56 72L44 68L56 64Z" fill="#fff"/><circle cx="60" cy="26" r="3" fill="#fff"/></svg>`,
  astral_shield: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><polygon points="60,18 96,39 96,81 60,102 24,81 24,39" stroke="currentColor" stroke-width="7" stroke-linejoin="round" opacity="0.22"/><polygon points="60,18 96,39 96,81 60,102 24,81 24,39" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/><polygon points="60,32 84,46 84,74 60,88 36,74 36,46" stroke="#fff" stroke-width="1.8" opacity="0.85"/><circle cx="60" cy="60" r="7" fill="#fff"/></svg>`,
  echo_conduit: `<svg class="blessing-emblem-svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="38" stroke="currentColor" stroke-width="2.6" stroke-dasharray="168 32" stroke-linecap="round"/><circle cx="60" cy="60" r="28" stroke="currentColor" stroke-width="1.6" stroke-dasharray="70 30" opacity="0.55"/><path d="M60 60V34" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M60 60L79 71" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M60 60L74 51" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.65"/><circle cx="60" cy="60" r="4.5" fill="#fff"/><circle cx="60" cy="22" r="3" fill="#fff"/></svg>`,
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
