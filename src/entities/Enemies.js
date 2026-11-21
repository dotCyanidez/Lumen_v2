import { COLORS, ENEMY_STATS, PLAYER_CONFIG } from '../core/Constants.js';
import { clamp, rand, seededRange as randRange } from '../core/MathUtils.js';
import { BaseEnemy } from '../models/enemies/BaseEnemy.js';
import { EnemyProjectile } from '../models/enemies/EnemyProjectile.js';
import { createEnemyModel } from '../models/enemies/EnemyRegistry.js';
import { EnemyCanvasRenderer } from '../views/canvas/EnemyCanvasRenderer.js';

/**
 * Facade & Coordinator over polymorphic `BaseEnemy` domain models, `EnemyProjectile`s,
 * and `EnemyCanvasRenderer` (PixiJS view layer).
 */
export class EnemyManager {
  constructor(textures) {
    this.textures = textures;
    this.renderer = new EnemyCanvasRenderer(textures);
    this.container = this.renderer.container;
    this.overlayContainer = this.renderer.overlayContainer;
    this.telegraphGraphics = this.renderer.telegraphGraphics;
    this.trailGraphics = this.renderer.trailGraphics;
    this.entityLayer = this.renderer.entityLayer;
    this.projectileGraphics = this.renderer.projectileGraphics;

    this.enemies = [];
    this.projectiles = [];
    this.spawnTimer = 0.85;
    this.lancerTimer = 5.5;
    this.time = 0;

    this._spawnProjBound = (projSpec) => this._spawnProjectile(projSpec);
  }

  reset() {
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.renderer.reset();
    this.spawnTimer = 0.85;
    this.lancerTimer = 5.5;
  }

  _spawnModel(kind, opts = {}) {
    const model = createEnemyModel(kind, opts);
    this.renderer.attachEnemy(model);
    return model;
  }

  _createStalker(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('stalker', { x, y, speedScale, ...statsOpts });
  }

  _createManta(x, y, vx, vy, speedScale, statsOpts = {}) {
    return this._spawnModel('manta', { x, y, vx, vy, speedScale, ...statsOpts });
  }

  _createSentinel(x, y, vx, vy, speedScale, statsOpts = {}) {
    return this._spawnModel('sentinel', { x, y, vx, vy, speedScale, ...statsOpts });
  }

  _pickViewportPerimeter(boundsW, boundsH, player, viewW = 1280, viewH = 720, outPad = 32) {
    const halfW = Math.max(320, viewW * 0.5) + outPad;
    const halfH = Math.max(240, viewH * 0.5) + outPad;
    const left = clamp(player.x - halfW, -24, Math.max(60, boundsW - 120));
    const right = clamp(player.x + halfW, Math.min(boundsW - 60, 120), boundsW + 24);
    const top = clamp(player.y - halfH, -24, Math.max(60, boundsH - 120));
    const bottom = clamp(player.y + halfH, Math.min(boundsH - 60, 120), boundsH + 24);
    const side = Math.floor(rand() * 4);
    if (side === 0) return { x: randRange(left, right), y: top };
    if (side === 1) return { x: right, y: randRange(top, bottom) };
    if (side === 2) return { x: randRange(left, right), y: bottom };
    return { x: left, y: randRange(top, bottom) };
  }

  _createLancer(
    boundsW,
    boundsH,
    player,
    speedScale,
    angleOverride = null,
    viewW = 1280,
    viewH = 720,
    statsOpts = {}
  ) {
    const pt = this._pickViewportPerimeter(boundsW, boundsH, player, viewW, viewH, 28);
    const aimX = player.x + randRange(-45, 45);
    const aimY = player.y + randRange(-45, 45);
    const angle = angleOverride !== null ? angleOverride : Math.atan2(aimY - pt.y, aimX - pt.x);
    const endDist = Math.hypot(viewW, viewH) + 260;

    return this._spawnModel('lancer', {
      x: pt.x,
      y: pt.y,
      angle,
      speedScale,
      endDist,
      ...statsOpts,
    });
  }

  spawnEclipseVolley(boundsW, boundsH, player, speedScale, count = 3, viewW = 1280, viewH = 720) {
    for (let i = 0; i < count; i++) {
      const lancer = this._createLancer(boundsW, boundsH, player, speedScale, null, viewW, viewH);
      lancer.spawnDelay = 1.15 + i * 0.16;
      this.enemies.push(lancer);
    }
  }

  _createVortex(x, y, vx, vy, speedScale, statsOpts = {}) {
    return this._spawnModel('vortex', { x, y, vx, vy, speedScale, ...statsOpts });
  }

  _createWarden(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('warden', { x, y, speedScale, ...statsOpts });
  }

  _spawnSplitWisps(x, y, warden = null) {
    const configs = warden?.getSplitWispConfigs?.() || null;
    for (let k = 0; k < 2; k++) {
      let wisp;
      if (configs && configs[k]) {
        wisp = this._spawnModel('stalker', configs[k]);
      } else {
        const a = randRange(0, Math.PI * 2) + k * Math.PI;
        wisp = this._spawnModel('stalker', {
          x: x + Math.cos(a) * 14,
          y: y + Math.sin(a) * 14,
          vx: Math.cos(a) * 185,
          vy: Math.sin(a) * 185,
          angle: a,
          speedScale: 1.15,
          spawnDelay: 0.28,
          life: 14,
          splitWisp: true,
        });
      }
      this.enemies.push(wisp);
    }
  }

  _createSpitter(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('spitter', { x, y, speedScale, ...statsOpts });
  }

  _createArtillery(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('artillery', { x, y, speedScale, ...statsOpts });
  }

  _createHarbinger(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('harbinger', { x, y, speedScale, ...statsOpts });
  }

  _createBehemoth(x, y, speedScale, statsOpts = {}) {
    return this._spawnModel('behemoth', { x, y, speedScale, ...statsOpts });
  }

  spawnElite(
    kind,
    boundsW,
    boundsH,
    speedScale,
    player = null,
    viewW = 1280,
    viewH = 720,
    statsOpts = {}
  ) {
    let x = boundsW * 0.5;
    let y = boundsH * 0.5;
    if (player && boundsW > 1400) {
      const pt = this._pickViewportPerimeter(boundsW, boundsH, player, viewW, viewH, 48);
      x = clamp(pt.x, 70, boundsW - 70);
      y = clamp(pt.y, 70, boundsH - 70);
    } else {
      x = player ? clamp(player.x + 260, 70, boundsW - 70) : boundsW * 0.5;
      y = player ? clamp(player.y, 70, boundsH - 70) : boundsH * 0.5;
    }

    const eliteKind = kind === 'behemoth' ? 'behemoth' : 'harbinger';
    const elite = this._spawnModel(eliteKind, {
      x,
      y,
      speedScale,
      hpBonus: statsOpts.hpBonus || 0,
      hpMul: statsOpts.hpMul || 1,
    });
    this.enemies.push(elite);
    return elite;
  }

  _spawnProjectile(optsOrX, y, vx, vy, radius, damage, color, life = 4.2, sourceKind = 'spitter', style = null) {
    let projOpts;
    if (typeof optsOrX === 'object' && optsOrX !== null) {
      projOpts = optsOrX;
    } else {
      const resolvedKind =
        style ||
        (sourceKind === 'spitter'
          ? 'dart'
          : sourceKind === 'artillery'
            ? 'tri'
            : sourceKind === 'behemoth'
              ? 'bomb'
              : 'nova');
      projOpts = {
        x: optsOrX,
        y,
        vx,
        vy,
        radius,
        damage,
        color,
        life,
        sourceKind,
        kind: resolvedKind,
      };
    }
    this.projectiles.push(new EnemyProjectile(projOpts));
  }

  _createEclipseCore(
    boundsW,
    boundsH,
    speedScale,
    player = null,
    viewW = 1280,
    viewH = 720,
    extraShields = 0,
    petalHp = 60
  ) {
    let x;
    let y;
    if (player && boundsW > 1400) {
      const pt = this._pickViewportPerimeter(boundsW, boundsH, player, viewW, viewH, 40);
      x = clamp(pt.x, 40, boundsW - 40);
      y = clamp(pt.y, 40, boundsH - 40);
    } else {
      x = boundsW * 0.5 + randRange(-boundsW * 0.18, boundsW * 0.18);
      y = rand() < 0.5 ? -36 : boundsH + 36;
    }

    return this._spawnModel('core', { x, y, speedScale, extraShields, petalHp });
  }

  _drawCoreShield(e, count) {
    this.renderer.drawCoreShield(e, count);
  }

  spawnEclipseCore(
    boundsW,
    boundsH,
    speedScale,
    extraShields = 0,
    player = null,
    viewW = 1280,
    viewH = 720,
    petalHp = 60
  ) {
    const hasCore = this.enemies.some((e) => e.kind === 'core');
    if (hasCore) return null;
    const core = this._createEclipseCore(
      boundsW,
      boundsH,
      speedScale,
      player,
      viewW,
      viewH,
      extraShields,
      petalHp
    );
    this.enemies.push(core);
    return core;
  }

  getGravitySources() {
    const list = [];
    for (const e of this.enemies) {
      const src = e.getGravitySource?.();
      if (src) list.push(src);
    }
    return list;
  }

  _pickSafeInterior(margin, boundsW, boundsH, player, minDist = 190, viewW = 1280, viewH = 720) {
    let x = clamp(player.x, margin, boundsW - margin);
    let y = clamp(player.y, margin, boundsH - margin);
    const maxReach = Math.max(minDist + 160, Math.min(Math.hypot(viewW, viewH) * 0.45, 760));
    for (let attempt = 0; attempt < 12; attempt++) {
      if (boundsW > 1400) {
        const a = randRange(0, Math.PI * 2);
        const r = randRange(minDist, maxReach);
        x = clamp(player.x + Math.cos(a) * r, margin, Math.max(margin + 20, boundsW - margin));
        y = clamp(player.y + Math.sin(a) * r, margin, Math.max(margin + 20, boundsH - margin));
      } else {
        x = randRange(margin, Math.max(margin + 20, boundsW - margin));
        y = randRange(margin, Math.max(margin + 20, boundsH - margin));
      }
      if (Math.hypot(x - player.x, y - player.y) >= minDist) return { x, y };
    }
    return { x, y };
  }

  _spawnByPhase(phase, boundsW, boundsH, player, viewW = 1280, viewH = 720) {
    const margin = 46;
    const pickPerimeter = rand() < 0.65;
    let x = 0;
    let y = 0;

    if (pickPerimeter) {
      const pt = this._pickViewportPerimeter(boundsW, boundsH, player, viewW, viewH, 28);
      x = pt.x;
      y = pt.y;
    } else {
      const pt = this._pickSafeInterior(margin, boundsW, boundsH, player, 190, viewW, viewH);
      x = pt.x;
      y = pt.y;
    }

    const roll = rand();
    const statsOpts = { hpBonus: phase.hpBonus || 0, hpMul: phase.hpMul || 1 };
    const hasVortex = this.enemies.some((e) => e.kind === 'vortex');
    let created;
    if (phase.id >= 2 && !hasVortex && roll < 0.11) {
      const a = randRange(0, Math.PI * 2);
      const spd = randRange(36, 56);
      const pt =
        Math.hypot(x - player.x, y - player.y) >= 180
          ? { x: clamp(x, 85, boundsW - 85), y: clamp(y, 85, boundsH - 85) }
          : this._pickSafeInterior(85, boundsW, boundsH, player, 180, viewW, viewH);
      created = this._createVortex(pt.x, pt.y, Math.cos(a) * spd, Math.sin(a) * spd, phase.speedScale, statsOpts);
    } else if (phase.id >= 3 && roll >= 0.11 && roll < 0.21 && this.enemies.length < phase.maxEnemies - 1) {
      const pt = this._pickSafeInterior(70, boundsW, boundsH, player, 210, viewW, viewH);
      created = this._createWarden(pt.x, pt.y, phase.speedScale, statsOpts);
    } else if (phase.id >= 3 && roll >= 0.21 && roll < 0.34) {
      const pt =
        Math.hypot(x - player.x, y - player.y) >= 240
          ? { x: clamp(x, 70, boundsW - 70), y: clamp(y, 70, boundsH - 70) }
          : this._pickSafeInterior(70, boundsW, boundsH, player, 240, viewW, viewH);
      created = this._createArtillery(pt.x, pt.y, phase.speedScale, statsOpts);
    } else if (phase.id >= 2 && roll >= 0.34 && roll < 0.5) {
      const pt =
        Math.hypot(x - player.x, y - player.y) >= 210
          ? { x: clamp(x, 60, boundsW - 60), y: clamp(y, 60, boundsH - 60) }
          : this._pickSafeInterior(60, boundsW, boundsH, player, 210, viewW, viewH);
      created = this._createSpitter(pt.x, pt.y, phase.speedScale, statsOpts);
    } else if (phase.id >= 2 && roll >= 0.5 && roll < 0.65) {
      const a = Math.atan2(player.y - y, player.x - x);
      const spd = randRange(88, 112);
      created = this._createManta(x, y, Math.cos(a) * spd, Math.sin(a) * spd, phase.speedScale, statsOpts);
    } else if (phase.id >= 2 && roll >= 0.65 && roll < 0.78) {
      const a = randRange(0, Math.PI * 2);
      const spd = randRange(54, 86);
      const pt =
        Math.hypot(x - player.x, y - player.y) >= 170
          ? { x: clamp(x, 60, boundsW - 60), y: clamp(y, 60, boundsH - 60) }
          : this._pickSafeInterior(60, boundsW, boundsH, player, 170, viewW, viewH);
      created = this._createSentinel(pt.x, pt.y, Math.cos(a) * spd, Math.sin(a) * spd, phase.speedScale, statsOpts);
    } else {
      created = this._createStalker(x, y, phase.speedScale, statsOpts);
      created.angle = Math.atan2(player.y - y, player.x - x);
      created.vx = Math.cos(created.angle) * created.speed * 0.72;
      created.vy = Math.sin(created.angle) * created.speed * 0.72;
    }

    this.enemies.push(created);
  }

  applyRepulse(cx, cy, radius = 260, strength = 290) {
    const rSq = radius * radius;
    for (const e of this.enemies) {
      if (e.kind === 'lancer') continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq < rSq && dSq > 0.01) {
        const d = Math.sqrt(dSq);
        const factor = (1 - d / radius) * (e.isElite ? 0.32 : 1);
        e.vx += (dx / d) * strength * factor;
        e.vy += (dy / d) * strength * factor;
        e.applySlow?.(e.isElite ? 0.45 : 1.3);
      }
    }
    const clearProjRSq = Math.pow(radius * 0.85, 2);
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (dx * dx + dy * dy <= clearProjRSq) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  purgeAll(onPurge) {
    const targets = this.enemies.slice();
    for (let i = 0; i < targets.length; i++) {
      const e = targets[i];
      if (!e || e._removed) continue;
      const ex = e.x;
      const ey = e.y;
      const kind = e.kind;
      const isElite = Boolean(e.isElite || ENEMY_STATS[kind]?.isElite);
      this._removeRef(e);
      onPurge?.(ex, ey, kind, isElite);
    }
    this.projectiles.length = 0;
  }

  purgeNear(cx, cy, radius, onPurge) {
    const rSq = radius * radius;
    const targets = this.enemies.slice();
    for (let i = 0; i < targets.length; i++) {
      const e = targets[i];
      if (!e || e._removed || e.age < e.spawnDelay) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= rSq) {
        if (e.kind === 'core' && e.smashDashShield?.()) {
          this.renderer.drawCoreShield(e, e.getPetalCount());
          continue;
        }
        const ex = e.x;
        const ey = e.y;
        const kind = e.kind;
        const isElite = Boolean(e.isElite || ENEMY_STATS[kind]?.isElite);
        this._removeRef(e);
        if (kind === 'warden') this._spawnSplitWisps(ex, ey, e);
        onPurge(ex, ey, kind, isElite);
      }
    }
  }

  purgeNearest(cx, cy, maxRadius, onPurge) {
    let bestIdx = -1;
    let bestDistSq = maxRadius * maxRadius;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.age < e.spawnDelay || e.kind === 'core' || e.isElite) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq > 4 && dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
    if (bestIdx !== -1) {
      const e = this.enemies[bestIdx];
      const ex = e.x;
      const ey = e.y;
      const kind = e.kind;
      const isElite = Boolean(e.isElite || ENEMY_STATS[kind]?.isElite);
      this._removeAt(bestIdx);
      onPurge(ex, ey, kind, isElite);
      return { x: ex, y: ey };
    }
    return null;
  }

  _ensureCombatStats(e, hpBonus = 0, hpMul = 1) {
    if (e.hp !== undefined) return;
    const scaledHp = BaseEnemy.computeScaledHp(e.kind, hpBonus, hpMul);
    e.hp = scaledHp;
    e.maxHp = scaledHp;
    e.hitFlashTimer = 0;
    e.orbitalHitCooldown = 0;
    e.rayHitCooldown = 0;
    e.coreHitCooldown = 0;
    e.markTimer = 0;
    e.markMul = 1;
    e.burnTimer = 0;
    e.burnDps = 0;
    e.burnTick = 0.25;
    e.burnTint = COLORS.lumenGold;
    e.burnSourceAbility = null;
  }

  findNearestTarget(cx, cy, maxRadius = Infinity, excludeSet = null) {
    let bestEnemy = null;
    let bestIdx = -1;
    let bestDistSq = maxRadius * maxRadius;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.age < e.spawnDelay) continue;
      if (excludeSet && excludeSet.has(e)) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestEnemy = e;
        bestIdx = i;
      }
    }
    return bestEnemy ? { enemy: bestEnemy, index: bestIdx, distSq: bestDistSq } : null;
  }

  damageEnemyByRef(enemy, amount = 10, knockX = 0, knockY = 0, callbacks = {}) {
    const idx = this.enemies.indexOf(enemy);
    if (idx === -1) return null;
    return this.damageEnemyAt(idx, amount, knockX, knockY, callbacks);
  }

  damageEnemyAt(index, amount = 10, knockX = 0, knockY = 0, callbacks = {}) {
    const e = this.enemies[index];
    if (!e || e._removed || e.age < e.spawnDelay) return null;
    this._ensureCombatStats(e);

    const isDot = Boolean(callbacks.isDot);
    const sourceAbility = callbacks.sourceAbility || null;
    const res = e.takeDamage(amount, { knockX, knockY, isDot, sourceAbility });
    if (!res) return null;

    const dmgNumY = e.y - (e.radius || 14) * 0.85;
    if (res.effAmount > 0) {
      callbacks.onDamageNumber?.(e.x, dmgNumY, res.effAmount, res.isDot, res.isCrit, sourceAbility);
    }

    if (e.kind === 'core') {
      this.renderer.drawCoreShield(e, res.petalRem);
      if (res.killed) {
        this._removeAt(index);
        if (sourceAbility) {
          callbacks.onAbilityDamage?.(sourceAbility, res.dealt, true, isDot);
        }
        if (callbacks.onCoreShatter) callbacks.onCoreShatter(res.x, res.y);
        else callbacks.onPurge?.(res.x, res.y, 'core');
        return { killed: true, cracked: false, kind: 'core', x: res.x, y: res.y, dealt: res.dealt, wasMarked: res.wasMarked };
      }
      if (sourceAbility) {
        callbacks.onAbilityDamage?.(sourceAbility, res.dealt, false, isDot);
      }
      callbacks.onCoreCrack?.(e.x, e.y, res.petalRem);
      return { killed: false, cracked: true, kind: 'core', x: e.x, y: e.y, dealt: res.dealt, wasMarked: res.wasMarked };
    }

    if (res.killed) {
      this._removeAt(index);
      if (res.kind === 'warden') this._spawnSplitWisps(res.x, res.y, e);
      if (sourceAbility) {
        callbacks.onAbilityDamage?.(sourceAbility, res.dealt, true, isDot);
      }
      callbacks.onPurge?.(res.x, res.y, res.kind, res.isElite);
      return {
        killed: true,
        cracked: false,
        kind: res.kind,
        isElite: res.isElite,
        x: res.x,
        y: res.y,
        dealt: res.dealt,
        wasMarked: res.wasMarked,
      };
    }

    if (sourceAbility) {
      callbacks.onAbilityDamage?.(sourceAbility, res.dealt, false, isDot);
    }
    callbacks.onEnemyHit?.(e.x, e.y, res.kind, e.hp, e.maxHp);
    return { killed: false, cracked: false, kind: res.kind, x: e.x, y: e.y, dealt: res.dealt, wasMarked: res.wasMarked };
  }

  applyBurn(enemy, dps = 6.5, duration = 2.4, tint = COLORS.lumenGold, sourceAbility = null) {
    if (!enemy || enemy.age < enemy.spawnDelay || dps <= 0) return;
    this._ensureCombatStats(enemy);
    enemy.applyBurn(dps, duration, tint, sourceAbility);
  }

  applyBurnRadius(cx, cy, radius, dps = 6.5, duration = 2.4, tint = COLORS.lumenGold, sourceAbility = null) {
    const rSq = radius * radius;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.age < e.spawnDelay) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      if (dx * dx + dy * dy <= rSq + e.radius * e.radius * 0.5) {
        this.applyBurn(e, dps, duration, tint, sourceAbility);
      }
    }
  }

  damageRadius(cx, cy, radius, amount = 10, knockStrength = 160, slowDuration = 0, callbacks = {}) {
    const rSq = radius * radius;
    let hits = 0;
    const targets = this.enemies.slice();
    for (let i = 0; i < targets.length; i++) {
      const e = targets[i];
      if (!e || e._removed || e.age < e.spawnDelay) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= rSq + e.radius * e.radius * 0.5) {
        const d = Math.max(1, Math.sqrt(dSq));
        if (slowDuration > 0) {
          e.applySlow?.(slowDuration);
        }
        const pullScale = knockStrength < 0 ? Math.min(1, d / 28) : 1;
        const factor = knockStrength !== 0 ? clamp(1 - d / Math.max(1, radius), 0.2, 1) * pullScale : 0;
        const res = this.damageEnemyByRef(
          e,
          amount,
          (dx / d) * knockStrength * factor,
          (dy / d) * knockStrength * factor,
          callbacks
        );
        if (res) hits++;
      }
    }
    return hits;
  }

  update(dt, player, phase, boundsW, boundsH, callbacks, viewW = 1280, viewH = 720) {
    this.time += dt;
    this.renderer.beginFrame();

    const hpBonus = phase.hpBonus || 0;
    const hpMul = phase.hpMul || 1;
    const activeCount = this.enemies.length;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && activeCount < phase.maxEnemies) {
      let batch = 1;
      if (phase.id >= 5) batch = hpBonus >= 3 && rand() < 0.35 ? 4 : rand() < 0.5 ? 3 : 2;
      else if (phase.id === 4) batch = rand() < 0.4 ? 3 : 2;
      else if (phase.id === 3) batch = rand() < 0.48 ? 2 : 1;
      else if (phase.id === 2) batch = rand() < 0.25 ? 2 : 1;

      const slots = Math.max(1, phase.maxEnemies - this.enemies.length);
      const count = Math.min(batch, slots);
      for (let s = 0; s < count; s++) {
        this._spawnByPhase(phase, boundsW, boundsH, player, viewW, viewH);
      }
      this.spawnTimer = phase.spawnInterval * randRange(0.84, 1.16);
    }

    if (phase.id >= 2) {
      this.lancerTimer -= dt;
      if (this.lancerTimer <= 0 && this.enemies.length < phase.maxEnemies + 2) {
        const l1 = this._createLancer(boundsW, boundsH, player, phase.speedScale, null, viewW, viewH, {
          hpBonus,
          hpMul,
        });
        this.enemies.push(l1);

        const twinChance = phase.id >= 5 ? 0.55 : phase.id === 4 ? 0.3 : 0;
        if (rand() < twinChance) {
          const l2 = this._createLancer(boundsW, boundsH, player, phase.speedScale, null, viewW, viewH, {
            hpBonus,
            hpMul,
          });
          this.enemies.push(l2);
        }

        const baseCooldown = Math.max(3.0, 8.6 - phase.id * 1.15);
        this.lancerTimer = baseCooldown * randRange(0.86, 1.2);
      }
    }

    const aiCtx = {
      player,
      time: this.time,
      boundsW,
      boundsH,
      viewW,
      viewH,
      speedScale: phase.speedScale,
      spawnProjectile: this._spawnProjBound,
      onLancerTelegraph: callbacks.onLancerTelegraph,
      onSpitterTelegraph: callbacks.onSpitterTelegraph,
      onArtilleryTelegraph: callbacks.onArtilleryTelegraph,
      onHarbingerRingTelegraph: callbacks.onHarbingerRingTelegraph,
      onHarbingerBoltTelegraph: callbacks.onHarbingerBoltTelegraph,
      onBehemothTelegraph: callbacks.onBehemothTelegraph,
      onCoreTelegraph: callbacks.onCoreTelegraph,
      onHitPlayer: callbacks.onHit,
      onVoidParry: (core) => {
        this.damageEnemyByRef(core, core.petalHp || 60, 0, 0, { ...callbacks, sourceAbility: null });
        callbacks.onVoidParry?.(core.guardOriginX, core.guardOriginY);
      },
    };

    const activeList = this.enemies.slice();
    for (let idx = 0; idx < activeList.length; idx++) {
      const e = activeList[idx];
      if (!e || e._removed) continue;
      this._ensureCombatStats(e, hpBonus, hpMul);
      e.age += dt;

      const dueBurnTicks = e.tickStatusTimers(dt);
      if (dueBurnTicks > 0) {
        let killedByBurn = false;
        const burnCb = e.burnSourceAbility
          ? { ...callbacks, sourceAbility: e.burnSourceAbility, isDot: true }
          : callbacks;
        for (let t = 0; t < dueBurnTicks; t++) {
          const bRes = this.damageEnemyByRef(e, (e.burnDps || 6.5) * 0.25, 0, 0, burnCb);
          if (!bRes || bRes.killed || e._removed) {
            killedByBurn = true;
            break;
          }
        }
        if (killedByBurn) continue;
      }

      const aiRes = e.updateAI(dt, aiCtx);
      if (e._removed || aiRes?.expired) {
        this._removeRef(e);
        continue;
      }

      if (e.kind !== 'lancer') {
        if (e.kind !== 'core' && !e.isElite && Math.hypot(player.x - e.x, player.y - e.y) > Math.max(viewW, viewH) + 650) {
          e.age += dt * 3;
        }
        if (e.age >= e.life) {
          const fadeOut = 1 - (e.age - e.life) / 0.6;
          if (fadeOut <= 0) {
            this._removeRef(e);
            continue;
          }
        }
      }

      this.renderer.renderEnemy(e, dt, this.time);

      if (!e.isActive()) continue;

      const effectiveRadius = e.getEffectiveHitRadius();
      const hitDist = PLAYER_CONFIG.hitRadius + effectiveRadius;
      const d = Math.hypot(player.x - e.x, player.y - e.y);

      if (d <= hitDist) {
        if (!player.isInvulnerable && !((e.kind === 'core' || e.isElite) && e.coreHitCooldown > 0)) {
          const ex = e.x;
          const ey = e.y;
          const dmg = e.getContactDamage();
          if (e.kind === 'core' || e.isElite) {
            e.coreHitCooldown = 0.55;
            callbacks.onHit(ex, ey, dmg, e.kind);
            continue;
          }
          this._removeRef(e);
          callbacks.onHit(ex, ey, dmg, e.kind);
          continue;
        }
      }
    }

    this._updateProjectiles(dt, player, boundsW, boundsH, callbacks);
  }

  _updateProjectiles(dt, player, boundsW, boundsH, callbacks) {
    let pendingHit = null;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const res = p.update(dt, boundsW, boundsH, player);
      if (res.expired) {
        this.projectiles.splice(i, 1);
        if (res.hitPlayer && !pendingHit) {
          pendingHit = { x: res.x, y: res.y, damage: res.damage, sourceKind: res.sourceKind };
        }
      }
    }
    this.renderer.renderProjectiles(this.projectiles, this.time);
    if (pendingHit) {
      callbacks.onHit(pendingHit.x, pendingHit.y, pendingHit.damage, pendingHit.sourceKind);
    }
  }

  _drawHpPips(e) {
    this.renderer.drawHpPips(e, this.time);
  }

  _removeAt(index) {
    const e = this.enemies[index];
    if (!e) return;
    e._removed = true;
    this.renderer.detachEnemy(e);
    this.enemies.splice(index, 1);
  }

  _removeRef(e) {
    if (!e || e._removed) return;
    const idx = this.enemies.indexOf(e);
    if (idx !== -1) {
      this._removeAt(idx);
      return;
    }
    e._removed = true;
    this.renderer.detachEnemy(e);
  }
}
