import { Container, Graphics, Sprite } from 'pixi.js';
import { COLORS, STARLIGHT_CONFIG, getGroupTalentEffects } from '../core/Constants.js';
import { clamp, distToSegment, randRange, wrapAngle } from '../core/MathUtils.js';

const INITIAL_PROJECTILES = 96;
const MAX_DYNAMIC_PROJECTILES = 420;
const INITIAL_ORBITALS = 10;
const INITIAL_SPORES = 20;
const MAX_LIGHT_POOLS = 36;
const EMPTY_BUILD = {};
const EMPTY_SET = new Set();
const HEAVY_KINDS = new Set(['core', 'warden', 'vortex', 'lancer', 'artillery', 'harbinger', 'behemoth']);

function isHeavyTarget(e) {
  return Boolean(e?.isElite || HEAVY_KINDS.has(e?.kind));
}

/**
 * Manages Lumen's automatic standard weapon (Starlight Bolt) and all
 * zero-button automatic Damage Ability Cards.
 */
export class AbilityManager {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.fxGraphics = new Graphics();
    this.sporeLayer = new Container();
    this.spriteLayer = new Container();
    this.container.addChild(this.fxGraphics, this.sporeLayer, this.spriteLayer);

    this.projectiles = [];
    for (let i = 0; i < INITIAL_PROJECTILES; i++) {
      this._createProjectileSlot();
    }

    this.orbitSprites = [];
    this.orbitalPos = [];
    this._ensureOrbitalCapacity(INITIAL_ORBITALS);

    // Drifting bioluminescent Starbloom Spore pool (expands dynamically without hard caps)
    this.spores = [];
    this._ensureSporeCapacity(INITIAL_SPORES);

    this.spears = [];
    this.pulses = [];
    this.echoPulses = [];
    this.lightPools = [];
    this.orbitRays = [];
    this.damageBreakdown = {};
    this.boltVolleyCount = 0;
    this.boltFanIdx = 0;
    this.boltCresIdx = 0;
    this.mirrorCastIdx = 0;
    this.radiantHitCount = 0;
    this.overclockCastCount = 0;

    this.boltTimer = 0.25;
    this.voltaicTimer = 0.45;
    this.pulseTimer = 1.2;
    this.seekerTimer = 1.0;
    this.sporeTimer = 0.7;
    this.spearTimer = 1.3;
    this.orbitalPulseTimer = 1.1;
    this.chromaticWaveTimer = 4.0;
    this.orbitSurgeTimer = 0;
    this.orbitSurgeActive = 0;
    this.orbitAngle = 0;
  }

  _createProjectileSlot() {
    const sprite = new Sprite(this.textures.streak);
    sprite.anchor.set(0.5);
    sprite.blendMode = 'add';
    sprite.visible = false;
    this.spriteLayer.addChild(sprite);
    const slot = {
      active: false,
      kind: 'bolt',
      sprite,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      speed: 740,
      turnRate: 0,
      damage: 1,
      pierceLeft: 0,
      age: 0,
      life: 1.2,
      targetRef: null,
      sourceAbility: 'resonant_volley',
      hitRefs: new Set(),
    };
    this.projectiles.push(slot);
    return slot;
  }

  _ensureOrbitalCapacity(target) {
    while (this.orbitSprites.length < target) {
      const sprite = new Sprite(this.textures.sparkStar);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.visible = false;
      this.spriteLayer.addChild(sprite);
      this.orbitSprites.push(sprite);
      this.orbitalPos.push({ x: 0, y: 0, active: false });
    }
  }

  _ensureSporeCapacity(target) {
    while (this.spores.length < target) {
      const root = new Container();
      root.visible = false;

      const halo = new Sprite(this.textures.glowSoft);
      halo.anchor.set(0.5);
      halo.blendMode = 'add';
      halo.tint = COLORS.lumenCyan;
      halo.scale.set(0.48);
      halo.alpha = 0.42;

      const ring = new Sprite(this.textures.ring);
      ring.anchor.set(0.5);
      ring.blendMode = 'add';
      ring.tint = COLORS.lumenCyan;
      ring.scale.set(0.32);
      ring.alpha = 0.56;

      const bud = new Sprite(this.textures.diamond);
      bud.anchor.set(0.5);
      bud.tint = 0xdffef9;
      bud.scale.set(0.3);
      bud.alpha = 0.98;

      const glint = new Sprite(this.textures.sparkStar);
      glint.anchor.set(0.5);
      glint.blendMode = 'add';
      glint.tint = COLORS.lumenGold;
      glint.scale.set(0.26);
      glint.alpha = 0.9;

      root.addChild(halo, ring, bud, glint);
      this.sporeLayer.addChild(root);
      this.spores.push({
        active: false,
        root,
        halo,
        ring,
        bud,
        glint,
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
      p.active = false;
      p.sprite.visible = false;
      p.targetRef = null;
      p.hitRefs.clear();
    }
    for (const s of this.orbitSprites) {
      s.visible = false;
    }
    for (const sp of this.spores) {
      sp.active = false;
      sp.root.visible = false;
    }
    this.spears.length = 0;
    this.pulses.length = 0;
    this.echoPulses.length = 0;
    this.lightPools.length = 0;
    this.orbitRays.length = 0;
    this.damageBreakdown = {};
    this.boltVolleyCount = 0;
    this.boltFanIdx = 0;
    this.boltCresIdx = 0;
    this.mirrorCastIdx = 0;
    this.radiantHitCount = 0;
    this.overclockCastCount = 0;
    this.fxGraphics.clear();

    this.boltTimer = 0.25;
    this.voltaicTimer = 0.4;
    this.pulseTimer = 1.0;
    this.seekerTimer = 0.9;
    this.sporeTimer = 0.65;
    this.spearTimer = 1.1;
    this.orbitalPulseTimer = 1.1;
    this.chromaticWaveTimer = 4.0;
    this.orbitSurgeTimer = 0;
    this.orbitSurgeActive = 0;
    this.orbitAngle = 0;
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
    return { ...callbacks, sourceAbility };
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

  _spawnProjectile({
    kind,
    x,
    y,
    angle,
    speed,
    damage = 10,
    pierceLeft = 0,
    ricochetLeft = 0,
    ricochetMul = 0.7,
    turnRate = 0,
    life = 1.2,
    targetRef = null,
    tint = COLORS.lumenCyan,
    scaleX = 0.44,
    scaleY = 0.2,
    splitOnKill = 0,
    impactSparks = 0,
    splashOnHit = 0,
    splashRadius = 48,
    burnDps = 0,
    burnDuration = 0,
    burnTint = COLORS.lumenGold,
    markBonus = 0,
    executeBonus = 0,
    killedSalvo = 0,
    sourceAbility = null,
  }) {
    const p = this._acquireProjectile();
    if (!p) return null;
    p.active = true;
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.prevX = x;
    p.prevY = y;
    p.speed = speed;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.damage = damage;
    p.pierceLeft = pierceLeft;
    p.ricochetLeft = ricochetLeft;
    p.ricochetMul = ricochetMul;
    p.turnRate = turnRate;
    p.age = 0;
    p.life = life;
    p.targetRef = targetRef;
    p.splitOnKill = splitOnKill;
    p.impactSparks = impactSparks;
    p.splashOnHit = splashOnHit;
    p.splashRadius = splashRadius;
    p.burnDps = burnDps;
    p.burnDuration = burnDuration;
    p.burnTint = burnTint;
    p.markBonus = markBonus;
    p.executeBonus = executeBonus;
    p.killedSalvo = killedSalvo;
    p.sourceAbility = sourceAbility || (kind === 'seeker' ? 'seeker_barrage' : 'resonant_volley');
    p.hitRefs.clear();

    p.sprite.texture =
      kind === 'seeker' || kind === 'spark' ? this.textures.sparkStar : this.textures.streak;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.rotation = angle;
    p.sprite.tint = tint;
    p.sprite.scale.set(scaleX, scaleY);
    p.sprite.alpha = 0.98;
    p.sprite.visible = true;
    return p;
  }

  _spawnSparkSplit(x, y, dmg, tint, enemies, count = 2, sourceAbility = 'resonant_volley') {
    const sorted = this._getEnemiesSortedByDist(enemies, x, y, 420);
    const baseAngle = sorted.length > 0
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

  spawnForkSparks(x, y, enemies, count = 3, dmg = 7, tint = COLORS.lumenGold, sourceAbility = 'resonant_volley') {
    this._spawnSparkSplit(x, y, dmg, tint, enemies, count, sourceAbility);
  }

  /** Shaves seconds off active weapon cooldown timers (Phantom Slipstream dash talent). */
  shaveCooldowns(sec) {
    if (!(sec > 0)) return;
    this.boltTimer = Math.max(0.02, this.boltTimer - sec);
    this.voltaicTimer = Math.max(0.02, this.voltaicTimer - sec);
    this.pulseTimer = Math.max(0.02, this.pulseTimer - sec);
    this.seekerTimer = Math.max(0.02, this.seekerTimer - sec);
    this.sporeTimer = Math.max(0.02, this.sporeTimer - sec);
    this.spearTimer = Math.max(0.02, this.spearTimer - sec);
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
    this.lightPools.push({
      x,
      y,
      radius,
      age: 0,
      life: duration,
      dps,
      slow,
      tint,
      sourceAbility,
      tickTimer: 0.06,
    });
  }

  _updateLightPools(dt, enemies, callbacks, dotPoolMul = 1) {
    for (let i = this.lightPools.length - 1; i >= 0; i--) {
      const pl = this.lightPools[i];
      pl.age += dt;
      if (pl.age >= pl.life) {
        this.lightPools.splice(i, 1);
        continue;
      }
      pl.tickTimer -= dt;
      if (pl.tickTimer <= 0) {
        pl.tickTimer = 0.25;
        const tickDmg = +(pl.dps * 0.25 * dotPoolMul).toFixed(3);
        const cb = this._withSource(callbacks, pl.sourceAbility);
        enemies.damageRadius(pl.x, pl.y, pl.radius, tickDmg, 0, pl.slow, cb);
      }
    }
  }

  _getEnemiesSortedByDist(enemies, cx, cy, maxRange) {
    const maxSq = maxRange * maxRange;
    const matches = [];
    for (let i = 0; i < enemies.enemies.length; i++) {
      const e = enemies.enemies[i];
      if (e.age < e.spawnDelay) continue;
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dSq = dx * dx + dy * dy;
      if (dSq <= maxSq) {
        matches.push({ enemy: e, dSq });
      }
    }
    matches.sort((a, b) => a.dSq - b.dSq);
    return matches;
  }

  _shouldMirrorCast(echoFx) {
    if (!(echoFx?.mirrorEvery > 0)) return false;
    this.mirrorCastIdx = (this.mirrorCastIdx + 1) % echoFx.mirrorEvery;
    return this.mirrorCastIdx === 0;
  }

  /** Advances all active automatic abilities and renders clean VFX overlays. */
  update(dt, player, enemies, particles, audio, callbacks, ctx) {
    const ranks = ctx.ranks;
    const build = ctx.build || EMPTY_BUILD;
    const tRanks = ctx.talentRanks || {};
    const getRank = (id) => Math.max(build[id]?.rank || 0, ranks.get(id) || 0);
    const tfx = (id) => (getRank(id) > 0 ? getGroupTalentEffects(id, tRanks) : null);
    const echoFx = tfx('echo_conduit');
    const synergies = ctx.synergies || EMPTY_SET;
    let evoCount = 0;
    for (const r of ranks.values()) {
      if (r >= 5) evoCount++;
    }
    const synAndEvo = synergies.size + evoCount;
    const echoRank = getRank('echo_conduit');
    const overclockHaste = echoRank >= 10 ? 0.2 : echoRank >= 5 ? 0.12 : 0;
    const hasteMul =
      (build.echo_conduit?.hasteMul || 1) *
      (ctx.upgradeHasteMul || 1) *
      (echoFx?.hasteMul || 1) *
      (1 + overclockHaste);
    const globalDmgMul =
      (build.echo_conduit?.globalDmgMul || 1) *
      (ctx.upgradeDmgMul || 1) *
      (echoFx?.globalDmgMul || 1) *
      (1 + synAndEvo * (echoFx?.synergyDmgBonus || 0));
    const reachMul = (ctx.arcReachMul || 1) * (echoFx?.reachMul || 1);
    const primaryTint = ctx.spiritAccentHex || COLORS.lumenCyan;

    const triggerOverclockRipple = () => {
      if (echoRank < 5) return;
      this.overclockCastCount = (this.overclockCastCount + 1) % 5;
      if (this.overclockCastCount !== 0) return;
      const rippleR = (echoRank >= 10 ? 220 : 180) * reachMul;
      const rippleDmg = +((echoRank >= 10 ? 8.5 : 4.5) * globalDmgMul).toFixed(3);
      enemies.damageRadius(
        player.x,
        player.y,
        rippleR,
        rippleDmg,
        90,
        0.55,
        this._withSource(callbacks, 'echo_conduit')
      );
      particles.emitShockRing(player.x, player.y, 0.14, rippleR / 58, COLORS.lumenViolet, 0.34, 0.56);
      this.pulses.push({ x: player.x, y: player.y, radius: rippleR, age: 0, life: 0.32, color: COLORS.lumenViolet });
    };

    if (echoFx?.chromaticWaveDmg > 0) {
      this.chromaticWaveTimer -= dt * hasteMul;
      if (this.chromaticWaveTimer <= 0) {
        const waveR = 165 * reachMul;
        const near = enemies.findNearestTarget(player.x, player.y, waveR);
        if (near) {
          this.chromaticWaveTimer = 4.0;
          const waveCb = this._withSource(callbacks, 'echo_conduit');
          enemies.damageRadius(
            player.x,
            player.y,
            waveR,
            +(echoFx.chromaticWaveDmg * globalDmgMul).toFixed(3),
            120,
            0.35,
            waveCb
          );
          particles.emitShockRing(player.x, player.y, 0.16, waveR / 58, COLORS.lumenCyan, 0.36, 0.56);
          this.pulses.push({ x: player.x, y: player.y, radius: waveR, age: 0, life: 0.36, color: COLORS.lumenGold });
        } else {
          this.chromaticWaveTimer = 0.25;
        }
      }
    }

    const castCtx = { ...ctx, onOverclockCast: triggerOverclockRipple };
    this._updateStarlightBolts(dt, player, enemies, audio, hasteMul, globalDmgMul, reachMul, primaryTint, castCtx, build.resonant_volley, getRank('resonant_volley'), tfx('resonant_volley'), echoFx, synergies);
    this._updateOrbitals(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, primaryTint, callbacks, build.solar_orbitals, getRank('solar_orbitals'), tfx('solar_orbitals'), synergies);
    this._updateVoltaicArc(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, build.voltaic_chain, getRank('voltaic_chain'), tfx('voltaic_chain'), echoFx, synergies, triggerOverclockRipple);
    this._updateAstralPulse(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, build.astral_pulse, getRank('astral_pulse'), tfx('astral_pulse'), synergies, triggerOverclockRipple);
    this._updateEchoPulses(dt, player, enemies, particles, callbacks);
    this._updateSeekerBarrage(dt, player, enemies, audio, hasteMul, globalDmgMul, reachMul, castCtx, build.seeker_barrage, getRank('seeker_barrage'), tfx('seeker_barrage'), echoFx);
    this._updateStarbloomSpores(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, primaryTint, callbacks, build.starbloom_spores, getRank('starbloom_spores'), tfx('starbloom_spores'), triggerOverclockRipple);
    this._updateCelestialSpear(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, build.celestial_spear, getRank('celestial_spear'), tfx('celestial_spear'), echoFx, synergies, triggerOverclockRipple);

    this._updateProjectiles(dt, enemies, particles, callbacks, ctx);
    this._updateLightPools(dt, enemies, callbacks, 1);
    this._renderFx(dt, player, enemies, particles, callbacks, primaryTint, build.solar_orbitals, getRank('solar_orbitals'), reachMul);
  }

  _updateEchoPulses(dt, player, enemies, particles, callbacks) {
    for (let i = this.echoPulses.length - 1; i >= 0; i--) {
      const ep = this.echoPulses[i];
      ep.delay -= dt;
      if (ep.delay > 0) continue;
      this.echoPulses.splice(i, 1);
      const px = ep.x ?? player.x;
      const py = ep.y ?? player.y;
      const pulseCb = this._withSource(callbacks, ep.sourceAbility || 'astral_pulse');
      const hits = enemies.damageRadius(px, py, ep.radius, ep.dmg, ep.knock, ep.slow, pulseCb);
      if (ep.dashRefund > 0 && hits >= 2) {
        callbacks.onDashRestore?.(ep.dashRefund);
      }
      particles.emitShockRing(px, py, 0.16, ep.radius / 58, ep.tint, 0.36, 0.52);
      this.pulses.push({ x: px, y: py, radius: ep.radius, age: 0, life: 0.3, color: ep.tint });
    }
  }

  _updateStarlightBolts(dt, player, enemies, audio, hasteMul, globalDmgMul, reachMul, tint, ctx, st, rank, fx = null, echoFx = null, synergies = EMPTY_SET) {
    if (rank <= 0) return;
    const rateMul = st?.rateMul || 1;
    this.boltTimer -= dt * hasteMul * rateMul;
    if (this.boltTimer > 0) return;

    const range = STARLIGHT_CONFIG.baseRange * (st?.rangeMul || 1) * reachMul;
    const sorted = this._getEnemiesSortedByDist(enemies, player.x, player.y, range);
    if (sorted.length === 0) {
      this.boltTimer = 0.08;
      return;
    }

    this.boltTimer = Math.max(0.12, STARLIGHT_CONFIG.baseInterval);

    this.boltFanIdx++;
    this.boltCresIdx++;
    const count = 1 + (st?.countAdd || 0);
    const dmg = +(10 * (st?.dmgMul || 1) * (fx?.singleDmgMul || 1) * globalDmgMul).toFixed(3);
    const pierce = st?.pierceAdd || 0;
    const speed = (STARLIGHT_CONFIG.boltSpeed + Math.min(400, (rateMul - 1) * 180)) * (fx?.speedMul || 1);
    const isCrescendo = fx?.crescendoSplashPct > 0 && this.boltCresIdx % 4 === 0;
    const splitOnKill = rank >= 10 ? 3 : rank >= 5 ? 2 : 0;
    const impactSparks = isCrescendo ? fx.crescendoSparks : 0;
    const splashOnHit = isCrescendo ? fx.crescendoSplashPct : 0;
    const burnDps = fx?.burnDps ? +(fx.burnDps * globalDmgMul).toFixed(3) : 0;
    const ricochetLeft = fx?.ricochetCount || 0;
    const ricochetMul = fx?.ricochetMul || 0.7;

    const primary = sorted[0].enemy;
    const baseAngle = Math.atan2(primary.y - player.y, primary.x - player.x);

    const launchBolt = (angle, boltDmg, tintOverride = null) =>
      this._spawnProjectile({
        kind: 'bolt',
        x: player.x + Math.cos(angle) * 14,
        y: player.y + Math.sin(angle) * 14,
        angle,
        speed,
        damage: boltDmg,
        pierceLeft: pierce,
        ricochetLeft,
        ricochetMul,
        turnRate: 0,
        life: (range * 1.15) / speed,
        tint: tintOverride || (boltDmg >= 15 || rank >= 5 || isCrescendo ? COLORS.lumenGold : tint),
        scaleX: count >= 3 || isCrescendo ? 0.52 : 0.46,
        scaleY: boltDmg >= 15 || isCrescendo ? 0.24 : 0.2,
        splitOnKill,
        impactSparks,
        splashOnHit,
        splashRadius: 64,
        burnDps,
        burnDuration: burnDps > 0 ? 2.4 : 0,
        sourceAbility: 'resonant_volley',
      });

    for (let k = 0; k < count; k++) {
      let angle;
      if (k < sorted.length) {
        const tgt = sorted[k].enemy;
        angle = Math.atan2(tgt.y - player.y, tgt.x - player.x);
      } else {
        const spreadOffset = (k - (count - 1) * 0.5) * 0.14;
        angle = baseAngle + spreadOffset;
      }
      if (!launchBolt(angle, dmg)) break;
    }

    if (fx?.fanEvery > 0 && this.boltFanIdx % fx.fanEvery === 0) {
      const fanDmg = +(dmg * fx.fanDmgMul).toFixed(3);
      launchBolt(baseAngle - 0.27, fanDmg);
      launchBolt(baseAngle + 0.27, fanDmg);
    }

    if (this._shouldMirrorCast(echoFx)) {
      launchBolt(baseAngle + 0.08, +(dmg * 0.65).toFixed(3), COLORS.lumenViolet);
    }

    this.boltVolleyCount = (this.boltVolleyCount + 1) % 3;
    if (synergies.has('comet_volley') && this.boltVolleyCount === 0) {
      this._spawnProjectile({
        kind: 'seeker',
        x: player.x,
        y: player.y,
        angle: baseAngle,
        speed: 500,
        damage: +(dmg * 0.95).toFixed(3),
        pierceLeft: 0,
        turnRate: 6.5,
        life: 2.0,
        targetRef: primary,
        tint: COLORS.lumenGold,
        scaleX: 0.36,
        scaleY: 0.36,
        sourceAbility: 'seeker_barrage',
      });
    }

    audio.playBolt?.(false);
    ctx.onOverclockCast?.();
  }

  _updateOrbitals(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, tint, callbacks, st, rank, fx = null, synergies = EMPTY_SET) {
    this.orbitRays.length = 0;
    if (rank <= 0) {
      for (let i = 0; i < this.orbitSprites.length; i++) {
        this.orbitSprites[i].visible = false;
        this.orbitalPos[i].active = false;
      }
      return;
    }

    if (fx?.surgeCooldown > 0) {
      if (this.orbitSurgeActive > 0) {
        this.orbitSurgeActive = Math.max(0, this.orbitSurgeActive - dt);
      } else {
        this.orbitSurgeTimer -= dt * hasteMul;
        if (this.orbitSurgeTimer <= 0) {
          this.orbitSurgeTimer = fx.surgeCooldown;
          this.orbitSurgeActive = 1.6;
          particles.emitShockRing(player.x, player.y, 0.22, 1.8, COLORS.lumenGold, 0.35, 0.45);
        }
      }
    } else {
      this.orbitSurgeActive = 0;
    }

    const isSurging = this.orbitSurgeActive > 0;
    const count = 2 + (st?.countAdd || 0);
    this._ensureOrbitalCapacity(count);
    const sizeMul = Math.min(2.4, st?.sizeMul || 1);
    const radiantBastion = synergies.has('radiant_bastion');
    const bastionSpinMul = radiantBastion && player.shield > 0 ? 1.25 : 1;
    const speedMul = (st?.speedMul || 1) * (fx?.speedMul || 1) * bastionSpinMul;
    const radius = 64 * sizeMul * reachMul * (isSurging ? 1.45 : 1);
    const angSpeed = 2.95 * speedMul * (1 + (hasteMul - 1) * 0.45);
    const baseDmg = +(10 * (st?.dmgMul || 1) * (fx?.dmgMul || 1) * (isSurging ? 1 + (fx?.surgeBonusPct || 0) : 1) * globalDmgMul).toFixed(3);
    const hitCooldown = Math.max(0.14, 0.4 / Math.max(1, speedMul));
    const knock = 145 * (fx?.knockMul || 1);
    const orbCb = this._withSource(callbacks, 'solar_orbitals');
    this.orbitAngle += dt * angSpeed;

    const hitDamage = (e, raw) => {
      const isHeavy = isHeavyTarget(e);
      const isWounded = e.hp < e.maxHp * 0.5;
      return (isHeavy || isWounded) && fx?.eliteExecBonus ? +(raw * (1 + fx.eliteExecBonus)).toFixed(3) : raw;
    };

    for (let i = 0; i < this.orbitSprites.length; i++) {
      const sprite = this.orbitSprites[i];
      if (i >= count) {
        sprite.visible = false;
        this.orbitalPos[i].active = false;
        continue;
      }

      const a = this.orbitAngle + (i * Math.PI * 2) / count;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const ox = player.x + cosA * radius;
      const oy = player.y + sinA * radius;
      this.orbitalPos[i].x = ox;
      this.orbitalPos[i].y = oy;
      this.orbitalPos[i].active = true;

      sprite.x = ox;
      sprite.y = oy;
      sprite.rotation = a + this.orbitAngle * 1.6;
      sprite.tint = baseDmg >= 14 || isSurging ? COLORS.lumenGold : tint;
      sprite.scale.set(0.32 * (1 + (sizeMul - 1) * 0.45));
      sprite.alpha = 0.96;
      sprite.visible = true;

      const rayLen = fx?.rayLen || 0;
      const rx = rayLen > 0 ? ox + cosA * rayLen : ox;
      const ry = rayLen > 0 ? oy + sinA * rayLen : oy;
      if (rayLen > 0) {
        this.orbitRays.push({ ax: ox, ay: oy, bx: rx, by: ry, tint: isSurging ? COLORS.lumenGold : tint });
      }

      const orbEnemySnap = enemies.enemies.slice();
      for (let j = 0; j < orbEnemySnap.length; j++) {
        const e = orbEnemySnap[j];
        if (!e || e._removed || e.age < e.spawnDelay) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const hitR = e.radius + 14 * (1 + (sizeMul - 1) * 0.35);
        if ((e.orbitalHitCooldown || 0) <= 0 && dx * dx + dy * dy <= hitR * hitR) {
          e.orbitalHitCooldown = hitCooldown;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const isHeavy = isHeavyTarget(e);
          const res = enemies.damageEnemyByRef(e, hitDamage(e, baseDmg), (dx / dist) * knock, (dy / dist) * knock, orbCb);
          if (res) {
            if (!res.killed && fx?.staggerSlow > 0) {
              e.slowTimer = Math.max(e.slowTimer || 0, fx.staggerSlow);
            }
            if (isHeavy && fx?.heavyDashCdr > 0) {
              callbacks.onDashCdrSeconds?.(fx.heavyDashCdr);
            }
            if (radiantBastion) {
              this.radiantHitCount = (this.radiantHitCount + 1) % 4;
              if (this.radiantHitCount === 0) {
                callbacks.onRestoreShield?.(2);
              }
            }
            particles.emitMotePickup(ox, oy, tint);
            if (!res.killed) audio.playGraze();
          }
        } else if (rayLen > 0 && (e.rayHitCooldown || 0) <= 0 && distToSegment(e.x, e.y, ox, oy, rx, ry) <= e.radius + 8) {
          e.rayHitCooldown = Math.max(0.22, hitCooldown * 1.1);
          const rayDmg = hitDamage(e, +(baseDmg * fx.rayPct).toFixed(3));
          const res = enemies.damageEnemyByRef(e, rayDmg, cosA * 55, sinA * 55, orbCb);
          if (res) {
            particles.emitMotePickup(e.x, e.y, isSurging ? COLORS.lumenGold : tint);
          }
        }
      }
    }

    if (rank >= 5) {
      this.orbitalPulseTimer -= dt * hasteMul;
      if (this.orbitalPulseTimer <= 0) {
        this.orbitalPulseTimer = rank >= 10 ? 0.82 : 1.15;
        const hits = enemies.damageRadius(
          player.x,
          player.y,
          radius + 14,
          baseDmg * (rank >= 10 ? 0.6 : 0.42),
          75,
          0.25,
          orbCb
        );
        if (hits > 0) {
          particles.emitShockRing(player.x, player.y, 0.25, (radius + 14) / 56, COLORS.lumenGold, 0.32, 0.42);
        }
      }
    }
  }

  _updateVoltaicArc(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, st, rank, fx = null, echoFx = null, synergies = EMPTY_SET, onOverclockCast = null) {
    if (rank <= 0) return;
    const rateMul = st?.rateMul || 1;
    this.voltaicTimer -= dt * hasteMul * rateMul;
    if (this.voltaicTimer > 0) return;

    const tempestEcho = synergies.has('tempest_echo');
    const rMul = (st?.reachMul || 1) * reachMul * (fx?.reachMul || 1) * (tempestEcho ? 1.25 : 1);
    const first = enemies.findNearestTarget(player.x, player.y, 300 * rMul);
    if (!first) {
      this.voltaicTimer = 0.12;
      return;
    }

    this.voltaicTimer = 1.25;
    const maxTargets = 2 + (st?.targetsAdd || 0) + (fx?.extraTargets || 0);
    const baseDmg = +(10 * (st?.dmgMul || 1) * (fx?.dmgMul || 1) * globalDmgMul).toFixed(3);
    const bounceReach = 225 * rMul;
    const arcCb = this._withSource(callbacks, 'voltaic_chain');
    const stormPollen = synergies.has('storm_pollen');

    const runChain = (startEnemy, stepDmg, limit) => {
      const visited = new Set();
      let fromX = player.x;
      let fromY = player.y;
      let current = startEnemy;
      let lastHit = null;
      let hitSteps = 0;

      for (let step = 0; step < limit && current; step++) {
        visited.add(current);
        const tx = current.x;
        const ty = current.y;
        particles.emitChainLightning(fromX, fromY, tx, ty);
        const res = enemies.damageEnemyByRef(current, stepDmg, 0, 0, arcCb);
        if (res && !res.killed && fx?.stunSec > 0) {
          current.slowTimer = Math.max(current.slowTimer || 0, fx.stunSec);
          current.vx *= 0.2;
          current.vy *= 0.2;
        }
        if (res?.killed && fx?.killDashRestore > 0) {
          callbacks.onDashCdrSeconds?.(fx.killDashRestore);
        }
        if (stormPollen) {
          for (let si = 0; si < this.spores.length; si++) {
            const sp = this.spores[si];
            if (!sp.active || sp.age < sp.armDelay) continue;
            if (Math.hypot(sp.x - tx, sp.y - ty) <= 130) {
              particles.emitChainLightning(tx, ty, sp.x, sp.y);
              sp.burstRadius *= 1.35;
              this._detonateSpore(sp, enemies, particles, audio, callbacks);
            }
          }
        }
        lastHit = res && !res.killed ? current : null;
        fromX = tx;
        fromY = ty;
        hitSteps++;
        const next = enemies.findNearestTarget(fromX, fromY, bounceReach, visited);
        current = next ? next.enemy : null;
      }
      return { hitSteps, lastHit, lastX: fromX, lastY: fromY };
    };

    const primary = runChain(first.enemy, baseDmg, maxTargets);
    if (primary.hitSteps < maxTargets && fx?.capPerUnused > 0 && primary.lastHit && enemies.enemies.includes(primary.lastHit)) {
      const capDmg = +((maxTargets - primary.hitSteps) * fx.capPerUnused * baseDmg).toFixed(3);
      enemies.damageEnemyByRef(primary.lastHit, capDmg, 0, 0, arcCb);
      particles.emitShockRing(primary.lastX, primary.lastY, 0.14, 0.9, COLORS.lumenGold, 0.28, 0.56);
    }

    if (fx?.forkPct > 0) {
      const alt = enemies.findNearestTarget(player.x, player.y, 300 * rMul, new Set([first.enemy]));
      if (alt) {
        runChain(alt.enemy, +(baseDmg * fx.forkPct).toFixed(3), Math.max(2, maxTargets - 1));
      }
    }

    if (tempestEcho) {
      const echoAlt = enemies.findNearestTarget(player.x, player.y, 320 * rMul, new Set([first.enemy]));
      const echoStart = echoAlt?.enemy || first.enemy;
      if (echoStart && !echoStart._removed) {
        runChain(echoStart, +(baseDmg * 0.6).toFixed(3), Math.max(2, maxTargets));
      }
    }

    if (this._shouldMirrorCast(echoFx)) {
      const mirrorStart =
        enemies.findNearestTarget(player.x, player.y, 300 * rMul, new Set([first.enemy]))?.enemy ||
        first.enemy;
      if (mirrorStart && !mirrorStart._removed) {
        runChain(mirrorStart, +(baseDmg * 0.65).toFixed(3), maxTargets);
      }
    }

    if (rank >= 5 && primary.hitSteps > 0) {
      const ionR = rank >= 10 ? 96 : 72;
      enemies.damageRadius(primary.lastX, primary.lastY, ionR, baseDmg * (rank >= 10 ? 0.85 : 0.58), 95, 0.35, arcCb);
      particles.emitShockRing(primary.lastX, primary.lastY, 0.14, ionR / 52, COLORS.lumenGold, 0.32, 0.62);
    }

    audio.playBolt?.(true);
    onOverclockCast?.();
  }

  _updateAstralPulse(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, st, rank, fx = null, synergies = EMPTY_SET, onOverclockCast = null) {
    if (rank <= 0) return;
    const rateMul = st?.rateMul || 1;
    this.pulseTimer -= dt * hasteMul * rateMul;
    if (this.pulseTimer > 0) return;

    const radius = Math.min(480, 155 * (st?.radiusMul || 1) * (fx?.radiusMul || 1)) * reachMul;
    const trigger = enemies.findNearestTarget(player.x, player.y, radius * 0.94);
    if (!trigger) {
      this.pulseTimer = 0.12;
      return;
    }

    this.pulseTimer = 3.25;
    const dmg = +(10 * (st?.dmgMul || 1) * (fx?.dmgMul || 1) * globalDmgMul).toFixed(3);
    const knock =
      (fx?.vortexPull || 0) > 0
        ? -175
        : 185 * (1 + ((st?.radiusMul || 1) - 1) * 0.4);
    const slow = +(0.95 * (st?.slowMul || 1)).toFixed(2);
    const pulseTint = dmg >= 14 || rank >= 5 ? COLORS.lumenGold : COLORS.lumenCyan;
    const pulseCb = this._withSource(callbacks, 'astral_pulse');

    const hits = enemies.damageRadius(player.x, player.y, radius, dmg, knock, slow, pulseCb);
    if (fx?.crushDmg > 0 && this.echoPulses.length < 4) {
      this.echoPulses.push({
        radius: Math.max(72, radius * 0.54),
        dmg: +(fx.crushDmg * globalDmgMul).toFixed(3),
        knock: -45,
        slow: 1.1,
        delay: 0.22,
        tint: COLORS.lumenGold,
        sourceAbility: 'astral_pulse',
      });
    }
    if (fx?.twinPct > 0 && this.echoPulses.length < 4) {
      this.echoPulses.push({
        radius: radius * 0.92,
        dmg: +(dmg * fx.twinPct).toFixed(3),
        knock: knock * 0.65,
        slow,
        delay: 0.26,
        tint: pulseTint,
        sourceAbility: 'astral_pulse',
      });
    }
    if (hits > 0 && fx?.siphonPerHit > 0) {
      this.pulseTimer = Math.max(0.45, this.pulseTimer - Math.min(1.1, hits * fx.siphonPerHit));
      callbacks.onEventHorizonPull?.(player.x, player.y, fx.siphonPullRadius);
    }
    if (synergies.has('event_horizon')) {
      callbacks.onEventHorizonPull?.(player.x, player.y, radius * 1.45);
    }
    particles.emitShockRing(
      player.x,
      player.y,
      0.18,
      radius / 58,
      pulseTint,
      0.42,
      0.66
    );
    this.pulses.push({ x: player.x, y: player.y, radius, age: 0, life: 0.4, color: pulseTint });
    if (rank >= 5 && this.echoPulses.length < 4) {
      this.echoPulses.push({
        radius: radius * (rank >= 10 ? 0.85 : 0.72),
        dmg: dmg * (rank >= 10 ? 0.82 : 0.62),
        knock: knock * 0.75,
        slow: slow * 1.15,
        delay: 0.26,
        tint: COLORS.lumenGold,
        sourceAbility: 'astral_pulse',
      });
    }
    audio.playBolt?.(true);
    onOverclockCast?.();
  }

  _updateSeekerBarrage(dt, player, enemies, audio, hasteMul, globalDmgMul, reachMul, ctx, st, rank, fx = null, echoFx = null) {
    if (rank <= 0) return;
    const rateMul = st?.rateMul || 1;
    this.seekerTimer -= dt * hasteMul * rateMul;
    if (this.seekerTimer > 0) return;

    const range = 760 * reachMul;
    const sorted = this._getEnemiesSortedByDist(enemies, player.x, player.y, range);
    if (sorted.length === 0) {
      this.seekerTimer = 0.15;
      return;
    }

    this.seekerTimer = 2.3;
    const isMirror = this._shouldMirrorCast(echoFx);
    const baseCount = 2 + (st?.countAdd || 0) + (fx?.extraCount || 0);
    const echoExtra = isMirror ? Math.max(1, Math.ceil(baseCount * 0.5)) : 0;
    const count = baseCount + echoExtra;
    const dmg = +(10 * (st?.dmgMul || 1) * (fx?.dmgMul || 1) * globalDmgMul).toFixed(3);
    const speedMul = Math.min(2.6, (st?.speedMul || 1) * (fx?.speedMul || 1));
    const speed = 490 * speedMul;
    const turnRate = 6.8 * speedMul * (fx?.turnMul || 1);
    const splashOnHit = rank >= 10 ? 0.75 : rank >= 5 ? 0.5 : 0;
    const splashRadius = rank >= 10 ? 64 : 48;

    for (let i = 0; i < count; i++) {
      const target = sorted[i % sorted.length].enemy;
      const baseAngle =
        player.facingAngle + ((i - (count - 1) * 0.5) * 0.95) + randRange(-0.18, 0.18);
      const isEcho = i >= baseCount;
      if (
        !this._spawnProjectile({
          kind: 'seeker',
          x: player.x,
          y: player.y,
          angle: baseAngle,
          speed,
          damage: isEcho ? +(dmg * 0.65).toFixed(3) : dmg,
          pierceLeft: fx?.extraPierce || 0,
          turnRate,
          life: 2.1,
          targetRef: target,
          tint: isEcho ? COLORS.lumenViolet : dmg >= 14 || rank >= 5 ? COLORS.lumenGold : ctx.spiritAccentHex || COLORS.lumenViolet,
          scaleX: 0.34,
          scaleY: 0.34,
          splashOnHit,
          splashRadius,
          markBonus: fx?.markBonus || 0,
          executeBonus: fx?.executeBonus || 0,
          killedSalvo: fx?.killedSalvo || 0,
          sourceAbility: 'seeker_barrage',
        })
      ) {
        break;
      }
    }

    audio.playBolt?.(false);
    ctx.onOverclockCast?.();
  }

  _spawnSpore(x, y, vx, vy, st, dmgMul, reachMul, tint, chainPollen = 0, fx = null, globalDmgMul = 1, canMitosis = true) {
    let slot = null;
    let oldest = null;
    for (let i = 0; i < this.spores.length; i++) {
      const s = this.spores[i];
      if (!s.active) {
        slot = s;
        break;
      }
      if (!oldest || s.age > oldest.age) {
        oldest = s;
      }
    }
    if (!slot) slot = oldest;
    if (!slot) return null;

    const rMul = Math.min(2.6, st?.radiusMul || 1) * (fx?.radiusMul || 1);
    const dmg = +(dmgMul * (fx?.dmgMul || 1)).toFixed(3);
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.age = 0;
    slot.life = 6.8;
    slot.phase = randRange(0, Math.PI * 2);
    slot.armDelay = canMitosis ? 0.22 : 0.35;
    slot.triggerRadius = 29 * (1 + (rMul - 1) * 0.45) * (fx?.triggerMul || 1) * reachMul;
    slot.burstRadius = 78 * rMul * reachMul * (canMitosis ? 1 : 0.72);
    slot.damage = canMitosis ? dmg : +(dmg * 0.75).toFixed(3);
    slot.slow = 0.75;
    slot.tint = dmg >= 14 ? COLORS.lumenGold : tint;
    slot.chainPollen = chainPollen + (fx?.clusterSparks || 0);
    slot.driftSpeed = (fx?.driftMul || 1) > 1 ? 205 * fx.driftMul : 0;
    slot.burnDps = fx?.burnDps ? +(fx.burnDps * globalDmgMul).toFixed(3) : 0;
    slot.poolDps = fx?.poolDps ? +(fx.poolDps * globalDmgMul).toFixed(3) : 0;
    slot.canMitosis = canMitosis && (fx?.mitosisChance || 0) > 0;
    slot.mitosisChance = canMitosis ? fx?.mitosisChance || 0 : 0;
    slot.stRef = st;
    slot.reachMul = reachMul;
    slot.fxRef = fx;
    slot.globalDmgMul = globalDmgMul;

    slot.halo.tint = slot.tint;
    slot.ring.tint = COLORS.lumenCyan;
    slot.glint.tint = dmg >= 14 ? COLORS.lumenCyan : COLORS.lumenGold;
    slot.root.x = x;
    slot.root.y = y;
    slot.root.scale.set(0.2);
    slot.root.alpha = 0;
    slot.root.visible = true;
    return slot;
  }

  _detonateSpore(sp, enemies, particles, audio, callbacks) {
    const sx = sp.x;
    const sy = sp.y;
    const doMitosis = sp.canMitosis && sp.mitosisChance > 0 && Math.random() < sp.mitosisChance;
    const stRef = sp.stRef;
    const reachMul = sp.reachMul || 1;
    const fxRef = sp.fxRef;
    const gDmg = sp.globalDmgMul || 1;
    const baseDmg = sp.damage;
    const sTint = sp.tint;

    sp.active = false;
    sp.root.visible = false;
    const sporeCb = this._withSource(callbacks, 'starbloom_spores');
    enemies.damageRadius(sx, sy, sp.burstRadius, sp.damage, 140, sp.slow, sporeCb);
    if (sp.burnDps > 0) {
      enemies.applyBurnRadius(sx, sy, sp.burstRadius, sp.burnDps, 2.6, sTint, 'starbloom_spores');
    }
    if (sp.poolDps > 0) {
      this.spawnLightPool({
        x: sx,
        y: sy,
        radius: 76,
        duration: 3.2,
        dps: sp.poolDps,
        slow: 0.45,
        tint: sTint,
        sourceAbility: 'starbloom_spores',
      });
    }
    particles.emitShockRing(sx, sy, 0.16, sp.burstRadius / 56, sTint, 0.42, 0.66);
    particles.emitMotePickup(sx, sy, sTint);
    this.pulses.push({ x: sx, y: sy, radius: sp.burstRadius, age: 0, life: 0.36, color: sTint });
    if (sp.chainPollen > 0) {
      this._spawnSparkSplit(sx, sy, Math.max(4.8, baseDmg * 0.55), sTint, enemies, sp.chainPollen, 'starbloom_spores');
    }
    if (doMitosis) {
      this._spawnSpore(sx + randRange(-18, 18), sy + randRange(-18, 18), 0, 0, stRef, baseDmg / (fxRef?.dmgMul || 1), reachMul, sTint, 0, fxRef, gDmg, false);
    }
    audio.playBolt?.(false);
  }

  _updateStarbloomSpores(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, tint, callbacks, st, rank, fx = null, onOverclockCast = null) {
    if (rank > 0) {
      const movingSpeed = Math.hypot(player.vx, player.vy);
      const rateMul = st?.rateMul || 1;
      const paceMul = hasteMul * rateMul * (movingSpeed > 130 ? 1.45 : 1);
      this.sporeTimer -= dt * paceMul;
      if (this.sporeTimer <= 0) {
        const maxActive = 4 + (st?.maxAdd || 0);
        this._ensureSporeCapacity(maxActive);
        let activeCount = 0;
        for (let i = 0; i < this.spores.length; i++) {
          if (this.spores[i].active) activeCount++;
        }
        if (activeCount < maxActive) {
          const backAngle = player.facingAngle + Math.PI + randRange(-0.55, 0.55);
          const spawnDist = movingSpeed > 90 ? 18 : 26;
          const chainPollen = rank >= 10 ? 3 : rank >= 5 ? 2 : 0;
          this._spawnSpore(
            player.x + Math.cos(backAngle) * spawnDist,
            player.y + Math.sin(backAngle) * spawnDist,
            Math.cos(backAngle) * 32 + randRange(-14, 14),
            Math.sin(backAngle) * 32 + randRange(-14, 14),
            st,
            10 * (st?.dmgMul || 1) * globalDmgMul,
            reachMul,
            tint,
            chainPollen,
            fx,
            globalDmgMul
          );
          onOverclockCast?.();
          this.sporeTimer = 1.25;
        } else {
          this.sporeTimer = 0.2;
        }
      }
    }

    for (let i = 0; i < this.spores.length; i++) {
      const sp = this.spores[i];
      if (!sp.active) continue;

      sp.age += dt;
      if (sp.age >= sp.life) {
        sp.active = false;
        sp.root.visible = false;
        continue;
      }

      const drag = Math.exp(-3.2 * dt);
      sp.vx *= drag;
      sp.vy *= drag;
      if (sp.driftSpeed > 0 && sp.age >= sp.armDelay) {
        const near = enemies.findNearestTarget(sp.x, sp.y, 195);
        if (near) {
          const dx = near.enemy.x - sp.x;
          const dy = near.enemy.y - sp.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          sp.vx += (dx / d) * sp.driftSpeed * dt;
          sp.vy += (dy / d) * sp.driftSpeed * dt;
        }
      }
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;

      const fadeOut = sp.age > sp.life - 0.65 ? clamp((sp.life - sp.age) / 0.65, 0, 1) : 1;
      const bloomIn = clamp(sp.age / 0.24, 0, 1);
      const breathe = 0.92 + Math.sin(sp.age * 4.4 + sp.phase) * 0.1;

      sp.root.x = sp.x;
      sp.root.y = sp.y;
      sp.root.scale.set(bloomIn * breathe);
      sp.root.alpha = fadeOut;
      sp.bud.rotation = sp.age * 1.15 + sp.phase;
      sp.glint.rotation = -sp.age * 1.85;
      sp.ring.scale.set(0.3 + Math.sin(sp.age * 5.2 + sp.phase) * 0.04);

      if (sp.age < sp.armDelay) continue;

      let triggered = false;
      for (let j = enemies.enemies.length - 1; j >= 0; j--) {
        const e = enemies.enemies[j];
        if (e.age < e.spawnDelay) continue;
        const hitR = e.radius + sp.triggerRadius;
        const dx = e.x - sp.x;
        const dy = e.y - sp.y;
        if (dx * dx + dy * dy <= hitR * hitR) {
          triggered = true;
          break;
        }
      }
      if (triggered) {
        this._detonateSpore(sp, enemies, particles, audio, callbacks);
      }
    }
  }

  _fireSpearBeam(ox, oy, angle, beamLen, dmg, maxPierce, wMul, rank, fx, enemies, particles, spearCb) {
    const ax = ox + Math.cos(angle) * 14;
    const ay = oy + Math.sin(angle) * 14;
    const bx = ox + Math.cos(angle) * beamLen;
    const by = oy + Math.sin(angle) * beamLen;

    const hitPad = 14 * (1 + (wMul - 1) * 0.45);
    const hits = [];
    for (let i = 0; i < enemies.enemies.length; i++) {
      const e = enemies.enemies[i];
      if (e.age < e.spawnDelay) continue;
      const dSeg = distToSegment(e.x, e.y, ax, ay, bx, by);
      if (dSeg <= e.radius + hitPad) {
        hits.push({
          enemy: e,
          dist: Math.hypot(e.x - ox, e.y - oy),
        });
      }
    }
    hits.sort((a, b) => a.dist - b.dist);

    const limit = Math.min(maxPierce, hits.length);
    for (let k = 0; k < limit; k++) {
      const target = hits[k].enemy;
      particles.emitMotePickup(target.x, target.y, COLORS.lumenCyan);
      const hitDmg = k === 0 && fx?.firstTargetBonus ? +(dmg * (1 + fx.firstTargetBonus)).toFixed(3) : dmg;
      const res = enemies.damageEnemyByRef(
        target,
        hitDmg,
        Math.cos(angle) * 120,
        Math.sin(angle) * 120,
        spearCb
      );
      if (fx?.prismPct > 0) {
        const sx = res ? res.x : target.x;
        const sy = res ? res.y : target.y;
        const sDmg = +(hitDmg * fx.prismPct).toFixed(3);
        for (const offset of [-0.55, 0.55]) {
          this._spawnProjectile({
            kind: 'spark',
            x: sx,
            y: sy,
            angle: angle + offset,
            speed: 620,
            damage: sDmg,
            pierceLeft: 0,
            turnRate: 0,
            life: 0.48,
            tint: COLORS.lumenGold,
            scaleX: 0.3,
            scaleY: 0.3,
            sourceAbility: 'celestial_spear',
          });
        }
      }
    }

    const baseLife = rank >= 10 ? 0.95 : rank >= 5 ? 0.68 : 0.3;
    const baseScorch = rank >= 5 ? +(dmg * (rank >= 10 ? 0.6 : 0.42)).toFixed(3) : 0;
    const afterScorch = fx?.afterglowPct > 0 ? +(dmg * fx.afterglowPct).toFixed(3) : 0;
    this.spears.push({
      ax,
      ay,
      bx,
      by,
      age: 0,
      life: baseLife + (fx?.afterglowHang || 0),
      width: 4.8 * wMul,
      scorchDmg: Math.max(baseScorch, afterScorch),
      scorchDone: false,
      tint: rank >= 5 || fx?.afterglowPct > 0 ? COLORS.lumenGold : COLORS.lumenCyan,
    });
  }

  _updateCelestialSpear(dt, player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, callbacks, st, rank, fx = null, echoFx = null, synergies = EMPTY_SET, onOverclockCast = null) {
    if (rank <= 0) return;
    const rateMul = st?.rateMul || 1;
    this.spearTimer -= dt * hasteMul * rateMul;
    if (this.spearTimer > 0) return;

    const lock = enemies.findNearestTarget(player.x, player.y, 560 * reachMul);
    if (!lock) {
      this.spearTimer = 0.15;
      return;
    }

    this.spearTimer = 2.85;
    const maxPierce = 3 + (st?.pierceAdd || 0) + (fx?.extraPierce || 0);
    const dmg = +(10 * (st?.dmgMul || 1) * (fx?.dmgMul || 1) * globalDmgMul).toFixed(3);
    const wMul = Math.min(3.2, (st?.widthMul || 1) * (fx?.widthMul || 1));
    const angle = Math.atan2(lock.enemy.y - player.y, lock.enemy.x - player.x);
    const beamLen = 680 * reachMul;
    const spearCb = this._withSource(callbacks, 'celestial_spear');

    this._fireSpearBeam(player.x, player.y, angle, beamLen, dmg, maxPierce, wMul, rank, fx, enemies, particles, spearCb);

    if (fx?.twinPct > 0) {
      const second = enemies.findNearestTarget(player.x, player.y, 580 * reachMul, new Set([lock.enemy]));
      const secAngle = second ? Math.atan2(second.enemy.y - player.y, second.enemy.x - player.x) : angle + 0.38;
      this._fireSpearBeam(player.x, player.y, secAngle, beamLen, +(dmg * fx.twinPct).toFixed(3), maxPierce, wMul * 0.9, rank, null, enemies, particles, spearCb);
    }

    if (this._shouldMirrorCast(echoFx)) {
      this._fireSpearBeam(player.x, player.y, angle - 0.16, beamLen, +(dmg * 0.65).toFixed(3), maxPierce, wMul * 0.85, rank, null, enemies, particles, spearCb);
    }

    if (synergies.has('halo_lance') && this.orbitalPos[0]?.active) {
      const ox = this.orbitalPos[0].x;
      const oy = this.orbitalPos[0].y;
      const oLock = enemies.findNearestTarget(ox, oy, beamLen * 0.9);
      const oAngle = oLock ? Math.atan2(oLock.enemy.y - oy, oLock.enemy.x - ox) : angle;
      this._fireSpearBeam(ox, oy, oAngle, beamLen * 0.85, +(dmg * 0.55).toFixed(3), maxPierce, wMul * 0.85, rank, null, enemies, particles, spearCb);
    }

    audio.playBolt?.(true);
    onOverclockCast?.();
  }

  _updateProjectiles(dt, enemies, particles, callbacks, ctx) {
    const pad = 80;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;

      p.age += dt;
      if (
        p.age >= p.life ||
        p.x < -pad ||
        p.x > ctx.boundsW + pad ||
        p.y < -pad ||
        p.y > ctx.boundsH + pad
      ) {
        p.active = false;
        p.sprite.visible = false;
        continue;
      }

      if (p.kind === 'seeker') {
        if (!p.targetRef || enemies.enemies.indexOf(p.targetRef) === -1) {
          const reacquire = enemies.findNearestTarget(p.x, p.y, 480, p.hitRefs);
          p.targetRef = reacquire ? reacquire.enemy : null;
        }
        if (p.targetRef) {
          const desired = Math.atan2(p.targetRef.y - p.y, p.targetRef.x - p.x);
          let angle = Math.atan2(p.vy, p.vx);
          const diff = wrapAngle(desired - angle);
          angle += clamp(diff, -p.turnRate * dt, p.turnRate * dt);
          p.vx = Math.cos(angle) * p.speed;
          p.vy = Math.sin(angle) * p.speed;
          p.sprite.rotation = angle;
        }
      }

      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      if (p.kind === 'seeker') {
        p.sprite.rotation += dt * 7;
      }

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
          const isLowHp = e.kind === 'core' ? e.shields < (e.maxShields || 30) * 0.45 : e.hp < e.maxHp * 0.45;
          const hitDmg = p.executeBonus > 0 && isLowHp ? +(p.damage * (1 + p.executeBonus)).toFixed(3) : p.damage;
          const hitRes = enemies.damageEnemyByRef(
            e,
            hitDmg,
            (p.vx / spd) * 95,
            (p.vy / spd) * 95,
            pCb
          );
          particles.emitMotePickup(p.x, p.y, p.sprite.tint);
          if (p.markBonus > 0 && hitRes && !hitRes.killed) {
            e.markTimer = 3.5;
            e.markMul = Math.max(e.markMul || 1, 1 + p.markBonus);
          }
          if (p.burnDps > 0 && hitRes && !hitRes.killed) {
            enemies.applyBurn(e, p.burnDps, p.burnDuration || 2.4, p.burnTint || COLORS.lumenGold, pCb.sourceAbility);
          }
          if (p.kind === 'bolt' && ((hitRes?.killed && p.splitOnKill > 0) || p.impactSparks > 0)) {
            const sparks = p.impactSparks || p.splitOnKill;
            this._spawnSparkSplit(
              hitRes ? hitRes.x : p.x,
              hitRes ? hitRes.y : p.y,
              Math.max(4.5, hitDmg * 0.52),
              p.sprite.tint,
              enemies,
              sparks,
              pCb.sourceAbility
            );
          }
          if (p.kind === 'seeker' && hitRes?.killed && (hitRes.wasMarked || p.markBonus > 0) && p.killedSalvo > 0) {
            for (let k = 0; k < p.killedSalvo; k++) {
              const nxt = enemies.findNearestTarget(p.x, p.y, 460);
              const ang = nxt ? Math.atan2(nxt.enemy.y - p.y, nxt.enemy.x - p.x) : randRange(0, Math.PI * 2);
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
            enemies.damageRadius(p.x, p.y, p.splashRadius || 48, +(hitDmg * p.splashOnHit).toFixed(3), 80, 0.2, pCb);
            particles.emitShockRing(p.x, p.y, 0.12, (p.splashRadius || 48) / 52, COLORS.lumenGold, 0.24, 0.48);
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
              p.sprite.rotation = rAng;
              p.age = 0;
              p.life = Math.max(p.life, 0.55);
              break;
            }
            p.active = false;
            p.sprite.visible = false;
            break;
          } else {
            p.active = false;
            p.sprite.visible = false;
            break;
          }
        }
      }
    }
  }

  _renderFx(dt, player, enemies, particles, callbacks, tint, orbitalSt, orbitalRank, reachMul) {
    this.fxGraphics.clear();

    // Persistent bioluminescent Starbloom Mist zones
    for (let i = 0; i < this.lightPools.length; i++) {
      const pl = this.lightPools[i];
      const fade = Math.min(1, (pl.life - pl.age) / 0.55) * Math.min(1, pl.age / 0.16);
      const pulse = 0.62 + 0.14 * Math.sin(pl.age * 5.2 + i);
      const col = pl.tint || COLORS.lumenCyan;
      this.fxGraphics
        .circle(pl.x, pl.y, pl.radius)
        .fill({ color: col, alpha: 0.13 * fade })
        .stroke({ width: 1.8, color: col, alpha: 0.52 * fade });
      this.fxGraphics
        .circle(pl.x, pl.y, pl.radius * pulse)
        .stroke({ width: 1.2, color: COLORS.lumenGold, alpha: 0.28 * fade });
    }

    // Subtle crisp streak tails for active automatic projectiles (taper alpha when dense so enemy telegraphs stay readable)
    let activeProj = 0;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;
      activeProj++;
      this.fxGraphics
        .moveTo(p.x - p.vx * 0.024, p.y - p.vy * 0.024)
        .lineTo(p.x, p.y)
        .stroke({
          width: p.kind === 'bolt' ? 3.2 : 2.3,
          color: p.sprite.tint,
          alpha: 0.54,
        });
    }
    const fxCrowd = Math.max(0, activeProj - 16) + this.orbitRays.length * 1.5 + this.spears.length * 2;
    const densityAlpha = clamp(1 - fxCrowd * 0.0085, 0.54, 1);
    this.spriteLayer.alpha = densityAlpha;
    this.fxGraphics.alpha = densityAlpha;
    this.sporeLayer.alpha = clamp(1 - fxCrowd * 0.004, 0.72, 1);

    // Soft orbital path halo & outward Sunbeam Lasers when Orbiting Blades active
    if (orbitalRank > 0) {
      const sizeMul = Math.min(2.4, orbitalSt?.sizeMul || 1);
      const orbitR = 64 * sizeMul * reachMul * (this.orbitSurgeActive > 0 ? 1.45 : 1);
      const haloStroke = orbitalRank >= 5 || this.orbitSurgeActive > 0
        ? { width: orbitalRank >= 10 ? 2.8 : 2.1, color: COLORS.lumenGold, alpha: 0.48 }
        : { width: 1.5, color: tint, alpha: 0.28 };
      this.fxGraphics
        .circle(player.x, player.y, orbitR)
        .stroke(haloStroke);
      for (let i = 0; i < this.orbitRays.length; i++) {
        const r = this.orbitRays[i];
        this.fxGraphics
          .moveTo(r.ax, r.ay)
          .lineTo(r.bx, r.by)
          .stroke({ width: 5.5, color: r.tint || tint, alpha: 0.34 });
        this.fxGraphics
          .moveTo(r.ax, r.ay)
          .lineTo(r.bx, r.by)
          .stroke({ width: 1.8, color: 0xffffff, alpha: 0.92 });
      }
    }

    // Celestial Spear beams
    for (let i = this.spears.length - 1; i >= 0; i--) {
      const s = this.spears[i];
      s.age += dt;
      if (s.scorchDmg > 0 && !s.scorchDone && s.age >= 0.28) {
        s.scorchDone = true;
        const spearCb = this._withSource(callbacks, 'celestial_spear');
        const scorchSnap = enemies.enemies.slice();
        for (let k = 0; k < scorchSnap.length; k++) {
          const e = scorchSnap[k];
          if (!e || e._removed || e.age < e.spawnDelay) continue;
          if (distToSegment(e.x, e.y, s.ax, s.ay, s.bx, s.by) <= e.radius + 16) {
            enemies.damageEnemyByRef(e, s.scorchDmg, 0, 0, spearCb);
          }
        }
      }
      if (s.age >= s.life) {
        this.spears.splice(i, 1);
        continue;
      }
      const alpha = 1 - s.age / s.life;
      this.fxGraphics
        .moveTo(s.ax, s.ay)
        .lineTo(s.bx, s.by)
        .stroke({ width: s.width * 2.8 * alpha, color: s.tint || COLORS.lumenCyan, alpha: 0.4 * alpha });
      this.fxGraphics
        .moveTo(s.ax, s.ay)
        .lineTo(s.bx, s.by)
        .stroke({ width: s.width * 1.15 * alpha, color: 0xffffff, alpha: 0.96 * alpha });
    }

    // Expanding radial wave outlines (Astral Pulse / Starbloom burst)
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pl = this.pulses[i];
      pl.age += dt;
      if (pl.age >= pl.life) {
        this.pulses.splice(i, 1);
        continue;
      }
      const t = pl.age / pl.life;
      const r = 18 + (pl.radius - 18) * (1 - Math.pow(1 - t, 3));
      this.fxGraphics
        .circle(pl.x, pl.y, r)
        .stroke({ width: 3.0 * (1 - t), color: pl.color || COLORS.lumenCyan, alpha: 0.86 * (1 - t) });
    }
  }
}
