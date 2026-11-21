import { COLORS } from '../../core/Constants.js';
import { randRange } from '../../core/MathUtils.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Seeker Barrage (`seeker_barrage`) — homing star-missiles with mark/execute/splash.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class SeekerBarrageAbility extends BaseAbility {
  constructor() {
    super('seeker_barrage', 2.3);
    this.timer = 1.0;
  }

  reset(initialDelay = 0.9) {
    super.reset(initialDelay);
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    if (rank <= 0) return;

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);
    const rateMul = st?.rateMul || 1;
    if (!this.tickCooldown(dt, ctx.hasteMul, rateMul)) return;

    const { player, enemies, audio, globalDmgMul, reachMul } = ctx;
    const range = 760 * reachMul;
    const sorted = BaseAbility.getEnemiesSortedByDist(enemies, player.x, player.y, range);
    if (sorted.length === 0) {
      this.timer = 0.15;
      return;
    }

    this.timer = 2.3;
    const isMirror = Boolean(ctx.shouldMirrorCast?.());
    const baseCount = 2 + (st?.countAdd || 0) + (fx?.extraCount || 0);
    const echoExtra = isMirror ? Math.max(1, Math.ceil(baseCount * 0.5)) : 0;
    const count = baseCount + echoExtra;
    const dmg = this.computeBaseDamage(st, fx, globalDmgMul);
    const speedMul = Math.min(2.6, (st?.speedMul || 1) * (fx?.speedMul || 1));
    const speed = 490 * speedMul;
    const turnRate = 6.8 * speedMul * (fx?.turnMul || 1);
    const splashOnHit = rank >= 10 ? 0.75 : rank >= 5 ? 0.5 : 0;
    const splashRadius = rank >= 10 ? 64 : 48;
    const defaultTint = ctx.spiritAccentHex || COLORS.lumenViolet;

    for (let i = 0; i < count; i++) {
      const target = sorted[i % sorted.length].enemy;
      const baseAngle =
        (player.facingAngle || 0) + (i - (count - 1) * 0.5) * 0.95 + randRange(-0.18, 0.18);
      const isEcho = i >= baseCount;
      if (
        !ctx.spawnProjectile({
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
          tint: isEcho
            ? COLORS.lumenViolet
            : dmg >= 14 || rank >= 5
              ? COLORS.lumenGold
              : defaultTint,
          scaleX: 0.34,
          scaleY: 0.34,
          splashOnHit,
          splashRadius,
          markBonus: fx?.markBonus || 0,
          executeBonus: fx?.executeBonus || 0,
          killedSalvo: fx?.killedSalvo || 0,
          sourceAbility: this.id,
        })
      ) {
        break;
      }
    }

    audio?.playBolt?.(false);
    ctx.onOverclockCast?.();
  }
}
