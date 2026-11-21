import { COLORS } from '../../core/Constants.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Astral Pulse (`astral_pulse`) — radial shockwave + delayed echo/crush pulses.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class AstralPulseAbility extends BaseAbility {
  constructor() {
    super('astral_pulse', 3.25);
    this.timer = 1.2;
    this.echoPulses = [];
  }

  reset(initialDelay = 1.0) {
    super.reset(initialDelay);
    this.echoPulses.length = 0;
  }

  _updateEchoPulses(dt, ctx) {
    const { player, enemies, particles, callbacks } = ctx;
    for (let i = this.echoPulses.length - 1; i >= 0; i--) {
      const ep = this.echoPulses[i];
      ep.delay -= dt;
      if (ep.delay > 0) continue;
      this.echoPulses.splice(i, 1);
      const px = ep.x ?? player.x;
      const py = ep.y ?? player.y;
      const pulseCb = ctx.withSource(ep.sourceAbility || this.id);
      const hits = enemies.damageRadius(px, py, ep.radius, ep.dmg, ep.knock, ep.slow, pulseCb);
      if (ep.dashRefund > 0 && hits >= 2) {
        callbacks?.onDashRestore?.(ep.dashRefund);
      }
      particles?.emitShockRing(px, py, 0.16, ep.radius / 58, ep.tint, 0.36, 0.52);
      ctx.addPulse?.({ x: px, y: py, radius: ep.radius, age: 0, life: 0.3, color: ep.tint });
    }
  }

  update(dt, ctx) {
    this._updateEchoPulses(dt, ctx);

    const rank = ctx.getRank(this.id);
    if (rank <= 0) return;

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);
    const rateMul = st?.rateMul || 1;
    if (!this.tickCooldown(dt, ctx.hasteMul, rateMul)) return;

    const { player, enemies, particles, audio, globalDmgMul, reachMul, synergies, callbacks } = ctx;
    const radius = Math.min(480, 155 * (st?.radiusMul || 1) * (fx?.radiusMul || 1)) * reachMul;
    const trigger = enemies.findNearestTarget(player.x, player.y, radius * 0.94);
    if (!trigger) {
      this.timer = 0.12;
      return;
    }

    this.timer = 3.25;
    const dmg = this.computeBaseDamage(st, fx, globalDmgMul);
    const knock =
      (fx?.vortexPull || 0) > 0
        ? -175
        : 185 * (1 + ((st?.radiusMul || 1) - 1) * 0.4);
    const slow = +(0.95 * (st?.slowMul || 1)).toFixed(2);
    const pulseTint = dmg >= 14 || rank >= 5 ? COLORS.lumenGold : COLORS.lumenCyan;
    const pulseCb = ctx.withSource(this.id);

    const hits = enemies.damageRadius(player.x, player.y, radius, dmg, knock, slow, pulseCb);
    if (fx?.crushDmg > 0 && this.echoPulses.length < 4) {
      this.echoPulses.push({
        radius: Math.max(72, radius * 0.54),
        dmg: +(fx.crushDmg * globalDmgMul).toFixed(3),
        knock: -45,
        slow: 1.1,
        delay: 0.22,
        tint: COLORS.lumenGold,
        sourceAbility: this.id,
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
        sourceAbility: this.id,
      });
    }
    if (hits > 0 && fx?.siphonPerHit > 0) {
      this.timer = Math.max(0.45, this.timer - Math.min(1.1, hits * fx.siphonPerHit));
      callbacks?.onEventHorizonPull?.(player.x, player.y, fx.siphonPullRadius);
    }
    if (synergies?.has('event_horizon')) {
      callbacks?.onEventHorizonPull?.(player.x, player.y, radius * 1.45);
    }
    particles?.emitShockRing(player.x, player.y, 0.18, radius / 58, pulseTint, 0.42, 0.66);
    ctx.addPulse?.({ x: player.x, y: player.y, radius, age: 0, life: 0.4, color: pulseTint });

    if (rank >= 5 && this.echoPulses.length < 4) {
      this.echoPulses.push({
        radius: radius * (rank >= 10 ? 0.85 : 0.72),
        dmg: dmg * (rank >= 10 ? 0.82 : 0.62),
        knock: knock * 0.75,
        slow: slow * 1.15,
        delay: 0.26,
        tint: COLORS.lumenGold,
        sourceAbility: this.id,
      });
    }

    audio?.playBolt?.(true);
    ctx.onOverclockCast?.();
  }
}
