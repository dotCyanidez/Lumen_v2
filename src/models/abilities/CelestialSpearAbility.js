import { COLORS } from '../../core/Constants.js';
import { distToSegment } from '../../core/MathUtils.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Celestial Spear (`celestial_spear`) — piercing laser beams + afterglow scorch.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class CelestialSpearAbility extends BaseAbility {
  constructor() {
    super('celestial_spear', 2.85);
    this.timer = 1.3;
  }

  reset(initialDelay = 1.1) {
    super.reset(initialDelay);
  }

  fireSpearBeam(ox, oy, angle, beamLen, dmg, maxPierce, wMul, rank, fx, ctx, spearCb) {
    const { enemies, particles } = ctx;
    const ax = ox + Math.cos(angle) * 14;
    const ay = oy + Math.sin(angle) * 14;
    const bx = ox + Math.cos(angle) * beamLen;
    const by = oy + Math.sin(angle) * beamLen;

    const hitPad = 14 * (1 + (wMul - 1) * 0.45);
    const hits = [];
    const list = enemies.enemies;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e || e._removed || e.age < e.spawnDelay) continue;
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
      particles?.emitMotePickup(target.x, target.y, COLORS.lumenCyan);
      const hitDmg =
        k === 0 && fx?.firstTargetBonus ? +(dmg * (1 + fx.firstTargetBonus)).toFixed(3) : dmg;
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
          ctx.spawnProjectile({
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
            sourceAbility: this.id,
          });
        }
      }
    }

    const baseLife = rank >= 10 ? 0.95 : rank >= 5 ? 0.68 : 0.3;
    const baseScorch = rank >= 5 ? +(dmg * (rank >= 10 ? 0.6 : 0.42)).toFixed(3) : 0;
    const afterScorch = fx?.afterglowPct > 0 ? +(dmg * fx.afterglowPct).toFixed(3) : 0;
    ctx.addSpear?.({
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

  updateSpears(dt, ctx) {
    const spears = ctx.spears;
    if (!spears || spears.length === 0) return;
    const { enemies } = ctx;
    const spearCb = ctx.withSource(this.id);
    for (let i = spears.length - 1; i >= 0; i--) {
      const s = spears[i];
      s.age += dt;
      if (s.scorchDmg > 0 && !s.scorchDone && s.age >= 0.28) {
        s.scorchDone = true;
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
        spears.splice(i, 1);
      }
    }
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    if (rank <= 0) return;

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);
    const rateMul = st?.rateMul || 1;
    if (!this.tickCooldown(dt, ctx.hasteMul, rateMul)) return;

    const { player, enemies, audio, globalDmgMul, reachMul, synergies, orbitalPos } = ctx;
    const lock = enemies.findNearestTarget(player.x, player.y, 560 * reachMul);
    if (!lock) {
      this.timer = 0.15;
      return;
    }

    this.timer = 2.85;
    const maxPierce = 3 + (st?.pierceAdd || 0) + (fx?.extraPierce || 0);
    const dmg = this.computeBaseDamage(st, fx, globalDmgMul);
    const wMul = Math.min(3.2, (st?.widthMul || 1) * (fx?.widthMul || 1));
    const angle = Math.atan2(lock.enemy.y - player.y, lock.enemy.x - player.x);
    const beamLen = 680 * reachMul;
    const spearCb = ctx.withSource(this.id);

    this.fireSpearBeam(player.x, player.y, angle, beamLen, dmg, maxPierce, wMul, rank, fx, ctx, spearCb);

    if (fx?.twinPct > 0) {
      const second = enemies.findNearestTarget(
        player.x,
        player.y,
        580 * reachMul,
        new Set([lock.enemy])
      );
      const secAngle = second
        ? Math.atan2(second.enemy.y - player.y, second.enemy.x - player.x)
        : angle + 0.38;
      this.fireSpearBeam(
        player.x,
        player.y,
        secAngle,
        beamLen,
        +(dmg * fx.twinPct).toFixed(3),
        maxPierce,
        wMul * 0.9,
        rank,
        null,
        ctx,
        spearCb
      );
    }

    if (ctx.shouldMirrorCast?.()) {
      this.fireSpearBeam(
        player.x,
        player.y,
        angle - 0.16,
        beamLen,
        +(dmg * 0.65).toFixed(3),
        maxPierce,
        wMul * 0.85,
        rank,
        null,
        ctx,
        spearCb
      );
    }

    if (synergies?.has('halo_lance') && orbitalPos?.[0]?.active) {
      const ox = orbitalPos[0].x;
      const oy = orbitalPos[0].y;
      const oLock = enemies.findNearestTarget(ox, oy, beamLen * 0.9);
      const oAngle = oLock ? Math.atan2(oLock.enemy.y - oy, oLock.enemy.x - ox) : angle;
      this.fireSpearBeam(
        ox,
        oy,
        oAngle,
        beamLen * 0.85,
        +(dmg * 0.55).toFixed(3),
        maxPierce,
        wMul * 0.85,
        rank,
        null,
        ctx,
        spearCb
      );
    }

    audio?.playBolt?.(true);
    ctx.onOverclockCast?.();
  }
}
