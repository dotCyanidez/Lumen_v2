import { COLORS } from '../../core/Constants.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Voltaic Arc (`voltaic_chain`) — chain lightning bouncing between shadows and spores.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class VoltaicArcAbility extends BaseAbility {
  constructor() {
    super('voltaic_chain', 1.25);
    this.timer = 0.45;
  }

  reset(initialDelay = 0.4) {
    super.reset(initialDelay);
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    if (rank <= 0) return;

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);
    const rateMul = st?.rateMul || 1;
    if (!this.tickCooldown(dt, ctx.hasteMul, rateMul)) return;

    const { player, enemies, particles, audio, globalDmgMul, reachMul, synergies, callbacks } = ctx;
    const tempestEcho = Boolean(synergies?.has('tempest_echo'));
    const rMul = (st?.reachMul || 1) * reachMul * (fx?.reachMul || 1) * (tempestEcho ? 1.25 : 1);
    const first = enemies.findNearestTarget(player.x, player.y, 300 * rMul);
    if (!first) {
      this.timer = 0.12;
      return;
    }

    this.timer = 1.25;
    const maxTargets = 2 + (st?.targetsAdd || 0) + (fx?.extraTargets || 0);
    const baseDmg = this.computeBaseDamage(st, fx, globalDmgMul);
    const bounceReach = 225 * rMul;
    const arcCb = ctx.withSource(this.id);
    const stormPollen = Boolean(synergies?.has('storm_pollen'));
    const spores = ctx.spores || [];

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
        particles?.emitChainLightning(fromX, fromY, tx, ty);
        const res = enemies.damageEnemyByRef(current, stepDmg, 0, 0, arcCb);
        if (res && !res.killed && fx?.stunSec > 0) {
          current.slowTimer = Math.max(current.slowTimer || 0, fx.stunSec);
          current.vx *= 0.2;
          current.vy *= 0.2;
        }
        if (res?.killed && fx?.killDashRestore > 0) {
          callbacks?.onDashCdrSeconds?.(fx.killDashRestore);
        }
        if (stormPollen) {
          for (let si = 0; si < spores.length; si++) {
            const sp = spores[si];
            if (!sp.active || sp.age < sp.armDelay) continue;
            if (Math.hypot(sp.x - tx, sp.y - ty) <= 130) {
              particles?.emitChainLightning(tx, ty, sp.x, sp.y);
              sp.burstRadius *= 1.35;
              ctx.detonateSpore?.(sp);
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
    if (
      primary.hitSteps < maxTargets &&
      fx?.capPerUnused > 0 &&
      primary.lastHit &&
      enemies.enemies.includes(primary.lastHit)
    ) {
      const capDmg = +((maxTargets - primary.hitSteps) * fx.capPerUnused * baseDmg).toFixed(3);
      enemies.damageEnemyByRef(primary.lastHit, capDmg, 0, 0, arcCb);
      particles?.emitShockRing(primary.lastX, primary.lastY, 0.14, 0.9, COLORS.lumenGold, 0.28, 0.56);
    }

    if (fx?.forkPct > 0) {
      const alt = enemies.findNearestTarget(player.x, player.y, 300 * rMul, new Set([first.enemy]));
      if (alt) {
        runChain(alt.enemy, +(baseDmg * fx.forkPct).toFixed(3), Math.max(2, maxTargets - 1));
      }
    }

    if (tempestEcho) {
      const echoAlt = enemies.findNearestTarget(
        player.x,
        player.y,
        320 * rMul,
        new Set([first.enemy])
      );
      const echoStart = echoAlt?.enemy || first.enemy;
      if (echoStart && !echoStart._removed) {
        runChain(echoStart, +(baseDmg * 0.6).toFixed(3), Math.max(2, maxTargets));
      }
    }

    if (ctx.shouldMirrorCast?.()) {
      const mirrorStart =
        enemies.findNearestTarget(player.x, player.y, 300 * rMul, new Set([first.enemy]))?.enemy ||
        first.enemy;
      if (mirrorStart && !mirrorStart._removed) {
        runChain(mirrorStart, +(baseDmg * 0.65).toFixed(3), maxTargets);
      }
    }

    if (rank >= 5 && primary.hitSteps > 0) {
      const ionR = rank >= 10 ? 96 : 72;
      enemies.damageRadius(
        primary.lastX,
        primary.lastY,
        ionR,
        baseDmg * (rank >= 10 ? 0.85 : 0.58),
        95,
        0.35,
        arcCb
      );
      particles?.emitShockRing(primary.lastX, primary.lastY, 0.14, ionR / 52, COLORS.lumenGold, 0.32, 0.62);
    }

    audio?.playBolt?.(true);
    ctx.onOverclockCast?.();
  }
}
