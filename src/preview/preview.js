import { Application, Container, Graphics, Sprite } from 'pixi.js';
import {
  ABILITY_EVOLUTIONS,
  ABILITY_SYNERGIES,
  ABILITY_TALENT_GROUPS,
  ASPECT_DEFS,
  BLESSINGS,
  COLORS,
  ENEMY_STATS,
  SPIRIT_ASPECTS,
  SPIRIT_PALETTES,
  SPIRIT_TRAILS,
  createDefaultBuildState,
  getActiveSynergies,
} from '../core/Constants.js';
import { createTextures } from '../graphics/TextureFactory.js';
import { createEnemyModel } from '../models/enemies/EnemyRegistry.js';
import { PlayerModel } from '../models/PlayerModel.js';
import { EnemyCanvasRenderer } from '../views/canvas/EnemyCanvasRenderer.js';
import { PlayerCanvasRenderer } from '../views/canvas/PlayerCanvasRenderer.js';
import { AbilityManager } from '../entities/Abilities.js';
import { ParticleSystem } from '../vfx/ParticleSystem.js';
import { EnemyManager } from '../entities/Enemies.js';
import {
  ABILITY_CARD_EMBLEMS,
  ABILITY_ICONS,
  TAROT_ASTROLABE_SVG,
} from '../views/dom/DomIcons.js';

const ENEMY_CATALOG = [
  { kind: 'stalker', name: 'Stalker', role: 'Chaser + Predator Lunge', phase: 'Phase 1', radius: 14 },
  { kind: 'manta', name: 'Manta', role: 'Sinusoidal Winged Chaser', phase: 'Phase 2', radius: 17 },
  { kind: 'lancer', name: 'Lancer', role: 'Invulnerable Railgun Hazard (Untargetable)', phase: 'Phase 2', radius: 12 },
  { kind: 'sentinel', name: 'Sentinel', role: 'Roaming Pulse Turret', phase: 'Phase 2', radius: 20 },
  { kind: 'spitter', name: 'Spitter', role: 'Ranged Kiter (18 proj dmg)', phase: 'Phase 3', radius: 14 },
  { kind: 'artillery', name: 'Artillery', role: 'Spread Kiter (20 proj dmg)', phase: 'Phase 3', radius: 17 },
  { kind: 'warden', name: 'Warden', role: 'Splitter Bruiser', phase: 'Phase 3', radius: 21 },
  { kind: 'vortex', name: 'Vortex', role: 'Gravity Well Puller', phase: 'Phase 2', radius: 19 },
  { kind: 'harbinger', name: 'Astral Harbinger', role: 'Elite Bullet-Hell Caster', phase: 'Elite (~30s)', radius: 26 },
  { kind: 'behemoth', name: 'Umbral Dreadnought', role: 'Elite Charge-Slam Bruiser', phase: 'Elite (Alt)', radius: 30 },
  { kind: 'core', name: 'Eclipse Core', role: 'Shielded Shockwave Boss', phase: 'Ph 3 / Ph 5 / OD', radius: 26 },
];

const PICKUP_CATALOG = [
  {
    id: 'mote',
    name: 'Light Mote',
    tint: COLORS.moteCyan,
    accent: 0xffffff,
    scale: 0.44,
    tag: 'EXP · SCORE',
    desc: 'Standard shadow drop (32% chance). Grants EXP, Combo momentum, and score.',
  },
  {
    id: 'golden_mote',
    name: 'Golden Mote',
    tint: COLORS.moteGold,
    accent: 0xfff8d6,
    scale: 0.56,
    tag: 'BONUS EXP · HEAL',
    desc: 'High-value mote (35% of drops + Elite/Core bursts). Grants extra EXP, score, and minor restore.',
  },
  {
    id: 'prism',
    name: 'Radiant Prism',
    tint: COLORS.prismAura,
    accent: 0xffffff,
    scale: 0.72,
    tag: 'BURST · DASH',
    desc: 'Dropped by Eclipse Cores and world spawns. Triggers radiant nova, dash energy, and high score.',
  },
  {
    id: 'star',
    name: 'Constellation Star',
    tint: 0x9efff5,
    accent: 0xffe699,
    scale: 0.68,
    tag: 'CONSTELLATION',
    desc: 'Link Constellation Stars to trigger a Constellation Burst (+20 base LUM factor & screen pulse).',
  },
  {
    id: 'shard',
    name: 'Luminance Shard',
    tint: 0xc69bff,
    accent: 0xffe699,
    scale: 0.64,
    tag: 'META CURRENCY',
    desc: 'Dropped by Overdrive Waves (+30 LUM) and Eclipse Cores (2× 33 LUM) for Sanctuary upgrades.',
  },
];

const hexStr = (num) => `#${(num ?? 0x5ff7eb).toString(16).padStart(6, '0')}`;

const state = {
  tab: 'enemies',
  // Enemies tab
  enemyViewMode: 'lineup', // 'lineup' | 'inspect'
  selectedEnemy: 'stalker',
  enemyZoom: 2,
  // Spirits tab
  selectedSpirit: 'wisp',
  selectedPalette: 'default',
  selectedTrail: 'mist',
  // Abilities tab
  selectedAbility: 'resonant_volley',
  abilityRank: 5,
  abilityMaxTalents: false,
  // Cards tab
  cardsSubMode: 'draft', // 'draft' | 'compare'
  cardsRarity: 'epic',
  // Pickups tab
  selectedPickup: 'mote',
};

const stageEl = document.getElementById('preview-stage');
const labelsEl = document.getElementById('stage-labels');
const controlsEl = document.getElementById('stage-controls');
const titleEl = document.getElementById('stage-title');
const detailEl = document.getElementById('detail-panel');
const selectorEl = document.getElementById('selector-area');

let app;
let textures;
let sceneRoot;
let bgGrid;
let time = 0;

// Active tab simulation objects
let enemyRenderer;
let previewEnemies = [];
let playerModel;
let playerRenderer;
let particles;
let abilityManager;
let sandboxEnemies;
let pickupSprites = [];

function clearScene() {
  sceneRoot.removeChildren();
  labelsEl.innerHTML = '';
  previewEnemies = [];
  pickupSprites = [];
  enemyRenderer?.reset();
  particles?.reset?.();
  abilityManager?.reset?.();
  sandboxEnemies?.reset?.();
}

function drawBackdropGrid(w, h) {
  bgGrid.clear();
  bgGrid.setStrokeStyle({ width: 1, color: 0x5ff7eb, alpha: 0.06 });
  for (let x = 0; x <= w; x += 48) {
    bgGrid.moveTo(x, 0).lineTo(x, h);
  }
  for (let y = 0; y <= h; y += 48) {
    bgGrid.moveTo(0, y).lineTo(w, y);
  }
  bgGrid.stroke();
}

function addLabel(text, sub, x, y) {
  const div = document.createElement('div');
  div.className = 'stage-label';
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.innerHTML = `${text}${sub ? `<small>${sub}</small>` : ''}`;
  labelsEl.appendChild(div);
}

// ============================================================================
// TAB 1: ENEMIES & BOSSES
// ============================================================================
function setupEnemiesScene() {
  clearScene();
  const w = app.renderer.width;
  const h = app.renderer.height;

  enemyRenderer.container.scale.set(1);
  enemyRenderer.container.position.set(0, 0);
  enemyRenderer.overlayContainer.scale.set(1);
  enemyRenderer.overlayContainer.position.set(0, 0);
  sceneRoot.addChild(enemyRenderer.container, enemyRenderer.overlayContainer);

  if (state.enemyViewMode === 'lineup') {
    const row1 = ENEMY_CATALOG.slice(0, 6);
    const row2 = ENEMY_CATALOG.slice(6);
    const placeRow = (list, y) => {
      const gap = w / (list.length + 1);
      list.forEach((meta, idx) => {
        const x = gap * (idx + 1);
        const e = createEnemyModel(meta.kind, {
          x,
          y,
          speedScale: 1,
          hpBonus: 0,
          hpMul: 1,
          extraShields: meta.kind === 'core' ? 2 : 0,
          petalHp: 60,
        });
        e.age = 5;
        e.vx = 40;
        e.vy = 0;
        enemyRenderer.attachEnemy(e);
        previewEnemies.push(e);
        addLabel(meta.name, meta.kind === 'core' ? 'Boss' : meta.phase, x, y + meta.radius + 16);
      });
    };
    placeRow(row1, h * 0.3);
    placeRow(row2, h * 0.72);
  } else {
    const meta = ENEMY_CATALOG.find((m) => m.kind === state.selectedEnemy) || ENEMY_CATALOG[0];
    const cx = w * 0.5;
    const cy = h * 0.5;
    const e = createEnemyModel(meta.kind, {
      x: 0,
      y: 0,
      speedScale: 1,
      hpBonus: 0,
      hpMul: 1,
      extraShields: meta.kind === 'core' ? 2 : 0,
      petalHp: 60,
    });
    e.age = 5;
    e.vx = 60;
    e.vy = 0;
    enemyRenderer.container.position.set(cx, cy);
    enemyRenderer.container.scale.set(state.enemyZoom);
    enemyRenderer.overlayContainer.position.set(cx, cy);
    enemyRenderer.overlayContainer.scale.set(state.enemyZoom);
    enemyRenderer.attachEnemy(e);
    previewEnemies.push(e);
    addLabel(meta.name, `${state.enemyZoom}× Zoom · ${meta.role}`, cx, cy + meta.radius * state.enemyZoom + 24);
  }
}

function renderEnemiesUI() {
  const meta = ENEMY_CATALOG.find((m) => m.kind === state.selectedEnemy) || ENEMY_CATALOG[0];
  const st = ENEMY_STATS[meta.kind] || {};
  titleEl.textContent =
    state.enemyViewMode === 'lineup'
      ? 'Enemies & Bosses — Full Relative Size Lineup (11)'
      : `Inspecting: ${meta.name}`;

  controlsEl.innerHTML = `
    <button class="ctrl-btn ${state.enemyViewMode === 'lineup' ? 'active' : ''}" id="btn-en-lineup">All 11 Lineup</button>
    <button class="ctrl-btn ${state.enemyViewMode === 'inspect' ? 'active' : ''}" id="btn-en-inspect">Zoom Inspect</button>
    ${
      state.enemyViewMode === 'inspect'
        ? `
      <button class="ctrl-btn ${state.enemyZoom === 1 ? 'active' : ''}" data-zoom="1">1×</button>
      <button class="ctrl-btn ${state.enemyZoom === 2 ? 'active' : ''}" data-zoom="2">2×</button>
      <button class="ctrl-btn ${state.enemyZoom === 3 ? 'active' : ''}" data-zoom="3">3×</button>
      <button class="ctrl-btn" id="btn-en-hit">${meta.kind === 'core' ? 'Crack 1 Petal' : 'Test Hit (-25%)'}</button>
    `
        : ''
    }
  `;

  controlsEl.querySelector('#btn-en-lineup')?.addEventListener('click', () => {
    state.enemyViewMode = 'lineup';
    refreshTab();
  });
  controlsEl.querySelector('#btn-en-inspect')?.addEventListener('click', () => {
    state.enemyViewMode = 'inspect';
    refreshTab();
  });
  controlsEl.querySelectorAll('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      state.enemyZoom = Number(b.dataset.zoom);
      refreshTab();
    })
  );
  controlsEl.querySelector('#btn-en-hit')?.addEventListener('click', () => {
    const e = previewEnemies[0];
    if (!e) return;
    if (e.kind === 'core') {
      e.takeDamage(e.petalHp || 60);
      if (e.shields <= 0) e.shields = (3 + (e.extraShields || 2)) * (e.petalHp || 60);
    } else {
      e.takeDamage(Math.max(10, Math.round(e.maxHp * 0.25)));
      if (e.hp <= 0) e.hp = e.maxHp;
    }
  });

  detailEl.innerHTML = `
    <div class="detail-head">
      <h2>${meta.name} <span style="color:var(--muted);font-weight:400;font-size:0.85rem">(${meta.kind})</span></h2>
      <span class="tag">${meta.phase}</span>
    </div>
    <p style="margin:0;color:var(--muted);font-size:0.86rem">${meta.role}</p>
    <div class="stats-row">
      <div class="stat-pill">Base HP: <b>${meta.kind === 'core' ? '180–3,040+ (Scaled Petals)' : meta.kind === 'lancer' ? 'INVULNERABLE' : st.hp + ' HP'}</b></div>
      <div class="stat-pill">Contact DMG: <b>${st.damage || 22}</b></div>
      ${st.projectileDamage ? `<div class="stat-pill">Projectile DMG: <b>${st.projectileDamage}</b></div>` : ''}
      <div class="stat-pill">Base EXP: <b>${st.exp || 10}</b></div>
      <div class="stat-pill">Hitbox Radius: <b>${meta.radius}px</b></div>
    </div>
  `;

  selectorEl.innerHTML = `<div class="grid">${ENEMY_CATALOG.map(
    (m) => `
    <button class="item-card ${m.kind === state.selectedEnemy ? 'active' : ''}" data-kind="${m.kind}">
      <h3>${m.name} <span class="tag" style="font-size:0.62rem">${m.phase}</span></h3>
      <p>${m.role}</p>
    </button>
  `
  ).join('')}</div>`;

  selectorEl.querySelectorAll('[data-kind]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.selectedEnemy = btn.dataset.kind;
      state.enemyViewMode = 'inspect';
      refreshTab();
    })
  );
}

// ============================================================================
// TAB 2: SPIRITS, PALETTES & TRAILS
// ============================================================================
function applySelectedSpiritStyle() {
  const sp = SPIRIT_ASPECTS.find((s) => s.id === state.selectedSpirit) || SPIRIT_ASPECTS[0];
  const pal = SPIRIT_PALETTES.find((p) => p.id === state.selectedPalette) || SPIRIT_PALETTES[0];
  playerModel.applySpiritMods({
    ...sp,
    colorHex: pal.colorHex ?? sp.colorHex,
    accentHex: pal.accentHex ?? sp.accentHex,
    trailId: state.selectedTrail,
  });
  playerRenderer.applySpiritStyle(playerModel);
}

function setupSpiritsScene() {
  clearScene();
  const w = app.renderer.width;
  const h = app.renderer.height;
  playerModel.reset(w * 0.5, h * 0.5);
  applySelectedSpiritStyle();
  playerRenderer.reset?.(w * 0.5, h * 0.5);
  sceneRoot.addChild(particles.container, playerRenderer.container);
}

function renderSpiritsUI() {
  const sp = SPIRIT_ASPECTS.find((s) => s.id === state.selectedSpirit) || SPIRIT_ASPECTS[0];
  const pal = SPIRIT_PALETTES.find((p) => p.id === state.selectedPalette) || SPIRIT_PALETTES[0];
  const tr = SPIRIT_TRAILS.find((t) => t.id === state.selectedTrail) || SPIRIT_TRAILS[0];

  titleEl.textContent = `Spirit Preview — ${sp.name} · ${pal.name} · ${tr.name}`;
  controlsEl.innerHTML = `<button class="ctrl-btn active" id="btn-sp-dash">Trigger Solar Dash</button>`;
  controlsEl.querySelector('#btn-sp-dash')?.addEventListener('click', () => {
    playerModel.dashCharges = playerModel.maxDashCharges;
    playerModel.dashCooldown = 0;
    playerModel.tryDash(Math.cos(playerModel.facingAngle), Math.sin(playerModel.facingAngle));
  });

  detailEl.innerHTML = `
    <div class="detail-head">
      <h2>${sp.name}</h2>
      <span class="tag">${sp.tag} · ${sp.unlockLuminance ? sp.unlockLuminance + ' LUM' : 'STARTER'}</span>
    </div>
    <p style="margin:0;color:var(--muted);font-size:0.86rem">${sp.desc}</p>
    <div class="stats-row">
      <div class="stat-pill">Max HP: <b>${sp.maxHealth}</b></div>
      <div class="stat-pill">Dash Charges: <b>${sp.dashCharges}</b></div>
      <div class="stat-pill">Move Speed: <b>${Math.round(sp.speedMul * 100)}%</b></div>
      <div class="stat-pill">Dash Speed: <b>${Math.round(sp.dashSpeedMul * 100)}%</b></div>
      <div class="stat-pill">Dash Recharge: <b>${Math.round((1 / sp.dashRechargeMul) * 100)}%</b></div>
      <div class="stat-pill">Magnet Reach: <b>${Math.round(sp.magnetMul * 100)}%</b></div>
      <div class="stat-pill">Arc Reach: <b>${Math.round(sp.arcReachMul * 100)}%</b></div>
    </div>
  `;

  selectorEl.innerHTML = `
    <div class="sub-section">
      <h3>Spirit Aspects (${SPIRIT_ASPECTS.length})</h3>
      <div class="grid">
        ${SPIRIT_ASPECTS.map(
          (s) => `
          <button class="item-card ${s.id === state.selectedSpirit ? 'active' : ''}" data-spirit="${s.id}">
            <h3>${s.name} <span class="swatch" style="background:${hexStr(s.colorHex)}"></span></h3>
            <p>${s.desc}</p>
          </button>`
        ).join('')}
      </div>
    </div>
    <div class="sub-section">
      <h3>Color Palettes (${SPIRIT_PALETTES.length})</h3>
      <div class="grid">
        ${SPIRIT_PALETTES.map(
          (p) => `
          <button class="item-card ${p.id === state.selectedPalette ? 'active' : ''}" data-palette="${p.id}">
            <h3>${p.name} <span class="swatch" style="background:${hexStr(p.colorHex ?? sp.colorHex)}"></span></h3>
            <p>${p.cost ? p.cost + ' LUM' : 'Default Signature'}</p>
          </button>`
        ).join('')}
      </div>
    </div>
    <div class="sub-section">
      <h3>Trails (${SPIRIT_TRAILS.length})</h3>
      <div class="grid">
        ${SPIRIT_TRAILS.map(
          (t) => `
          <button class="item-card ${t.id === state.selectedTrail ? 'active' : ''}" data-trail="${t.id}">
            <h3>${t.name}</h3>
            <p>${t.desc} (${t.cost ? t.cost + ' LUM' : 'Starter'})</p>
          </button>`
        ).join('')}
      </div>
    </div>
  `;

  selectorEl.querySelectorAll('[data-spirit]').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedSpirit = b.dataset.spirit;
      applySelectedSpiritStyle();
      renderSpiritsUI();
    })
  );
  selectorEl.querySelectorAll('[data-palette]').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedPalette = b.dataset.palette;
      applySelectedSpiritStyle();
      renderSpiritsUI();
    })
  );
  selectorEl.querySelectorAll('[data-trail]').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedTrail = b.dataset.trail;
      applySelectedSpiritStyle();
      renderSpiritsUI();
    })
  );
}

// ============================================================================
// TAB 3: ABILITIES, SYNERGIES & TALENTS (LIVE SANDBOX)
// ============================================================================
function spawnSandboxTargets() {
  const w = app.renderer.width;
  const h = app.renderer.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  while (sandboxEnemies.enemies.length < 7) {
    const idx = sandboxEnemies.enemies.length;
    const a = (idx / 7) * Math.PI * 2 + time * 0.25;
    const dist = 105 + (idx % 2) * 55;
    const e = sandboxEnemies._spawnModel(idx % 3 === 0 ? 'sentinel' : 'stalker', {
      x: cx + Math.cos(a) * dist,
      y: cy + Math.sin(a) * dist,
      speedScale: 0.4,
      hpBonus: 12,
      hpMul: 2,
    });
    e.age = 5;
    sandboxEnemies.enemies.push(e);
  }
}

function setupAbilitiesScene() {
  clearScene();
  const w = app.renderer.width;
  const h = app.renderer.height;
  playerModel.reset(w * 0.5, h * 0.5);
  playerModel.maxShield = state.selectedAbility === 'astral_shield' ? 60 : 0;
  playerModel.shield = playerModel.maxShield;
  applySelectedSpiritStyle();
  playerRenderer.reset?.(w * 0.5, h * 0.5);

  sandboxEnemies.reset();
  abilityManager.reset();
  spawnSandboxTargets();

  sceneRoot.addChild(
    particles.container,
    sandboxEnemies.container,
    abilityManager.container,
    playerRenderer.container,
    sandboxEnemies.overlayContainer
  );
}

function renderAbilitiesUI() {
  const ab = BLESSINGS.find((b) => b.id === state.selectedAbility) || BLESSINGS[0];
  const evo = ABILITY_EVOLUTIONS[ab.id];
  const aspects = ASPECT_DEFS.filter((a) => a.abilityId === ab.id);
  const talents = ABILITY_TALENT_GROUPS.get(ab.id) || [];
  const syns = ABILITY_SYNERGIES.filter((s) => s.pair.includes(ab.id));

  titleEl.textContent = `Live Ability Sandbox — ${ab.name} (LV ${state.abilityRank}${state.abilityMaxTalents ? ' · Talents 20/20' : ''})`;
  controlsEl.innerHTML = `
    <button class="ctrl-btn ${state.abilityRank === 1 ? 'active' : ''}" data-rank="1">LV 1</button>
    <button class="ctrl-btn ${state.abilityRank === 5 ? 'active' : ''}" data-rank="5">LV 5 Ascension</button>
    <button class="ctrl-btn ${state.abilityRank === 10 ? 'active' : ''}" data-rank="10">LV 10 Supernova</button>
    <button class="ctrl-btn ${state.abilityMaxTalents ? 'active' : ''}" id="btn-ab-talents">Max Talents (20/20)</button>
  `;
  controlsEl.querySelectorAll('[data-rank]').forEach((b) =>
    b.addEventListener('click', () => {
      state.abilityRank = Number(b.dataset.rank);
      refreshTab();
    })
  );
  controlsEl.querySelector('#btn-ab-talents')?.addEventListener('click', () => {
    state.abilityMaxTalents = !state.abilityMaxTalents;
    refreshTab();
  });

  detailEl.innerHTML = `
    <div class="detail-head">
      <h2>${ab.name} <span style="color:var(--muted);font-weight:400;font-size:0.85rem">(${ab.id})</span></h2>
      <span class="tag">${ab.tag}</span>
    </div>
    <p style="margin:0;color:var(--muted);font-size:0.86rem">${ab.desc}</p>
    ${
      evo
        ? `<div class="stats-row"><div class="stat-pill">LV 5/10 Ascension — <b>${evo.name}</b>: ${evo.desc}</div></div>`
        : ''
    }
    ${
      syns.length
        ? `<div class="stats-row">${syns
            .map((s) => `<div class="stat-pill">Synergy — <b>${s.name}</b>: ${s.desc}</div>`)
            .join('')}</div>`
        : ''
    }
    <div class="sub-section">
      <h3>Aspect Cards (${aspects.length})</h3>
      <div class="stats-row">
        ${aspects.map((a) => `<div class="stat-pill"><b>${a.title(a.baseVal)}</b> · ${a.desc(a.baseVal)}</div>`).join('')}
      </div>
    </div>
    <div class="sub-section">
      <h3>Talent Tree (${talents.length} Nodes)</h3>
      <div class="talent-grid">
        ${talents
          .map(
            (t) => `
          <div class="talent-box">
            <strong>${t.name} <span style="color:var(--muted);font-weight:400">(${t.slot})</span></strong>
            ${t.desc}
            <small>LV 1: ${t.rankText(1)} · Max: ${t.rankText(t.maxLevel)}</small>
            <small>Costs: ${t.costs.join(' / ')} LUM</small>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;

  selectorEl.innerHTML = `<div class="grid">${BLESSINGS.map(
    (b) => `
    <button class="item-card ${b.id === state.selectedAbility ? 'active' : ''}" data-ab="${b.id}">
      <h3>${b.name}</h3>
      <p>${b.tag} — ${b.desc}</p>
    </button>
  `
  ).join('')}</div>`;

  selectorEl.querySelectorAll('[data-ab]').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedAbility = b.dataset.ab;
      refreshTab();
    })
  );
}

// ============================================================================
// TAB 4: PICKUPS & COLLECTIBLES
// ============================================================================
function setupPickupsScene() {
  clearScene();
  const w = app.renderer.width;
  const h = app.renderer.height;
  const gap = w / (PICKUP_CATALOG.length + 1);

  PICKUP_CATALOG.forEach((p, idx) => {
    const x = gap * (idx + 1);
    const y = h * 0.48;
    const root = new Container();
    root.position.set(x, y);

    const glow = new Sprite(textures.glowSoft);
    glow.anchor.set(0.5);
    glow.blendMode = 'add';
    glow.tint = p.tint;
    glow.scale.set(p.scale * 1.45);
    glow.alpha = 0.48;

    const tex =
      p.id === 'prism' || p.id === 'shard'
        ? textures.diamond
        : p.id === 'star'
          ? textures.sparkStar
          : textures.orbCore;
    const core = new Sprite(tex);
    core.anchor.set(0.5);
    core.blendMode = 'add';
    core.tint = p.tint;
    core.scale.set(p.scale);

    const ring = new Sprite(textures.ring);
    ring.anchor.set(0.5);
    ring.blendMode = 'add';
    ring.tint = p.accent;
    ring.scale.set(p.scale * 0.7);
    ring.alpha = 0.35;

    root.addChild(glow, ring, core);
    sceneRoot.addChild(root);
    pickupSprites.push({ root, glow, core, ring, baseY: y, phase: idx * 1.1 });
    addLabel(p.name, p.tag, x, y + 48);
  });
}

function renderPickupsUI() {
  const p = PICKUP_CATALOG.find((x) => x.id === state.selectedPickup) || PICKUP_CATALOG[0];
  titleEl.textContent = 'Pickups & World Collectibles (5)';
  controlsEl.innerHTML = '';
  detailEl.innerHTML = `
    <div class="detail-head">
      <h2>${p.name}</h2>
      <span class="tag">${p.tag}</span>
    </div>
    <p style="margin:0;color:var(--muted);font-size:0.86rem">${p.desc}</p>
  `;
  selectorEl.innerHTML = `<div class="grid">${PICKUP_CATALOG.map(
    (item) => `
    <button class="item-card ${item.id === state.selectedPickup ? 'active' : ''}" data-pk="${item.id}">
      <h3>${item.name} <span class="swatch" style="background:${hexStr(item.tint)}"></span></h3>
      <p>${item.desc}</p>
    </button>
  `
  ).join('')}</div>`;

  selectorEl.querySelectorAll('[data-pk]').forEach((b) =>
    b.addEventListener('click', () => {
      state.selectedPickup = b.dataset.pk;
      renderPickupsUI();
    })
  );
}

// ============================================================================
// TAB 5: CARD DRAFT & SPELL EMBLEMS
// ============================================================================
function renderCardsTab() {
  clearScene();
  stageEl.style.display = 'none';
  titleEl.textContent =
    state.cardsSubMode === 'draft'
      ? 'Celestial Tarot Card Draft Preview'
      : 'UI Icons (24px) vs. Card Emblems (All 11)';

  controlsEl.innerHTML = `
    <button class="ctrl-btn ${state.cardsSubMode === 'draft' ? 'active' : ''}" id="btn-pv-draft">3-Card Draft</button>
    <button class="ctrl-btn ${state.cardsSubMode === 'compare' ? 'active' : ''}" id="btn-pv-compare">UI Icons vs. Card Emblems (11)</button>
  `;
  controlsEl.querySelector('#btn-pv-draft')?.addEventListener('click', () => {
    state.cardsSubMode = 'draft';
    renderCardsTab();
  });
  controlsEl.querySelector('#btn-pv-compare')?.addEventListener('click', () => {
    state.cardsSubMode = 'compare';
    renderCardsTab();
  });

  if (state.cardsSubMode === 'draft') {
    const sample = [
      { id: 'voltaic_chain', name: 'Voltaic Arc', rarity: 'epic', badge: 'EPIC', rank: 'LV 2', title: '+3 Targets', desc: 'Voltaic Arc chains to +3 more shadows per strike.', footer: 'Pairs with Starbloom Spores → Storm Pollen' },
      { id: 'seeker_barrage', name: 'Seeker Needles', rarity: 'rare', badge: 'NEW', rank: 'LV 1', title: 'Seeker Needles', desc: 'Launches 2 curved homing starlight needles toward distant shadows.', footer: 'Pairs with Starlight Bolt → Comet Volley' },
      { id: 'solar_orbitals', name: 'Orbiting Blades', rarity: 'uncommon', badge: 'UNCOMMON', rank: 'LV 3', title: '+14% Reach', desc: 'Wider crystalline blade orbit radius & cleave reach.', footer: 'Pairs with Celestial Spear → Halo Lance' },
    ];
    detailEl.innerHTML = `<div class="pv-tarot-grid">${sample
      .map(
        (c, i) => `
      <div class="pv-tarot-card pv-tarot-card--${c.rarity}">
        <div class="pv-medallion">${TAROT_ASTROLABE_SVG}${ABILITY_CARD_EMBLEMS[c.id]}</div>
        <div class="pv-pills"><span class="pv-pill">${c.badge}</span><span class="pv-pill">${c.rank}</span><span class="pv-pill">${i + 1}</span></div>
        <div class="pv-eyebrow">✦ ${c.name}</div>
        <div class="pv-title">${c.title}</div>
        <div class="pv-desc">${c.desc}</div>
        <div class="pv-footer">${c.footer}</div>
      </div>`
      )
      .join('')}</div>`;
    selectorEl.innerHTML = '';
  } else {
    detailEl.innerHTML = `<div class="pv-compare-grid">${BLESSINGS.map(
      (b) => `
      <div class="item-card" style="cursor:default">
        <h3 style="justify-content:center">${b.name}</h3>
        <div class="pv-compare-pair">
          <div class="pv-compare-slot">
            <div class="pv-medallion">${TAROT_ASTROLABE_SVG}<span class="pv-old-svg">${ABILITY_ICONS[b.id] || ''}</span></div>
            <small>UI / Talent Icon</small>
          </div>
          <div class="pv-compare-slot is-new">
            <div class="pv-medallion">${TAROT_ASTROLABE_SVG}${ABILITY_CARD_EMBLEMS[b.id] || ''}</div>
            <small style="color:var(--gold)">Card Emblem</small>
          </div>
        </div>
      </div>`
    ).join('')}</div>`;
    selectorEl.innerHTML = '';
  }
}

// ============================================================================
// MAIN LOOP & TAB ROUTER
// ============================================================================
function refreshTab() {
  stageEl.style.display = state.tab === 'cards' ? 'none' : 'block';
  document.querySelectorAll('#preview-tabs .tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.tab);
  });
  if (state.tab === 'enemies') {
    setupEnemiesScene();
    renderEnemiesUI();
  } else if (state.tab === 'spirits') {
    setupSpiritsScene();
    renderSpiritsUI();
  } else if (state.tab === 'abilities') {
    setupAbilitiesScene();
    renderAbilitiesUI();
  } else if (state.tab === 'cards') {
    renderCardsTab();
  } else if (state.tab === 'pickups') {
    setupPickupsScene();
    renderPickupsUI();
  }
}

function tick(ticker) {
  const dt = Math.min(0.05, ticker.deltaMS / 1000);
  time += dt;
  const w = app.renderer.width;
  const h = app.renderer.height;

  if (state.tab === 'enemies') {
    enemyRenderer.beginFrame();
    for (const e of previewEnemies) {
      e.age += dt;
      // Gentle idle sway / rotation so silhouettes & petals animate naturally
      e.vx = Math.cos(time * 1.1) * 50;
      e.vy = Math.sin(time * 1.1) * 20;
      enemyRenderer.renderEnemy(e, dt, time);
    }
  } else if (state.tab === 'spirits') {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const tx = cx + Math.sin(time * 1.35) * Math.min(260, w * 0.28);
    const ty = cy + Math.sin(time * 2.7) * Math.min(82, h * 0.22);
    const dx = tx - playerModel.x;
    const dy = ty - playerModel.y;
    const dist = Math.hypot(dx, dy) || 1;
    playerModel.stepKinematics(dt, { moveX: dx / dist, moveY: dy / dist }, w, h);
    playerRenderer.render(dt, playerModel, true);
    particles.update(dt);
  } else if (state.tab === 'abilities') {
    const cx = w * 0.5;
    const cy = h * 0.5;
    playerModel.x = cx;
    playerModel.y = cy;
    playerRenderer.render(dt, playerModel, false);

    spawnSandboxTargets();
    sandboxEnemies.renderer.beginFrame();
    for (let i = sandboxEnemies.enemies.length - 1; i >= 0; i--) {
      const e = sandboxEnemies.enemies[i];
      if (!e || e._removed) {
        sandboxEnemies.enemies.splice(i, 1);
        continue;
      }
      e.age += dt;
      const a = Math.atan2(e.y - cy, e.x - cx) + dt * 0.55;
      const targetR = 115 + (i % 2) * 55;
      e.x = cx + Math.cos(a) * targetR;
      e.y = cy + Math.sin(a) * targetR;
      sandboxEnemies.renderer.renderEnemy(e, dt, time);
    }

    const ranks = new Map([[state.selectedAbility, state.abilityRank]]);
    if (state.selectedAbility === 'echo_conduit') {
      ranks.set('resonant_volley', 3);
    }
    const build = createDefaultBuildState();
    if (build[state.selectedAbility]) {
      build[state.selectedAbility].rank = state.abilityRank;
      if (state.abilityRank >= 5) {
        build[state.selectedAbility].dmgMul = 1.45;
        build[state.selectedAbility].rateMul = 1.35;
      }
      if (state.abilityRank >= 10) {
        build[state.selectedAbility].dmgMul = 2.0;
        build[state.selectedAbility].rateMul = 1.7;
        if ('countAdd' in build[state.selectedAbility]) build[state.selectedAbility].countAdd = 2;
        if ('targetsAdd' in build[state.selectedAbility]) build[state.selectedAbility].targetsAdd = 3;
      }
    }
    const talentRanks = {};
    if (state.abilityMaxTalents) {
      for (const node of ABILITY_TALENT_GROUPS.get(state.selectedAbility) || []) {
        talentRanks[node.id] = node.maxLevel;
      }
    }

    abilityManager.update(
      dt,
      playerModel,
      sandboxEnemies,
      particles,
      {},
      { onRestoreShield() {}, onDashCdrSeconds() {}, onEventHorizonPull() {} },
      {
        ranks,
        build,
        talentRanks,
        synergies: new Set(getActiveSynergies(ranks).map((s) => s.id)),
        spiritAccentHex: playerModel.spiritColorHex,
        hasteMul: 1,
        globalDmgMul: 1,
        reachMul: 1,
        boundsW: w,
        boundsH: h,
      }
    );
    particles.update(dt);
  } else if (state.tab === 'pickups') {
    for (const p of pickupSprites) {
      p.root.y = p.baseY + Math.sin(time * 2.4 + p.phase) * 7;
      p.core.rotation = Math.sin(time * 1.4 + p.phase) * 0.25;
      p.ring.scale.set(0.32 + Math.sin(time * 3 + p.phase) * 0.05);
    }
  }
}

async function init() {
  app = new Application();
  await app.init({
    resizeTo: stageEl,
    backgroundColor: 0x040814,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  stageEl.prepend(app.canvas);

  textures = createTextures();
  bgGrid = new Graphics();
  sceneRoot = new Container();
  app.stage.addChild(bgGrid, sceneRoot);
  drawBackdropGrid(app.renderer.width, app.renderer.height);

  enemyRenderer = new EnemyCanvasRenderer(textures);
  playerModel = new PlayerModel();
  playerRenderer = new PlayerCanvasRenderer(textures);
  particles = new ParticleSystem(textures);
  abilityManager = new AbilityManager(textures);
  sandboxEnemies = new EnemyManager(textures);

  document.querySelectorAll('#preview-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      refreshTab();
    });
  });

  window.addEventListener('resize', () => {
    drawBackdropGrid(app.renderer.width, app.renderer.height);
    if (state.tab === 'enemies' || state.tab === 'pickups') {
      refreshTab();
    }
  });

  refreshTab();
  app.ticker.add(tick);
}

init();
