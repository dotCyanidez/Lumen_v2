import { COLORS, STARLIGHT_CONFIG } from '../../core/Constants.js';
import { BaseAbility } from './BaseAbility.js';

/**
 * Starlight Bolt (`resonant_volley`) — Lumen's primary automatic bolt weapon.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class StarlightBoltAbility extends BaseAbility {
  constructor() {
    super('resonant_volley', STARLIGHT_CONFIG.baseInterval);
    this.timer = 0.25;
    this.volleyCount = 0;
    this.fanIdx = 0;
    this.cresIdx = 0;
  }

  reset(initialDelay = 0.25) {
    super.reset(initialDelay);
    this.volleyCount = 0;
    this.fanIdx = 0;
    this.cresIdx = 0;
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    if (rank <= 0) return;

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);
    const rateMul = st?.rateMul || 1;
    if (!this.tickCooldown(dt, ctx.hasteMul, rateMul)) return;

    const { player, enemies, audio, reachMul, globalDmgMul, primaryTint, synergies } = ctx;
    const range = STARLIGHT_CONFIG.baseRange * (st?.rangeMul || 1) * reachMul;
    const sorted = BaseAbility.getEnemiesSortedByDist(enemies, player.x, player.y, range);
    if (sorted.length === 0) {
      this.timer = 0.08;
      return;
    }

    this.timer = Math.max(0.12, STARLIGHT_CONFIG.baseInterval);
    this.fanIdx++;
    this.cresIdx++;

    const count = 1 + (st?.countAdd || 0);
    const dmg = this.computeBaseDamage(st, { dmgMul: fx?.singleDmgMul }, globalDmgMul);
    const pierce = st?.pierceAdd || 0;
    const speed =
      (STARLIGHT_CONFIG.boltSpeed + Math.min(400, (rateMul - 1) * 180)) * (fx?.speedMul || 1);
    const isCrescendo = fx?.crescendoSplashPct > 0 && this.cresIdx % 4 === 0;
    const splitOnKill = rank >= 10 ? 3 : rank >= 5 ? 2 : 0;
    const impactSparks = isCrescendo ? fx.crescendoSparks : 0;
    const splashOnHit = isCrescendo ? fx.crescendoSplashPct : 0;
    const burnDps = fx?.burnDps ? +(fx.burnDps * globalDmgMul).toFixed(3) : 0;
    const ricochetLeft = fx?.ricochetCount || 0;
    const ricochetMul = fx?.ricochetMul || 0.7;

    const primary = sorted[0].enemy;
    const baseAngle = Math.atan2(primary.y - player.y, primary.x - player.x);

    const launchBolt = (angle, boltDmg, tintOverride = null) =>
      ctx.spawnProjectile({
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
        tint: tintOverride || (boltDmg >= 15 || rank >= 5 || isCrescendo ? COLORS.lumenGold : primaryTint),
        scaleX: count >= 3 || isCrescendo ? 0.52 : 0.46,
        scaleY: boltDmg >= 15 || isCrescendo ? 0.24 : 0.2,
        splitOnKill,
        impactSparks,
        splashOnHit,
        splashRadius: 64,
        burnDps,
        burnDuration: burnDps > 0 ? 2.4 : 0,
        sourceAbility: this.id,
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

    if (fx?.fanEvery > 0 && this.fanIdx % fx.fanEvery === 0) {
      const fanDmg = +(dmg * fx.fanDmgMul).toFixed(3);
      launchBolt(baseAngle - 0.27, fanDmg);
      launchBolt(baseAngle + 0.27, fanDmg);
    }

    if (ctx.shouldMirrorCast?.()) {
      launchBolt(baseAngle + 0.08, +(dmg * 0.65).toFixed(3), COLORS.lumenViolet);
    }

    this.volleyCount = (this.volleyCount + 1) % 2;
    if (synergies?.has('comet_volley') && this.volleyCount === 0) {
      ctx.spawnProjectile({
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

    audio?.playBolt?.(false);
    ctx.onOverclockCast?.();
  }
}
