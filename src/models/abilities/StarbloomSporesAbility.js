import { COLORS } from '../../core/Constants.js';
import { randRange } from '../../core/MathUtils.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Starbloom Spores (`starbloom_spores`) — drifting bioluminescent proximity mines.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class StarbloomSporesAbility extends BaseAbility {
  constructor() {
    super('starbloom_spores', 1.25);
    this.timer = 0.7;
  }

  reset(initialDelay = 0.65) {
    super.reset(initialDelay);
  }

  spawnSpore(
    x,
    y,
    vx,
    vy,
    st,
    dmgMul,
    reachMul,
    tint,
    chainPollen = 0,
    fx = null,
    globalDmgMul = 1,
    canMitosis = true,
    ctx = null
  ) {
    const spores = ctx?.spores || [];
    let slot = null;
    let oldest = null;
    for (let i = 0; i < spores.length; i++) {
      const s = spores[i];
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

    ctx?.onSporeSpawn?.(slot);
    return slot;
  }

  detonateSpore(sp, ctx) {
    const { enemies, particles, audio } = ctx;
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
    ctx.onSporeDeactivate?.(sp);

    const sporeCb = ctx.withSource(this.id);
    enemies.damageRadius(sx, sy, sp.burstRadius, sp.damage, 140, sp.slow, sporeCb);
    if (sp.burnDps > 0) {
      enemies.applyBurnRadius?.(sx, sy, sp.burstRadius, sp.burnDps, 2.6, sTint, this.id);
    }
    if (sp.poolDps > 0) {
      ctx.spawnLightPool?.({
        x: sx,
        y: sy,
        radius: 76,
        duration: 3.2,
        dps: sp.poolDps,
        slow: 0.45,
        tint: sTint,
        sourceAbility: this.id,
      });
    }
    particles?.emitShockRing(sx, sy, 0.16, sp.burstRadius / 56, sTint, 0.42, 0.66);
    particles?.emitMotePickup(sx, sy, sTint);
    ctx.addPulse?.({ x: sx, y: sy, radius: sp.burstRadius, age: 0, life: 0.36, color: sTint });

    if (sp.chainPollen > 0) {
      ctx.spawnSparkSplit?.(
        sx,
        sy,
        Math.max(4.8, baseDmg * 0.55),
        sTint,
        enemies,
        sp.chainPollen,
        this.id
      );
    }
    if (doMitosis) {
      this.spawnSpore(
        sx + randRange(-18, 18),
        sy + randRange(-18, 18),
        0,
        0,
        stRef,
        baseDmg / (fxRef?.dmgMul || 1),
        reachMul,
        sTint,
        0,
        fxRef,
        gDmg,
        false,
        ctx
      );
    }
    audio?.playBolt?.(false);
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    const { player, enemies, hasteMul, globalDmgMul, reachMul, primaryTint } = ctx;
    const spores = ctx.spores || [];

    if (rank > 0) {
      const st = ctx.getBuild(this.id);
      const fx = ctx.getTalentFx(this.id);
      const movingSpeed = Math.hypot(player.vx || 0, player.vy || 0);
      const rateMul = st?.rateMul || 1;
      const paceMul = rateMul * (movingSpeed > 130 ? 1.45 : 1);
      if (this.tickCooldown(dt, hasteMul, paceMul)) {
        const maxActive = 4 + (st?.maxAdd || 0);
        ctx.ensureSporeCapacity?.(maxActive);
        let activeCount = 0;
        for (let i = 0; i < spores.length; i++) {
          if (spores[i].active) activeCount++;
        }
        if (activeCount < maxActive) {
          const backAngle = (player.facingAngle || 0) + Math.PI + randRange(-0.55, 0.55);
          const spawnDist = movingSpeed > 90 ? 18 : 26;
          const chainPollen = rank >= 10 ? 3 : rank >= 5 ? 2 : 0;
          this.spawnSpore(
            player.x + Math.cos(backAngle) * spawnDist,
            player.y + Math.sin(backAngle) * spawnDist,
            Math.cos(backAngle) * 32 + randRange(-14, 14),
            Math.sin(backAngle) * 32 + randRange(-14, 14),
            st,
            10 * (st?.dmgMul || 1) * globalDmgMul,
            reachMul,
            primaryTint,
            chainPollen,
            fx,
            globalDmgMul,
            true,
            ctx
          );
          ctx.onOverclockCast?.();
          this.timer = 1.25;
        } else {
          this.timer = 0.2;
        }
      }
    }

    for (let i = 0; i < spores.length; i++) {
      const sp = spores[i];
      if (!sp.active) continue;

      sp.age += dt;
      if (sp.age >= sp.life) {
        sp.active = false;
        ctx.onSporeDeactivate?.(sp);
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
      ctx.onSporeUpdate?.(sp);

      if (sp.age < sp.armDelay) continue;

      let triggered = false;
      const list = enemies.enemies;
      for (let j = list.length - 1; j >= 0; j--) {
        const e = list[j];
        if (!e || e._removed || e.age < e.spawnDelay) continue;
        const hitR = e.radius + sp.triggerRadius;
        const dx = e.x - sp.x;
        const dy = e.y - sp.y;
        if (dx * dx + dy * dy <= hitR * hitR) {
          triggered = true;
          break;
        }
      }
      if (triggered) {
        this.detonateSpore(sp, ctx);
      }
    }
  }
}
