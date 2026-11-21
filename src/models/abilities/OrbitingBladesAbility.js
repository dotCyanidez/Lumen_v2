import { COLORS } from '../../core/Constants.js';
import { distToSegment } from '../../core/MathUtils.js';
import { BaseAbility } from './BaseAbility.js';

const HEAVY_KINDS = new Set([
  'core',
  'warden',
  'vortex',
  'lancer',
  'artillery',
  'harbinger',
  'behemoth',
]);

function isHeavyTarget(e) {
  return Boolean(e?.isElite || HEAVY_KINDS.has(e?.kind));
}

/**
 * Orbiting Blades (`solar_orbitals`) — continuous rotating blades + Sunbeam rays & Surge.
 * Pure domain ability model with zero PixiJS or DOM imports.
 */
export class OrbitingBladesAbility extends BaseAbility {
  constructor() {
    super('solar_orbitals', 1.1);
    this.orbitalPulseTimer = 1.1;
    this.surgeTimer = 0;
    this.surgeActive = 0;
    this.orbitAngle = 0;
    this.radiantHitCount = 0;
  }

  reset() {
    super.reset(1.1);
    this.orbitalPulseTimer = 1.1;
    this.surgeTimer = 0;
    this.surgeActive = 0;
    this.orbitAngle = 0;
    this.radiantHitCount = 0;
  }

  shaveCooldown() {
    // Continuous orbital weapon has no cast timer to shave.
  }

  update(dt, ctx) {
    const rank = ctx.getRank(this.id);
    const { player, enemies, particles, audio, hasteMul, globalDmgMul, reachMul, primaryTint, synergies } = ctx;
    const orbitalPos = ctx.orbitalPos;
    const orbitRays = ctx.orbitRays;
    orbitRays.length = 0;

    if (rank <= 0) {
      for (let i = 0; i < orbitalPos.length; i++) {
        orbitalPos[i].active = false;
      }
      return;
    }

    const st = ctx.getBuild(this.id);
    const fx = ctx.getTalentFx(this.id);

    if (fx?.surgeCooldown > 0) {
      if (this.surgeActive > 0) {
        this.surgeActive = Math.max(0, this.surgeActive - dt);
      } else {
        this.surgeTimer -= dt * hasteMul;
        if (this.surgeTimer <= 0) {
          this.surgeTimer = fx.surgeCooldown;
          this.surgeActive = 1.6;
          particles?.emitShockRing(player.x, player.y, 0.22, 1.8, COLORS.lumenGold, 0.35, 0.45);
        }
      }
    } else {
      this.surgeActive = 0;
    }

    const isSurging = this.surgeActive > 0;
    const count = 2 + (st?.countAdd || 0);
    ctx.ensureOrbitalCapacity?.(count);

    const sizeMul = Math.min(2.4, st?.sizeMul || 1);
    const radiantBastion = Boolean(synergies?.has('radiant_bastion'));
    const bastionSpinMul = radiantBastion && player.shield > 0 ? 1.25 : 1;
    const speedMul = (st?.speedMul || 1) * (fx?.speedMul || 1) * bastionSpinMul;
    const radius = 64 * sizeMul * reachMul * (isSurging ? 1.45 : 1);
    const angSpeed = 2.95 * speedMul * (1 + (hasteMul - 1) * 0.45);
    const baseDmg = this.computeBaseDamage(
      st,
      fx,
      globalDmgMul,
      isSurging ? 1 + (fx?.surgeBonusPct || 0) : 1
    );
    const hitCooldown = Math.max(0.14, 0.4 / Math.max(1, speedMul));
    const knock = 145 * (fx?.knockMul || 1);
    const orbCb = ctx.withSource(this.id);
    const callbacks = ctx.callbacks;
    this.orbitAngle += dt * angSpeed;

    const hitDamage = (e, raw) => {
      const isHeavy = isHeavyTarget(e);
      const isWounded = e.hp < e.maxHp * 0.5;
      return (isHeavy || isWounded) && fx?.eliteExecBonus
        ? +(raw * (1 + fx.eliteExecBonus)).toFixed(3)
        : raw;
    };

    const bladeScale = 0.32 * (1 + (sizeMul - 1) * 0.45);
    const bladeTint = baseDmg >= 14 || isSurging ? COLORS.lumenGold : primaryTint;
    const orbEnemySnap = enemies.enemies.slice();

    for (let i = 0; i < orbitalPos.length; i++) {
      if (i >= count) {
        orbitalPos[i].active = false;
        continue;
      }

      const a = this.orbitAngle + (i * Math.PI * 2) / count;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const ox = player.x + cosA * radius;
      const oy = player.y + sinA * radius;
      const slot = orbitalPos[i];
      slot.x = ox;
      slot.y = oy;
      slot.active = true;
      slot.rotation = a + this.orbitAngle * 1.6;
      slot.tint = bladeTint;
      slot.scale = bladeScale;

      const rayLen = fx?.rayLen || 0;
      const rx = rayLen > 0 ? ox + cosA * rayLen : ox;
      const ry = rayLen > 0 ? oy + sinA * rayLen : oy;
      if (rayLen > 0) {
        orbitRays.push({ ax: ox, ay: oy, bx: rx, by: ry, tint: isSurging ? COLORS.lumenGold : primaryTint });
      }

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
          const res = enemies.damageEnemyByRef(
            e,
            hitDamage(e, baseDmg),
            (dx / dist) * knock,
            (dy / dist) * knock,
            orbCb
          );
          if (res) {
            if (!res.killed && fx?.staggerSlow > 0) {
              e.slowTimer = Math.max(e.slowTimer || 0, fx.staggerSlow);
            }
            if (isHeavy && fx?.heavyDashCdr > 0) {
              callbacks?.onDashCdrSeconds?.(fx.heavyDashCdr);
            }
            if (radiantBastion) {
              this.radiantHitCount = (this.radiantHitCount + 1) % 4;
              if (this.radiantHitCount === 0) {
                callbacks?.onRestoreShield?.(2);
              }
            }
            particles?.emitMotePickup(ox, oy, primaryTint);
            if (!res.killed) audio?.playGraze?.();
          }
        } else if (
          rayLen > 0 &&
          (e.rayHitCooldown || 0) <= 0 &&
          distToSegment(e.x, e.y, ox, oy, rx, ry) <= e.radius + 8
        ) {
          e.rayHitCooldown = Math.max(0.22, hitCooldown * 1.1);
          const rayDmg = hitDamage(e, +(baseDmg * fx.rayPct).toFixed(3));
          const res = enemies.damageEnemyByRef(e, rayDmg, cosA * 55, sinA * 55, orbCb);
          if (res) {
            particles?.emitMotePickup(e.x, e.y, isSurging ? COLORS.lumenGold : primaryTint);
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
          particles?.emitShockRing(
            player.x,
            player.y,
            0.25,
            (radius + 14) / 56,
            COLORS.lumenGold,
            0.32,
            0.42
          );
        }
      }
    }
  }
}
