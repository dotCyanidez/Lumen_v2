import { COLORS, PLAYER_CONFIG } from '../core/Constants.js';
import { clamp, damp, lerp, wrapAngle } from '../core/MathUtils.js';

/**
 * Pure Domain Model for Lumen (the Spirit player).
 * Encapsulates kinematics, Solar Dash charges/recharge/timers, HP, Starlight Shield,
 * invulnerability windows, and arena containment with zero PixiJS or DOM imports.
 */
export class PlayerModel {
  constructor() {
    this.x = 640;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.facingAngle = 0;
    this.time = 0;

    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.baseDashCharges = PLAYER_CONFIG.dashCharges;
    this.maxDashCharges = PLAYER_CONFIG.dashCharges;
    this.dashSpeed = PLAYER_CONFIG.dashSpeed;
    this.dashRechargeTime = PLAYER_CONFIG.dashRechargeTime;
    this.maxSpeed = PLAYER_CONFIG.maxSpeed;
    this.spiritColorHex = COLORS.lumenCyan;
    this.spiritAccentHex = COLORS.lumenGold;
    this.trailStyle = 'mist';

    this.health = this.maxHealth;
    this.shield = 0;
    this.maxShield = 0;
    this.invulnTimer = 0;
    this.dashCharges = this.maxDashCharges;
    this.dashRechargeProgress = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashPurgeCount = 0;
    this.edgeContact = [0, 0, 0, 0];
    this.dashDirX = 1;
    this.dashDirY = 0;

    this.cardSpeedMul = 1;
    this.cardDashRechargeMul = 1;
    this.aegisReady = false;
    this.ghostSpawnTimer = 0;
    this.emberTimer = 0;
  }

  get isDashing() {
    return this.dashTimer > 0;
  }

  get isInvulnerable() {
    return this.dashTimer > 0 || this.invulnTimer > 0;
  }

  applySpiritMods(mods = {}) {
    this.maxHealth = mods.maxHealth ?? PLAYER_CONFIG.maxHealth;
    this.baseDashCharges = mods.dashCharges ?? PLAYER_CONFIG.dashCharges;
    this.maxDashCharges = this.baseDashCharges;
    this.dashSpeed = PLAYER_CONFIG.dashSpeed * (mods.dashSpeedMul ?? 1);
    this.dashRechargeTime = PLAYER_CONFIG.dashRechargeTime * (mods.dashRechargeMul ?? 1);
    this.maxSpeed = PLAYER_CONFIG.maxSpeed * (mods.speedMul ?? 1);
    this.spiritColorHex = mods.colorHex ?? COLORS.lumenCyan;
    this.spiritAccentHex = mods.accentHex ?? COLORS.lumenGold;
    this.trailStyle = mods.trailId ?? 'mist';
  }

  reset(x, y, mods = null) {
    if (mods) this.applySpiritMods(mods);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facingAngle = -Math.PI / 4;
    this.health = this.maxHealth;
    this.shield = 0;
    this.maxShield = 0;
    this.invulnTimer = 0;
    this.dashCharges = this.maxDashCharges;
    this.dashRechargeProgress = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashPurgeCount = 0;
    this.edgeContact = [0, 0, 0, 0];
  }

  addDashEnergy(fraction) {
    if (this.dashCharges >= this.maxDashCharges) return;
    this.dashRechargeProgress += fraction;
    while (this.dashRechargeProgress >= 1 && this.dashCharges < this.maxDashCharges) {
      this.dashRechargeProgress -= 1;
      this.dashCharges++;
    }
    if (this.dashCharges >= this.maxDashCharges) {
      this.dashRechargeProgress = 0;
    }
  }

  tryDash(dirX, dirY) {
    if (this.dashCharges <= 0 || this.dashTimer > 0 || this.dashCooldown > 0) {
      return false;
    }

    let dx = dirX;
    let dy = dirY;
    const mag = Math.hypot(dx, dy);
    if (mag < 0.05) {
      dx = Math.cos(this.facingAngle);
      dy = Math.sin(this.facingAngle);
    } else {
      dx /= mag;
      dy /= mag;
    }

    this.dashCharges--;
    this.dashTimer = PLAYER_CONFIG.dashDuration;
    this.dashCooldown = PLAYER_CONFIG.dashCooldown;
    this.dashPurgeCount = 0;
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.facingAngle = Math.atan2(dy, dx);
    this.vx = dx * this.dashSpeed;
    this.vy = dy * this.dashSpeed;
    this.ghostSpawnTimer = 0;
    return true;
  }

  setCardModifiers({ speedMul = 1, dashRechargeMul = 1, aegisReady = false, extraDashes = 0 } = {}) {
    this.cardSpeedMul = speedMul;
    this.cardDashRechargeMul = dashRechargeMul;
    this.aegisReady = aegisReady;
    this.maxDashCharges = (this.baseDashCharges || PLAYER_CONFIG.dashCharges) + extraDashes;
    if (this.dashCharges > this.maxDashCharges) {
      this.dashCharges = this.maxDashCharges;
    }
  }

  stepTitleIdle(dt, cx, cy, boundsW, boundsH, pointer, attractTarget = null) {
    this.time += dt;
    const t = this.time * 0.68;
    const rx = Math.min(boundsW * 0.34, 340);
    const ry = Math.min(boundsH * 0.06, 38);

    let targetX = cx + Math.sin(t) * rx;
    let targetY = cy - Math.min(boundsH * 0.36, 260) + Math.sin(t * 2) * ry * 0.72;

    if (attractTarget) {
      targetX = attractTarget.x;
      targetY = attractTarget.y;
    }

    if (pointer && pointer.inside) {
      targetX = lerp(targetX, pointer.x, 0.18);
      targetY = lerp(targetY, pointer.y, 0.18);
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const desiredSpd = Math.min(240, dist * 3.2);
      this.vx = damp(this.vx, (dx / dist) * desiredSpd, 4.5, dt);
      this.vy = damp(this.vy, (dy / dist) * desiredSpd, 4.5, dt);
    } else {
      this.vx = damp(this.vx, 0, 5, dt);
      this.vy = damp(this.vy, 0, 5, dt);
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 18) {
      const targetAngle = Math.atan2(this.vy, this.vx);
      const diff = wrapAngle(targetAngle - this.facingAngle);
      this.facingAngle += diff * (1 - Math.exp(-16 * dt));
    }
  }

  stepKinematics(dt, input, boundsW, boundsH, envForces = null) {
    this.time += dt;

    if (this.dashCharges < this.maxDashCharges) {
      const rechargeDur = this.dashRechargeTime * (this.cardDashRechargeMul || 1);
      this.dashRechargeProgress += dt / rechargeDur;
      if (this.dashRechargeProgress >= 1) {
        this.dashRechargeProgress -= 1;
        this.dashCharges++;
        if (this.dashCharges >= this.maxDashCharges) {
          this.dashRechargeProgress = 0;
        }
      }
    }

    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    const effectiveMaxSpeed = this.maxSpeed * (this.cardSpeedMul || 1);
    let spawnGhost = false;
    let pointerGlow = { visible: false, x: 0, y: 0, alpha: 0 };

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      const tNorm = this.dashTimer / PLAYER_CONFIG.dashDuration;
      const speed = lerp(effectiveMaxSpeed * 1.15, this.dashSpeed, tNorm);
      this.vx = this.dashDirX * speed;
      this.vy = this.dashDirY * speed;

      this.ghostSpawnTimer -= dt;
      if (this.ghostSpawnTimer <= 0) {
        this.ghostSpawnTimer = 0.028;
        spawnGhost = true;
      }
    } else {
      let ax = input?.moveX || 0;
      let ay = input?.moveY || 0;
      const keyMag = Math.hypot(ax, ay);

      if (keyMag > 0.01) {
        ax /= keyMag;
        ay /= keyMag;
        this.vx += ax * PLAYER_CONFIG.accel * (this.cardSpeedMul || 1) * dt;
        this.vy += ay * PLAYER_CONFIG.accel * (this.cardSpeedMul || 1) * dt;
      } else if (input?.pointerActive) {
        const dx = input.pointerX - this.x;
        const dy = input.pointerY - this.y;
        const dist = Math.hypot(dx, dy);
        const deadzone = PLAYER_CONFIG.pointerDeadzone;
        const fullDist = PLAYER_CONFIG.pointerFullSpeedDist;
        pointerGlow = {
          visible: dist > 16,
          x: input.pointerX,
          y: input.pointerY,
          alpha: clamp((dist - 14) / (fullDist * 0.75), 0, 0.5),
        };

        if (dist > deadzone) {
          const t = clamp((dist - deadzone) / (fullDist - deadzone), 0, 1);
          const ramp = t * (0.65 + 0.35 * t);
          const desiredSpd = effectiveMaxSpeed * ramp;
          const tvx = (dx / dist) * desiredSpd;
          const tvy = (dy / dist) * desiredSpd;
          this.vx = damp(this.vx, tvx, 12, dt);
          this.vy = damp(this.vy, tvy, 12, dt);
        } else {
          this.vx = damp(this.vx, 0, 12, dt);
          this.vy = damp(this.vy, 0, 12, dt);
        }
      }

      const dragFactor = Math.exp(-PLAYER_CONFIG.damping * dt);
      if (keyMag <= 0.01 && !input?.pointerActive) {
        this.vx *= dragFactor;
        this.vy *= dragFactor;
      } else if (keyMag > 0.01) {
        this.vx *= Math.exp(-3.4 * dt);
        this.vy *= Math.exp(-3.4 * dt);
      }

      const spd = Math.hypot(this.vx, this.vy);
      if (spd > effectiveMaxSpeed) {
        const s = effectiveMaxSpeed / spd;
        this.vx *= s;
        this.vy *= s;
      }

      if (envForces) {
        this.vx += (envForces.vx || 0) * dt;
        this.vy += (envForces.vy || 0) * dt;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const margin = 24;
    for (let k = 0; k < 4; k++) {
      this.edgeContact[k] = damp(this.edgeContact[k], 0, 8, dt);
    }
    if (this.x < margin + 18) {
      this.edgeContact[0] = Math.max(this.edgeContact[0], clamp(1 - (this.x - margin) / 18, 0, 1));
    }
    if (this.x > boundsW - margin - 18) {
      this.edgeContact[1] = Math.max(
        this.edgeContact[1],
        clamp(1 - (boundsW - margin - this.x) / 18, 0, 1)
      );
    }
    if (this.y < margin + 18) {
      this.edgeContact[2] = Math.max(this.edgeContact[2], clamp(1 - (this.y - margin) / 18, 0, 1));
    }
    if (this.y > boundsH - margin - 18) {
      this.edgeContact[3] = Math.max(
        this.edgeContact[3],
        clamp(1 - (boundsH - margin - this.y) / 18, 0, 1)
      );
    }

    if (this.x < margin) {
      this.x = margin;
      if (this.vx < 0) this.vx = 0;
      this.edgeContact[0] = 1;
    } else if (this.x > boundsW - margin) {
      this.x = boundsW - margin;
      if (this.vx > 0) this.vx = 0;
      this.edgeContact[1] = 1;
    }
    if (this.y < margin) {
      this.y = margin;
      if (this.vy < 0) this.vy = 0;
      this.edgeContact[2] = 1;
    } else if (this.y > boundsH - margin) {
      this.y = boundsH - margin;
      if (this.vy > 0) this.vy = 0;
      this.edgeContact[3] = 1;
    }

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 18) {
      const targetAngle = Math.atan2(this.vy, this.vx);
      const diff = wrapAngle(targetAngle - this.facingAngle);
      this.facingAngle += diff * (1 - Math.exp(-16 * dt));
    }

    return { spawnGhost, pointerGlow, speed: spd };
  }
}
