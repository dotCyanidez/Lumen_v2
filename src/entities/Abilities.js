import { COLORS, getGroupTalentEffects } from '../core/Constants.js';
import { distToSegment, randRange } from '../core/MathUtils.js';
import { AbilityProjectileModel } from '../models/abilities/AbilityProjectileModel.js';
import { createAbilityInstances } from '../models/abilities/AbilityRegistry.js';
import { BaseAbility } from '../models/abilities/BaseAbility.js';
import { LightPoolModel } from '../models/abilities/LightPoolModel.js';
import { AbilityCanvasRenderer } from '../views/canvas/AbilityCanvasRenderer.js';

const INITIAL_PROJECTILES = 96;
const MAX_DYNAMIC_PROJECTILES = 420;
const INITIAL_ORBITALS = 10;
const INITIAL_SPORES = 20;
const MAX_LIGHT_POOLS = 36;
const EMPTY_BUILD = {};
const EMPTY_SET = new Set();

/**
 * Facade & Coordinator over polymorphic `BaseAbility` domain models,
 * `AbilityProjectileModel`s, `LightPoolModel`s, and `AbilityCanvasRenderer`.
 */
export class AbilityManager {
  constructor(textures) {
    this.textures = textures;
    this.renderer = new AbilityCanvasRenderer(textures);
    this.container = this.renderer.container;
    this.fxGraphics = this.renderer.fxGraphics;
    this.sporeLayer = this.renderer.sporeLayer;
    this.spriteLayer = this.renderer.spriteLayer;
    this.orbitSprites = this.renderer.orbitSprites;

    this.abilities = createAbilityInstances();
    this.abilityList = Object.values(this.abilities);

    this.projectiles = [];
    for (let i = 0; i < INITIAL_PROJECTILES; i++) {
      this._createProjectileSlot();
    }

    this.orbitalPos = [];
    this._ensureOrbitalCapacity(INITIAL_ORBITALS);

    this.spores = [];
    this._ensureSporeCapacity(INITIAL_SPORES);

    this.spears = [];
    this.pulses = [];
    this.lightPools = [];
    this.orbitRays = [];
    this.damageBreakdown = {};

    this._sourceCbCache = new Map();
    this._abilityCtx = this._buildAbilityContext();
  }

  // Backward-compatible property accessors delegating to OOP ability models
  get echoPulses() {
    return this.abilities.astral_pulse.echoPulses;
  }

  get boltTimer() {
    return this.abilities.resonant_volley.timer;
  }
  set boltTimer(v) {
    this.abilities.resonant_volley.timer = v;
  }

  get voltaicTimer() {
    return this.abilities.voltaic_chain.timer;
  }
  set voltaicTimer(v) {
    this.abilities.voltaic_chain.timer = v;
  }

  get pulseTimer() {
    return this.abilities.astral_pulse.timer;
  }
  set pulseTimer(v) {
    this.abilities.astral_pulse.timer = v;
  }

  get seekerTimer() {
    return this.abilities.seeker_barrage.timer;
  }
  set seekerTimer(v) {
    this.abilities.seeker_barrage.timer = v;
  }

  get sporeTimer() {
    return this.abilities.starbloom_spores.timer;
  }
  set sporeTimer(v) {
    this.abilities.starbloom_spores.timer = v;
  }

  get spearTimer() {
    return this.abilities.celestial_spear.timer;
  }
  set spearTimer(v) {
    this.abilities.celestial_spear.timer = v;
  }

  get orbitalPulseTimer() {
    return this.abilities.solar_orbitals.orbitalPulseTimer;
  }
  set orbitalPulseTimer(v) {
    this.abilities.solar_orbitals.orbitalPulseTimer = v;
  }

  get chromaticWaveTimer() {
    return this.abilities.echo_conduit.chromaticWaveTimer;
  }
  set chromaticWaveTimer(v) {
    this.abilities.echo_conduit.chromaticWaveTimer = v;
  }

  get orbitSurgeTimer() {
    return this.abilities.solar_orbitals.surgeTimer;
  }
  set orbitSurgeTimer(v) {
    this.abilities.solar_orbitals.surgeTimer = v;
  }

  get orbitSurgeActive() {
    return this.abilities.solar_orbitals.surgeActive;
  }
  set orbitSurgeActive(v) {
    this.abilities.solar_orbitals.surgeActive = v;
  }

  get orbitAngle() {
    return this.abilities.solar_orbitals.orbitAngle;
  }
  set orbitAngle(v) {
    this.abilities.solar_orbitals.orbitAngle = v;
  }

  get boltVolleyCount() {
    return this.abilities.resonant_volley.volleyCount;
  }
  set boltVolleyCount(v) {
    this.abilities.resonant_volley.volleyCount = v;
  }

  get boltFanIdx() {
    return this.abilities.resonant_volley.fanIdx;
  }
  set boltFanIdx(v) {
    this.abilities.resonant_volley.fanIdx = v;
  }

  get boltCresIdx() {
    return this.abilities.resonant_volley.cresIdx;
  }
  set boltCresIdx(v) {
    this.abilities.resonant_volley.cresIdx = v;
  }

  get mirrorCastIdx() {
    return this.abilities.echo_conduit.mirrorCastIdx;
  }
  set mirrorCastIdx(v) {
    this.abilities.echo_conduit.mirrorCastIdx = v;
  }

  get radiantHitCount() {
    return this.abilities.solar_orbitals.radiantHitCount;
  }
  set radiantHitCount(v) {
    this.abilities.solar_orbitals.radiantHitCount = v;
  }

  get overclockCastCount() {
    return this.abilities.echo_conduit.overclockCastCount;
  }
  set overclockCastCount(v) {
    this.abilities.echo_conduit.overclockCastCount = v;
  }

  _buildAbilityContext() {
    const ctx = {
      player: null,
      enemies: null,
      particles: null,
      audio: null,
      callbacks: null,
      ranks: null,
      build: EMPTY_BUILD,
      talentRanks: {},
      synergies: EMPTY_SET,
      spiritAccentHex: COLORS.lumenCyan,
      hasteMul: 1,
      globalDmgMul: 1,
      reachMul: 1,
      primaryTint: COLORS.lumenCyan,
      echoFx: null,
      spores: null,
      spears: null,
      orbitalPos: null,
      orbitRays: null,
      getRank: (id) => Math.max(ctx.build[id]?.rank || 0, ctx.ranks?.get?.(id) || 0),
      getBuild: (id) => ctx.build[id],
      getTalentFx: (id) => (ctx.getRank(id) > 0 ? getGroupTalentEffects(id, ctx.talentRanks) : null),
      withSource: (sourceAbility) => this._withSource(ctx.callbacks, sourceAbility),
      shouldMirrorCast: () => this.abilities.echo_conduit.shouldMirrorCast(ctx.echoFx),
      onOverclockCast: () => this.abilities.echo_conduit.triggerOverclockRipple(ctx),
      spawnProjectile: (spec) => this._spawnProjectile(spec),
      spawnSparkSplit: (x, y, dmg, tint, enemies, count, sourceAbility) =>
        this._spawnSparkSplit(x, y, dmg, tint, enemies, count, sourceAbility),
      spawnLightPool: (spec) => this.spawnLightPool(spec),
      addPulse: (pulse) => this.pulses.push(pulse),
      addSpear: (spear) => this.spears.push(spear),
      ensureOrbitalCapacity: (target) => this._ensureOrbitalCapacity(target),
      ensureSporeCapacity: (target) => this._ensureSporeCapacity(target),
      detonateSpore: (sp) => this.abilities.starbloom_spores.detonateSpore(sp, ctx),
      onSporeSpawn: (sp) => this.renderer.syncSporeSpawn(sp),
      onSporeUpdate: (sp) => this.renderer.syncSporeFrame(sp),
      onSporeDeactivate: (sp) => this.renderer.hideSpore(sp),
    };
    return ctx;
  }

  _createProjectileSlot() {
    const slot = new AbilityProjectileModel();
    slot.sprite = this.renderer.createProjectileSprite();
    this.projectiles.push(slot);
    return slot;
  }

  _ensureOrbitalCapacity(target) {
    this.renderer.ensureOrbitalCapacity(target);
    while (this.orbitalPos.length < target) {
      this.orbitalPos.push({
        x: 0,
        y: 0,
        active: false,
        rotation: 0,
        tint: COLORS.lumenCyan,
        scale: 0.32,
      });
    }
  }

  _ensureSporeCapacity(target) {
    while (this.spores.length < target) {
      const view = this.renderer.createSporeView();
      this.spores.push({
        active: false,
        view,
        root: view.root,
        halo: view.halo,
        ring: view.ring,
        bud: view.bud,
        glint: view.glint,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: 0,
        life: 6,
        phase: 0,
        armDelay: 0.22,
        triggerRadius: 28,
        burstRadius: 74,
        damage: 1,
        slow: 0,
        tint: COLORS.lumenCyan,
      });
    }
  }

  /** Resets all active projectiles, orbitals, starbloom spores, and ability timers for a fresh run. */
  reset() {
    for (const p of this.projectiles) {
      p.deactivate();
    }
    for (const pos of this.orbitalPos) {
      pos.active = false;
    }
    for (const sp of this.spores) {
      sp.active = false;
    }
    this.spears.length = 0;
    this.pulses.length = 0;
    this.lightPools.length = 0;
    this.orbitRays.length = 0;
    this.damageBreakdown = {};

    this.abilities.resonant_volley.reset(0.25);
    this.abilities.voltaic_chain.reset(0.4);
    this.abilities.astral_pulse.reset(1.0);
    this.abilities.seeker_barrage.reset(0.9);
    this.abilities.starbloom_spores.reset(0.65);
    this.abilities.celestial_spear.reset(1.1);
    this.abilities.solar_orbitals.reset();
    this.abilities.echo_conduit.reset();

    this.renderer.reset(this.projectiles, this.spores);
  }

  /** Records damage dealt by an ability (including burn DoT and kills) for post-run breakdown. */
  recordDamage(abilityId, amount, killed = false, isDot = false) {
    if (!abilityId || !(amount > 0)) return;
    const row = (this.damageBreakdown[abilityId] ||= { total: 0, dot: 0, kills: 0 });
    row.total += amount;
    if (isDot) row.dot += amount;
    if (killed) row.kills += 1;
  }

  /** Returns abilities sorted by share of total damage dealt (% + detailed fields). */
  getDamageReport() {
    const rows = Object.entries(this.damageBreakdown);
    const grandTotal = rows.reduce((sum, [, r]) => sum + r.total, 0);
    const entries = rows
      .sort((a, b) => b[1].total - a[1].total)
      .map(([abilityId, r]) => ({
        abilityId,
        pct: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
        rawPct: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
        total: +r.total.toFixed(1),
        dot: +r.dot.toFixed(1),
        kills: r.kills,
      }));
    return { grandTotal: +grandTotal.toFixed(1), entries };
  }

  _withSource(callbacks, sourceAbility) {
    if (!callbacks || callbacks.sourceAbility === sourceAbility) return callbacks;
    let cached = this._sourceCbCache.get(sourceAbility);
    if (!cached || cached._base !== callbacks) {
      cached = { ...callbacks, sourceAbility, _base: callbacks };
      this._sourceCbCache.set(sourceAbility, cached);
    }
    return cached;
  }

  _acquireProjectile() {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (!this.projectiles[i].active) return this.projectiles[i];
    }
    if (this.projectiles.length < MAX_DYNAMIC_PROJECTILES) {
      return this._createProjectileSlot();
    }
    return null;
  }

  _spawnProjectile(spec) {
    const p = this._acquireProjectile();
    if (!p) return null;
    p.spawn(spec);
    this.renderer.syncProjectileSpawn(p);
    return p;
  }

  _spawnSparkSplit(x, y, dmg, tint, enemies, count = 2, sourceAbility = 'resonant_volley') {
    const sorted = BaseAbility.getEnemiesSortedByDist(enemies, x, y, 420);
    const baseAngle =
      sorted.length > 0
        ? Math.atan2(sorted[0].enemy.y - y, sorted[0].enemy.x - x)
        : randRange(0, Math.PI * 2);
    for (let k = 0; k < count; k++) {
      let a;
      if (k < sorted.length) {
        a = Math.atan2(sorted[k].enemy.y - y, sorted[k].enemy.x - x);
      } else {
        a = baseAngle + (k - (count - 1) * 0.5) * 0.65;
      }
      if (
        !this._spawnProjectile({
          kind: 'spark',
          x,
          y,
          angle: a,
          speed: 640,
          damage: dmg,
          pierceLeft: 0,
          turnRate: 0,
          life: 0.68,
          tint,
          scaleX: 0.3,
          scaleY: 0.3,
          sourceAbility,
        })
      ) {
        break;
      }
    }
  }

  spawnForkSparks(
    x,
    y,
    enemies,
    count = 3,
    dmg = 7,
    tint = COLORS.lumenGold,
    sourceAbility = 'resonant_volley'
  ) {
    this._spawnSparkSplit(x, y, dmg, tint, enemies, count, sourceAbility);
  }

  /** Shaves seconds off active weapon cooldown timers (Phantom Slipstream dash talent). */
  shaveCooldowns(sec) {
    if (!(sec > 0)) return;
    for (let i = 0; i < this.abilityList.length; i++) {
      this.abilityList[i].shaveCooldown(sec);
    }
  }

  /** Spawns a persistent bioluminescent hazard pool damaging & slowing entering shadows. */
  spawnLightPool({
    x,
    y,
    radius = 56,
    duration = 2.6,
    dps = 6,
    slow = 0.35,
    tint = COLORS.lumenCyan,
    sourceAbility = 'resonant_volley',
  }) {
    if (!(dps > 0) || !(duration > 0)) return;
    if (this.lightPools.length >= MAX_LIGHT_POOLS) {
      this.lightPools.shift();
    }
    this.lightPools.push(
      new LightPoolModel({ x, y, radius, duration, dps, slow, tint, sourceAbility })
    );
  }

  _updateLightPools(dt, enemies, callbacks, dotPoolMul = 1) {
    for (let i = this.lightPools.length - 1; i >= 0; i--) {
      const pl = this.lightPools[i];
      const stepRes = pl.step(dt, dotPoolMul);
      if (stepRes.expired) {
        this.lightPools.splice(i, 1);
        continue;
      }
      if (stepRes.tickDamage > 0) {
        const cb = this._withSource(callbacks, pl.sourceAbility);
        enemies.damageRadius(pl.x, pl.y, pl.radius, stepRes.tickDamage, 0, pl.slow, cb);
      }
    }
  }

  _updateProjectiles(dt, enemies, particles, callbacks, ctx) {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;

      if (!p.stepKinematics(dt, ctx.boundsW, ctx.boundsH, enemies)) {
        continue;
      }
      this.renderer.syncProjectileTransform(p);

      const projEnemySnap = enemies.enemies.slice();
      for (let j = 0; j < projEnemySnap.length; j++) {
        const e = projEnemySnap[j];
        if (!e || e._removed || e.age < e.spawnDelay || p.hitRefs.has(e)) continue;
        const hitR = e.radius + 9;
        const dSeg = distToSegment(e.x, e.y, p.prevX, p.prevY, p.x, p.y);
        if (dSeg <= hitR) {
          p.hitRefs.add(e);
          const pCb = this._withSource(
            callbacks,
            p.sourceAbility || (p.kind === 'seeker' ? 'seeker_barrage' : 'resonant_volley')
          );
          const spd = Math.max(1, Math.hypot(p.vx, p.vy));
          const isLowHp =
            e.kind === 'core' ? e.shields < (e.maxShields || 30) * 0.45 : e.hp < e.maxHp * 0.45;
          const hitDmg =
            p.executeBonus > 0 && isLowHp ? +(p.damage * (1 + p.executeBonus)).toFixed(3) : p.damage;
          const hitRes = enemies.damageEnemyByRef(
            e,
            hitDmg,
            (p.vx / spd) * 95,
            (p.vy / spd) * 95,
            pCb
          );
          particles.emitMotePickup(p.x, p.y, p.tint);
          if (p.markBonus > 0 && hitRes && !hitRes.killed) {
            e.markTimer = 3.5;
            e.markMul = Math.max(e.markMul || 1, 1 + p.markBonus);
          }
          if (p.burnDps > 0 && hitRes && !hitRes.killed) {
            enemies.applyBurn(
              e,
              p.burnDps,
              p.burnDuration || 2.4,
              p.burnTint || COLORS.lumenGold,
              pCb.sourceAbility
            );
          }
          if (p.kind === 'bolt' && ((hitRes?.killed && p.splitOnKill > 0) || p.impactSparks > 0)) {
            const sparks = p.impactSparks || p.splitOnKill;
            this._spawnSparkSplit(
              hitRes ? hitRes.x : p.x,
              hitRes ? hitRes.y : p.y,
              Math.max(4.5, hitDmg * 0.52),
              p.tint,
              enemies,
              sparks,
              pCb.sourceAbility
            );
          }
          if (
            p.kind === 'seeker' &&
            hitRes?.killed &&
            (hitRes.wasMarked || p.markBonus > 0) &&
            p.killedSalvo > 0
          ) {
            for (let k = 0; k < p.killedSalvo; k++) {
              const nxt = enemies.findNearestTarget(p.x, p.y, 460);
              const ang = nxt
                ? Math.atan2(nxt.enemy.y - p.y, nxt.enemy.x - p.x)
                : randRange(0, Math.PI * 2);
              this._spawnProjectile({
                kind: 'seeker',
                x: p.x,
                y: p.y,
                angle: ang + k * 0.25,
                speed: p.speed,
                damage: +(p.damage * 0.85).toFixed(3),
                pierceLeft: 0,
                turnRate: p.turnRate || 7,
                life: 1.5,
                targetRef: nxt ? nxt.enemy : null,
                tint: COLORS.lumenGold,
                scaleX: 0.3,
                scaleY: 0.3,
                sourceAbility: 'seeker_barrage',
              });
            }
          }
          if (p.splashOnHit > 0) {
            enemies.damageRadius(
              p.x,
              p.y,
              p.splashRadius || 48,
              +(hitDmg * p.splashOnHit).toFixed(3),
              80,
              0.2,
              pCb
            );
            particles.emitShockRing(
              p.x,
              p.y,
              0.12,
              (p.splashRadius || 48) / 52,
              COLORS.lumenGold,
              0.24,
              0.48
            );
          }
          if (p.pierceLeft > 0) {
            p.pierceLeft--;
            if (p.kind === 'seeker') p.targetRef = null;
          } else if (p.ricochetLeft > 0) {
            const nxt = enemies.findNearestTarget(p.x, p.y, 260, p.hitRefs);
            if (nxt) {
              p.ricochetLeft--;
              p.damage = +(p.damage * p.ricochetMul).toFixed(3);
              const rAng = Math.atan2(nxt.enemy.y - p.y, nxt.enemy.x - p.x);
              p.vx = Math.cos(rAng) * p.speed;
              p.vy = Math.sin(rAng) * p.speed;
              p.rotation = rAng;
              this.renderer.syncProjectileTransform(p);
              p.age = 0;
              p.life = Math.max(p.life, 0.55);
              break;
            }
            p.deactivate();
            break;
          } else {
            p.deactivate();
            break;
          }
        }
      }
    }
  }

  _stepPulses(dt) {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pl = this.pulses[i];
      pl.age += dt;
      if (pl.age >= pl.life) {
        this.pulses.splice(i, 1);
      }
    }
  }

  /** Advances all active automatic abilities and renders clean VFX overlays. */
  update(dt, player, enemies, particles, audio, callbacks, ctx) {
    const abilityCtx = this._abilityCtx;
    abilityCtx.player = player;
    abilityCtx.enemies = enemies;
    abilityCtx.particles = particles;
    abilityCtx.audio = audio;
    abilityCtx.callbacks = callbacks;
    abilityCtx.ranks = ctx.ranks;
    abilityCtx.build = ctx.build || EMPTY_BUILD;
    abilityCtx.talentRanks = ctx.talentRanks || {};
    abilityCtx.synergies = ctx.synergies || EMPTY_SET;
    abilityCtx.spiritAccentHex = ctx.spiritAccentHex || COLORS.lumenCyan;
    abilityCtx.spores = this.spores;
    abilityCtx.spears = this.spears;
    abilityCtx.orbitalPos = this.orbitalPos;
    abilityCtx.orbitRays = this.orbitRays;

    const echoFx = abilityCtx.getTalentFx('echo_conduit');
    const mods = this.abilities.echo_conduit.computeGlobalModifiers({
      ranks: abilityCtx.ranks,
      build: abilityCtx.build,
      echoFx,
      synergies: abilityCtx.synergies,
      upgradeHasteMul: ctx.upgradeHasteMul,
      upgradeDmgMul: ctx.upgradeDmgMul,
      arcReachMul: ctx.arcReachMul,
    });

    abilityCtx.echoFx = echoFx;
    abilityCtx.hasteMul = mods.hasteMul;
    abilityCtx.globalDmgMul = mods.globalDmgMul;
    abilityCtx.reachMul = mods.reachMul;
    abilityCtx.primaryTint = abilityCtx.spiritAccentHex;

    for (let i = 0; i < this.abilityList.length; i++) {
      this.abilityList[i].update(dt, abilityCtx);
    }

    this._updateProjectiles(dt, enemies, particles, callbacks, ctx);
    this._updateLightPools(dt, enemies, callbacks, 1);
    this.abilities.celestial_spear.updateSpears(dt, abilityCtx);
    this._stepPulses(dt);

    this.renderer.renderFrame({
      player,
      tint: abilityCtx.primaryTint,
      orbitalSt: abilityCtx.build.solar_orbitals,
      orbitalRank: abilityCtx.getRank('solar_orbitals'),
      reachMul: mods.reachMul,
      orbitSurgeActive: this.abilities.solar_orbitals.surgeActive,
      orbitalPos: this.orbitalPos,
      orbitRays: this.orbitRays,
      lightPools: this.lightPools,
      projectiles: this.projectiles,
      spears: this.spears,
      pulses: this.pulses,
    });
  }
}
