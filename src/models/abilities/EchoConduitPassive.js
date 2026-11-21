import { COLORS } from '../../core/Constants.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Echo Conduit (`echo_conduit`) — passive haste/damage scaling, mirror casts,
 * Overclock Ripples (Rank 5/10), and Chromatic Wave pulses.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class EchoConduitPassive extends BaseAbility {
  constructor() {
    super('echo_conduit', 4.0);
    this.mirrorCastIdx = 0;
    this.overclockCastCount = 0;
    this.chromaticWaveTimer = 4.0;
  }

  reset(initialDelay = 0.25) {
    super.reset(initialDelay);
    this.mirrorCastIdx = 0;
    this.overclockCastCount = 0;
    this.chromaticWaveTimer = 4.0;
  }

  shaveCooldown() {
    // Passive conduit does not expose a primary weapon timer to shave.
  }

  computeGlobalModifiers({ ranks, build, echoFx, synergies, upgradeHasteMul, upgradeDmgMul, arcReachMul }) {
    let evoCount = 0;
    if (ranks) {
      for (const r of ranks.values()) {
        if (r >= 5) evoCount++;
      }
    }
    const synAndEvo = (synergies?.size || 0) + evoCount;
    const echoRank = Math.max(build?.echo_conduit?.rank || 0, ranks?.get?.('echo_conduit') || 0);
    const overclockHaste = echoRank >= 10 ? 0.2 : echoRank >= 5 ? 0.12 : 0;
    const hasteMul =
      (build?.echo_conduit?.hasteMul || 1) *
      (upgradeHasteMul || 1) *
      (echoFx?.hasteMul || 1) *
      (1 + overclockHaste);
    const globalDmgMul =
      (build?.echo_conduit?.globalDmgMul || 1) *
      (upgradeDmgMul || 1) *
      (echoFx?.globalDmgMul || 1) *
      (1 + synAndEvo * (echoFx?.synergyDmgBonus || 0));
    const reachMul = (arcReachMul || 1) * (echoFx?.reachMul || 1);

    return { echoRank, hasteMul, globalDmgMul, reachMul };
  }

  shouldMirrorCast(echoFx) {
    if (!(echoFx?.mirrorEvery > 0)) return false;
    this.mirrorCastIdx = (this.mirrorCastIdx + 1) % echoFx.mirrorEvery;
    return this.mirrorCastIdx === 0;
  }

  triggerOverclockRipple(ctx) {
    const echoRank = ctx.getRank(this.id);
    if (echoRank < 5) return;
    this.overclockCastCount = (this.overclockCastCount + 1) % 5;
    if (this.overclockCastCount !== 0) return;

    const { player, enemies, particles, reachMul, globalDmgMul } = ctx;
    const rippleR = (echoRank >= 10 ? 220 : 180) * reachMul;
    const rippleDmg = +((echoRank >= 10 ? 8.5 : 4.5) * globalDmgMul).toFixed(3);
    enemies.damageRadius(
      player.x,
      player.y,
      rippleR,
      rippleDmg,
      90,
      0.55,
      ctx.withSource(this.id)
    );
    particles?.emitShockRing(player.x, player.y, 0.14, rippleR / 58, COLORS.lumenViolet, 0.34, 0.56);
    ctx.addPulse?.({
      x: player.x,
      y: player.y,
      radius: rippleR,
      age: 0,
      life: 0.32,
      color: COLORS.lumenViolet,
    });
  }

  update(dt, ctx) {
    const echoFx = ctx.getTalentFx(this.id);
    if (!(echoFx?.chromaticWaveDmg > 0)) return;

    const { player, enemies, particles, hasteMul, reachMul, globalDmgMul } = ctx;
    this.chromaticWaveTimer -= dt * hasteMul;
    if (this.chromaticWaveTimer > 0) return;

    const waveR = 165 * reachMul;
    const near = enemies.findNearestTarget(player.x, player.y, waveR);
    if (!near) {
      this.chromaticWaveTimer = 0.25;
      return;
    }

    this.chromaticWaveTimer = 4.0;
    const waveCb = ctx.withSource(this.id);
    enemies.damageRadius(
      player.x,
      player.y,
      waveR,
      +(echoFx.chromaticWaveDmg * globalDmgMul).toFixed(3),
      120,
      0.35,
      waveCb
    );
    particles?.emitShockRing(player.x, player.y, 0.16, waveR / 58, COLORS.lumenCyan, 0.36, 0.56);
    ctx.addPulse?.({
      x: player.x,
      y: player.y,
      radius: waveR,
      age: 0,
      life: 0.36,
      color: COLORS.lumenGold,
    });
  }
}
