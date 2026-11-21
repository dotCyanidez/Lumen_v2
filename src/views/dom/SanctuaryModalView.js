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
  ABILITY_ICONS,
  TALENT_GLYPHS,
  buildTalentRingSvg,
  hexToCss,
} from './DomIcons.js';

const SLOT_POS = {
  root: { xPct: 50, top: 10, svgX: 200, svgY: 41 },
  leftMid: { xPct: 26, top: 120, svgX: 104, svgY: 151 },
  rightMid: { xPct: 74, top: 120, svgX: 296, svgY: 151 },
  leftCap: { xPct: 26, top: 230, svgX: 104, svgY: 261 },
  rightCap: { xPct: 74, top: 230, svgX: 296, svgY: 261 },
};

export function makeSanctuaryCard({
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
    startBtn.addEventListener('click', () => callbacks.onSelectStartAbility?.(groupId));
    headRow.appendChild(startBtn);
  } else {
    const lockNote = document.createElement('span');
    lockNote.className = 'sanctuary-start-lock';
    lockNote.textContent = 'Talent unlocks Start';
    headRow.appendChild(lockNote);
  }
  treeCol.appendChild(headRow);

  const stage = document.createElement('div');
  stage.className = 'fork-tree-stage';

  const linkLines = groupNodes
    .filter((n) => n.requires)
    .map((n) => {
      const parent =
        groupNodes.find((p) => p.id === n.requires) || ABILITY_TALENTS_BY_ID[n.requires];
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
    const isSelected = t.id === selectedTalentId;
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
      callbacks.onUIClick?.();
      sanctuaryVM.selectTalentNode(t.id);
      renderTalentsTree(container, sanctuaryVM, payload, callbacks);
    });
    stage.appendChild(nodeBtn);
  }
  treeCol.appendChild(stage);

  // 3. Right Column: SELECTED TALENT Detail Panel
  const detailCol = document.createElement('section');
  detailCol.className = 'fork-col fork-detail-col';
  detailCol.innerHTML = `<div class="fork-col-heading">SELECTED TALENT</div>`;

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

    const nextHeading = maxed
      ? 'STATUS'
      : !prereqMet
        ? 'REQUIREMENT'
        : `NEXT (LEVEL ${level + 1} / ${maxLevel})`;
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
      actionBtn.addEventListener('click', () => callbacks.onTalentAction?.(sel.id));
    }
    card.appendChild(actionBtn);
    detailCol.appendChild(card);
  }

  layout.append(groupsCol, treeCol, detailCol);
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
          btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `${tr.cost} LUM`,
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
      const swatches = pal.colorHex
        ? [pal.colorHex, pal.accentHex || pal.colorHex]
        : [0x5df7eb, 0xffe699];
      elements.palettesEl.appendChild(
        makeSanctuaryCard({
          title: pal.name,
          desc: pal.colorHex
            ? 'Applies across spirit aura & projectiles.'
            : 'Uses each Spirit aspect native colors.',
          swatches,
          btnText: equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `${pal.cost} LUM`,
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
