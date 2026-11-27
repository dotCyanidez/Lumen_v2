import {
  ABILITY_TALENT_GROUPS,
  ABILITY_TALENTS_BY_ID,
  SANCTUARY_UPGRADES,
  SPIRIT_ASPECTS,
  SPIRIT_PALETTES,
  SPIRIT_TRAILS,
  getAbilityInfo,
} from '../../core/Constants.js';
import {
  ABILITY_CARD_EMBLEMS,
  ABILITY_ICONS,
  TALENT_GLYPHS,
  TAROT_ASTROLABE_SVG,
  TAROT_STAR_SVG,
  hexToCss,
} from './DomIcons.js';

const SLOT_POS = {
  root: { xPct: 50, yPct: 52 },
  leftMid: { xPct: 29, yPct: 36 },
  leftCap: { xPct: 13, yPct: 60 },
  rightMid: { xPct: 71, yPct: 36 },
  rightCap: { xPct: 87, yPct: 60 },
};

const CONSTELLATION_CURVES = [
  { from: 'root', to: 'leftMid', d: 'M 500 260 Q 400 185 290 180' },
  { from: 'leftMid', to: 'leftCap', d: 'M 290 180 Q 175 190 130 300' },
  { from: 'root', to: 'rightMid', d: 'M 500 260 Q 600 185 710 180' },
  { from: 'rightMid', to: 'rightCap', d: 'M 710 180 Q 825 190 870 300' },
];

function buildTrailPreviewHtml(trailId) {
  const styles = {
    mist: `<svg class="look-trail-svg" viewBox="0 0 180 54" fill="none">
      <path d="M12 36 Q 58 14, 102 28 T 164 22" stroke="#5ff7eb" stroke-width="11" stroke-linecap="round" opacity="0.22"/>
      <path d="M12 36 Q 58 14, 102 28 T 164 22" stroke="#8dfaf2" stroke-width="3.4" stroke-linecap="round" opacity="0.9"/>
      <circle cx="48" cy="22" r="2.2" fill="#b8fff9" opacity="0.75"/><circle cx="96" cy="34" r="2.6" fill="#5ff7eb" opacity="0.8"/>
      <circle cx="136" cy="18" r="2" fill="#fff" opacity="0.85"/><circle cx="164" cy="22" r="5.5" fill="#fff"/>
    </svg>`,
    stardust: `<svg class="look-trail-svg" viewBox="0 0 180 54" fill="none">
      <path d="M12 36 Q 60 12, 106 28 T 164 22" stroke="#7de8ff" stroke-width="8" stroke-linecap="round" opacity="0.2"/>
      <path d="M12 36 Q 60 12, 106 28 T 164 22" stroke="#e4faff" stroke-width="2.4" stroke-dasharray="6 5" stroke-linecap="round"/>
      <path d="M44 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/><path d="M98 24l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffe699"/>
      <path d="M138 14l1.4 3.5 3.5 1.4-3.5 1.4-1.4 3.5-1.4-3.5-3.5-1.4 3.5-1.4z" fill="#fff"/>
      <circle cx="164" cy="22" r="5.5" fill="#fff"/>
    </svg>`,
    prism: `<svg class="look-trail-svg" viewBox="0 0 180 54" fill="none">
      <defs><linearGradient id="pvPrismG" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#5ff7eb"/><stop offset="50%" stop-color="#c87dff"/><stop offset="100%" stop-color="#ffe699"/></linearGradient></defs>
      <path d="M12 36 Q 58 10, 102 30 T 164 22" stroke="url(#pvPrismG)" stroke-width="12" stroke-linecap="round" opacity="0.28"/>
      <path d="M12 36 Q 58 10, 102 30 T 164 22" stroke="url(#pvPrismG)" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M14 36 Q 58 10, 102 30 T 164 22" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>
      <circle cx="164" cy="22" r="5.5" fill="#fff"/>
    </svg>`,
    solar: `<svg class="look-trail-svg" viewBox="0 0 180 54" fill="none">
      <defs><linearGradient id="pvSolarG" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff6b4a"/><stop offset="55%" stop-color="#ffc857"/><stop offset="100%" stop-color="#fff8d6"/></linearGradient></defs>
      <path d="M12 36 Q 58 14, 102 28 T 164 22" stroke="url(#pvSolarG)" stroke-width="13" stroke-linecap="round" opacity="0.32"/>
      <path d="M12 36 Q 58 14, 102 28 T 164 22" stroke="url(#pvSolarG)" stroke-width="4.4" stroke-linecap="round"/>
      <circle cx="52" cy="17" r="2.8" fill="#ffe699"/><circle cx="88" cy="36" r="2.4" fill="#ff9457"/>
      <circle cx="128" cy="16" r="2.6" fill="#fff3ba"/><circle cx="164" cy="22" r="6" fill="#fff"/>
    </svg>`,
  };
  return `<div class="look-preview look-preview--trail">${styles[trailId] || styles.mist}</div>`;
}

function buildPalettePreviewHtml(colorHex, accentHex) {
  const c1 = hexToCss(colorHex || 0x5ff7eb);
  const c2 = hexToCss(accentHex || colorHex || 0xffe699);
  return `
    <div class="look-preview look-preview--palette" style="--pal-a:${c1};--pal-b:${c2}">
      <div class="look-orb-ring"></div>
      <div class="look-orb-core"></div>
      <div class="look-palette-bar"></div>
    </div>
  `;
}

export function makeSanctuaryCard({
  title,
  desc,
  badge = '',
  swatches = [],
  visualHtml = '',
  pips = null,
  btnText,
  disabled = false,
  equipped = false,
  onAction,
}) {
  const card = document.createElement('div');
  card.className = `sanctuary-item${equipped ? ' is-equipped' : ''}`;
  if (visualHtml) {
    card.insertAdjacentHTML('beforeend', visualHtml);
  }

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

export function renderTalentsTree(container, sanctuaryVM, payload = {}, callbacks = {}) {
  if (!container) return;
  const {
    luminance = 0,
    selectedStartAbility = 'resonant_volley',
    unlockedStartAbilities = ['resonant_volley'],
    talentRanks = {},
  } = payload;

  const curGroup = sanctuaryVM.selectedTalentAbility.value;
  const groupId = ABILITY_TALENT_GROUPS.has(curGroup)
    ? curGroup
    : ABILITY_TALENT_GROUPS.keys().next().value;
  sanctuaryVM.selectedTalentAbility.value = groupId;
  const groupNodes = ABILITY_TALENT_GROUPS.get(groupId) || [];
  if (!groupNodes.some((n) => n.id === sanctuaryVM.selectedTalentId.value)) {
    sanctuaryVM.selectedTalentId.value = groupNodes[0]?.id || null;
  }
  const selectedTalentId = sanctuaryVM.selectedTalentId.value;

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
      callbacks.onUIClick?.();
      sanctuaryVM.selectAbilityGroup(abId);
      renderTalentsTree(container, sanctuaryVM, payload, callbacks);
    });
    groupsList.appendChild(btn);
  }
  groupsCol.appendChild(groupsList);

  // 2. Right Hero Workspace: Constellation Star-Chart + Bottom Inspector Bar
  const rightCol = document.createElement('div');
  rightCol.className = 'fork-constellation-col';

  const treeCol = document.createElement('section');
  treeCol.className = 'fork-col fork-tree-col';
  const groupInfo = getAbilityInfo(groupId);
  const groupName = groupInfo?.name || groupId;
  const canStart = unlockedStartAbilities.includes(groupId);
  const isStartGroup = selectedStartAbility === groupId;

  const stage = document.createElement('div');
  stage.className = 'fork-tree-stage';

  const headRow = document.createElement('div');
  headRow.className = 'fork-col-headrow fork-stage-topbar';
  headRow.innerHTML = `<div class="fork-col-heading">${groupName.toUpperCase()} · STAR CONSTELLATION</div>`;
  if (canStart) {
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = `sanctuary-start-btn${isStartGroup ? ' is-active' : ''}`;
    startBtn.textContent = isStartGroup ? '★ START ABILITY' : 'SET START';
    startBtn.disabled = isStartGroup;
    startBtn.addEventListener('click', () => callbacks.onSelectStartAbility?.(groupId));
    headRow.appendChild(startBtn);
  } else {
    const lockNote = document.createElement('span');
    lockNote.className = 'sanctuary-start-lock';
    lockNote.textContent = 'Talent unlocks Start';
    headRow.appendChild(lockNote);
  }

  const bySlot = Object.fromEntries(groupNodes.map((n) => [n.slot, n]));
  const curvePaths = CONSTELLATION_CURVES.map((c) => {
    const fromNode = bySlot[c.from];
    const toNode = bySlot[c.to];
    const fromRank = fromNode ? Math.max(0, Number(talentRanks?.[fromNode.id]) || 0) : 0;
    const toRank = toNode ? Math.max(0, Number(talentRanks?.[toNode.id]) || 0) : 0;
    const parentMet = fromNode ? fromRank >= (fromNode.maxLevel || 1) : false;
    const toMaxed = toNode ? toRank >= (toNode.maxLevel || 1) : false;
    const cls = toMaxed ? 'is-maxed' : parentMet && toRank > 0 ? 'is-active' : parentMet ? 'is-unlocked' : '';
    return `<path class="fork-constellation-path ${cls}" d="${c.d}" vector-effect="non-scaling-stroke" />`;
  }).join('');

  stage.innerHTML = `
    <span class="fork-stage-corner tl">${TAROT_STAR_SVG}</span>
    <span class="fork-stage-corner tr">${TAROT_STAR_SVG}</span>
    <span class="fork-stage-corner bl">${TAROT_STAR_SVG}</span>
    <span class="fork-stage-corner br">${TAROT_STAR_SVG}</span>
    <div class="fork-stage-backdrop">${TAROT_ASTROLABE_SVG.replace('blessing-astrolabe', 'fork-stage-astrolabe')}</div>
    <svg class="fork-tree-svg" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">${curvePaths}</svg>
    <div class="fork-wing-label" style="left:14%;top:88%">✦ Left Branch</div>
    <div class="fork-wing-label" style="left:86%;top:88%">Right Branch ✦</div>
  `;
  stage.prepend(headRow);

  for (const t of groupNodes) {
    const pos = SLOT_POS[t.slot] || SLOT_POS.root;
    const maxLevel = t.maxLevel || t.costs.length;
    const level = Math.max(0, Math.min(maxLevel, Number(talentRanks?.[t.id]) || 0));
    const maxed = level >= maxLevel;
    const reqNode = t.requires ? ABILITY_TALENTS_BY_ID[t.requires] : null;
    const reqRank = reqNode ? Math.max(0, Number(talentRanks?.[reqNode.id]) || 0) : 0;
    const needed = reqNode ? reqNode.maxLevel : 0;
    const prereqMet = !reqNode || reqRank >= needed;
    const isSelected = t.id === selectedTalentId;
    const isRoot = t.slot === 'root';
    const isCap = t.slot.includes('Cap');
    const rawGlyph = isRoot
      ? (ABILITY_CARD_EMBLEMS[groupId] || ABILITY_ICONS[groupId] || ABILITY_ICONS.resonant_volley).replace(
          'blessing-emblem-svg',
          'fork-node-glyph'
        )
      : (TALENT_GLYPHS[t.glyph] || ABILITY_ICONS[groupId] || ABILITY_ICONS.resonant_volley).replace(
          '<svg ',
          '<svg class="fork-node-glyph" '
        );
    const pipsHtml = Array.from(
      { length: maxLevel },
      (_, i) => `<span class="fork-star-pip${i < level ? ' is-lit' : ''}"></span>`
    ).join('');

    const nodeBtn = document.createElement('button');
    nodeBtn.type = 'button';
    nodeBtn.dataset.talentId = t.id;
    nodeBtn.dataset.slot = t.slot;
    nodeBtn.style.left = `${pos.xPct}%`;
    nodeBtn.style.top = `${pos.yPct}%`;
    nodeBtn.className = `fork-tree-node${isRoot ? ' is-root' : ''}${isCap ? ' is-cap' : ''}${isSelected ? ' is-selected' : ''}${level > 0 ? ' is-unlocked' : ''}${maxed ? ' is-active is-maxed' : ''}${!prereqMet ? ' is-locked-node' : ''}`;
    nodeBtn.setAttribute('aria-pressed', String(isSelected));
    nodeBtn.innerHTML = `
      <div class="fork-node-orb">${rawGlyph}</div>
      <div class="fork-node-name">${t.name}</div>
      <div class="fork-star-pips">${pipsHtml}</div>
      <div class="fork-node-level">LV ${level} / ${maxLevel}</div>
    `;
    nodeBtn.addEventListener('click', () => {
      callbacks.onUIClick?.();
      sanctuaryVM.selectTalentNode(t.id);
      renderTalentsTree(container, sanctuaryVM, payload, callbacks);
    });
    stage.appendChild(nodeBtn);
  }
  treeCol.appendChild(stage);
  rightCol.appendChild(treeCol);

  // 3. Bottom Horizontal Inspector Bar: SELECTED TALENT
  const detailCol = document.createElement('section');
  detailCol.className = 'fork-col fork-detail-col fork-inspector-bar';

  const sel = groupNodes.find((n) => n.id === selectedTalentId) || groupNodes[0];
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
          ? `LEVEL ${level} / ${maxLevel}`
          : 'AVAILABLE';
    const statusCls = maxed ? 'is-active' : level > 0 ? 'is-unlocked' : '';
    const shortfall =
      !maxed && prereqMet && luminance < nextCost
        ? ` Need ${(nextCost - luminance).toLocaleString()} more LUM.`
        : '';

    let nextLine;
    if (maxed) {
      nextLine = `Active (MAX): ${sel.rankText(maxLevel)}`;
    } else if (!prereqMet) {
      nextLine = `Requires ${reqNode.name} LV ${needed} (${reqRank}/${needed}) · Next: ${sel.rankText(level + 1)}`;
    } else {
      const startNote =
        sel.slot === 'root' && level === 0 ? ` · Unlocks ${groupName} as Start Ability` : '';
      nextLine = `Next (LV ${level + 1}): ${sel.rankText(level + 1)}${startNote}${shortfall}`;
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'fork-inspector-info';
    infoDiv.innerHTML = `
      <div class="fork-detail-head">
        <span class="fork-detail-group">✦ ${groupName.toUpperCase()}</span>
        <span class="fork-detail-status ${statusCls}">${statusText}</span>
      </div>
      <h3 class="fork-detail-title">${sel.name}</h3>
      <p class="fork-detail-desc">${sel.desc}</p>
      <div class="fork-detail-next-line">${nextLine}</div>
    `;

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = `sanctuary-buy-btn fork-detail-action${maxed ? ' is-active' : ''}`;
    actionBtn.textContent = maxed
      ? '★ MAXED'
      : !prereqMet
        ? `LOCKED (${reqNode.name} Lv ${needed})`
        : `AWAKEN · ${nextCost.toLocaleString()} LUM`;
    actionBtn.disabled = !canBuy;
    if (canBuy) {
      actionBtn.addEventListener('click', () => callbacks.onTalentAction?.(sel.id));
    }
    detailCol.append(infoDiv, actionBtn);
  }
  rightCol.appendChild(detailCol);

  layout.append(groupsCol, rightCol);
  container.innerHTML = '';
  container.appendChild(layout);
}

export function renderSanctuary(elements, sanctuaryVM, payload = {}, callbacks = {}) {
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

  sanctuaryVM.luminance.value = luminance;
  sanctuaryVM.lifetimeLuminance.value = lifetimeLuminance;

  elements.panelEl?.classList.toggle('is-tree-mode', sanctuaryVM.activeTab.value === 'talents');
  if (elements.lumBadgeEl) {
    elements.lumBadgeEl.textContent = `${luminance.toLocaleString()} LUM`;
  }

  if (elements.upgradesEl) {
    elements.upgradesEl.innerHTML = '';
    for (const u of SANCTUARY_UPGRADES) {
      const rank = Math.max(0, Number(upgrades?.[u.id]) || 0);
      const maxed = rank >= u.costs.length;
      const cost = maxed ? 0 : u.costs[rank];
      const canBuy = !maxed && luminance >= cost;
      elements.upgradesEl.appendChild(
        makeSanctuaryCard({
          title: u.name,
          desc: u.desc,
          badge: rank > 0 ? u.effectLabel(rank) : `RANK 0/${u.costs.length}`,
          pips: { total: u.costs.length, filled: rank },
          btnText: maxed ? 'MAXED' : `${cost.toLocaleString()} LUM`,
          disabled: maxed || !canBuy,
          equipped: maxed,
          onAction: () => callbacks.onUpgradeSanctuary?.(u.id),
        })
      );
    }
  }

  if (elements.talentsEl) {
    renderTalentsTree(
      elements.talentsEl,
      sanctuaryVM,
      {
        luminance,
        selectedStartAbility,
        unlockedStartAbilities,
        talentRanks,
      },
      callbacks
    );
  }

  if (elements.trailsEl) {
    elements.trailsEl.innerHTML = '';
    for (const tr of SPIRIT_TRAILS) {
      const unlocked = unlockedTrails.includes(tr.id);
      const equipped = selectedTrail === tr.id;
      const canBuy = unlocked || luminance >= tr.cost;
      elements.trailsEl.appendChild(
        makeSanctuaryCard({
          title: tr.name,
          desc: tr.desc,
          visualHtml: buildTrailPreviewHtml(tr.id),
          btnText: equipped ? '✦ EQUIPPED' : unlocked ? 'EQUIP' : `${tr.cost} LUM`,
          disabled: equipped || !canBuy,
          equipped,
          onAction: () => callbacks.onSelectTrail?.(tr.id),
        })
      );
    }
  }

  if (elements.palettesEl) {
    elements.palettesEl.innerHTML = '';
    for (const pal of SPIRIT_PALETTES) {
      const unlocked = unlockedPalettes.includes(pal.id);
      const equipped = selectedPalette === pal.id;
      const canBuy = unlocked || luminance >= pal.cost;
      const c1 = pal.colorHex || 0x5df7eb;
      const c2 = pal.accentHex || (pal.colorHex ? pal.colorHex : 0xffe699);
      elements.palettesEl.appendChild(
        makeSanctuaryCard({
          title: pal.name,
          desc: pal.colorHex ? 'Spirit aura & bolts.' : 'Native Spirit hues.',
          visualHtml: buildPalettePreviewHtml(c1, c2),
          btnText: equipped ? '✦ EQUIPPED' : unlocked ? 'EQUIP' : `${pal.cost} LUM`,
          disabled: equipped || !canBuy,
          equipped,
          onAction: () => callbacks.onSelectPalette?.(pal.id),
        })
      );
    }
  }

  if (elements.spiritsEl) {
    elements.spiritsEl.innerHTML = '';
    for (const sp of SPIRIT_ASPECTS) {
      const unlocked = lifetimeLuminance >= sp.unlockLuminance;
      const equipped = unlocked && selectedSpirit === sp.id;
      elements.spiritsEl.appendChild(
        makeSanctuaryCard({
          title: sp.name,
          desc: sp.desc,
          badge: sp.tag,
          swatches: [sp.colorHex, sp.accentHex || sp.colorHex],
          btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `🔒 ${sp.unlockLuminance} LIFE`,
          disabled: equipped || !unlocked,
          equipped,
          onAction: () => callbacks.onSelectSpirit?.(sp.id),
        })
      );
    }
  }
}

export class SanctuaryModalView {
  constructor(elements, vm, callbacks = {}) {
    this.elements = elements;
    this.vm = vm;
    this.callbacks = callbacks;

    this.vm.activeTab.subscribe((activeTab) => {
      this.elements.panelEl?.classList.toggle('is-tree-mode', activeTab === 'talents');
      this.elements.panelEl?.classList.toggle('is-looks-mode', activeTab === 'looks');
      for (const btn of this.elements.tabs || []) {
        btn.classList.toggle('active', btn.dataset.tab === activeTab);
      }
      for (const [key, pane] of Object.entries(this.elements.panes || {})) {
        if (!pane) continue;
        const on = key === activeTab;
        pane.classList.toggle('hidden', !on);
        pane.classList.toggle('active', on);
      }
    });
  }

  setTab(tabName) {
    this.vm.setTab(tabName || 'upgrades');
  }

  resetSelection() {
    this.vm.resetSelection();
  }

  renderSanctuary(payload = {}) {
    renderSanctuary(this.elements, this.vm, payload, this.callbacks);
  }
}
