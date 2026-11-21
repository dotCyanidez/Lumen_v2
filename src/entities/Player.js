import { Container, Graphics, MeshRope, Point, Sprite } from 'pixi.js';
import { COLORS, PLAYER_CONFIG } from '../core/Constants.js';
import { clamp, damp, lerp, wrapAngle } from '../core/MathUtils.js';

const TRAIL_COUNT = 20;
const GHOST_COUNT = 7;

/** Blend a 24-bit color toward pure white so the Spirit heart feels like living starlight. */
function mixWithWhite(hex, amount) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return (nr << 16) | (ng << 8) | nb;
}

export class Player {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    // Ribbon trail in world space
    this.trailPoints = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      this.trailPoints.push(new Point(-i * 2, 0));
    }
    this.trailRope = new MeshRope({
      texture: textures.trailRibbon,
      points: this.trailPoints,
    });
    this.trailRope.blendMode = 'add';
    this.trailRope.alpha = 0.48;
    this.trailRope.tint = COLORS.lumenCyan;
    this.container.addChild(this.trailRope);

    // Dash afterimage ghosts in world space
    this.ghosts = [];
    for (let i = 0; i < GHOST_COUNT; i++) {
      const ghost = new Sprite(textures.orbCore);
      ghost.anchor.set(0.5);
      ghost.blendMode = 'add';
      ghost.visible = false;
      this.container.addChild(ghost);
      this.ghosts.push({ sprite: ghost, age: 0, life: 0.25, active: false });
    }
    this.ghostSpawnTimer = 0;

    // Spirit root (positioned at player x, y)
    this.root = new Container();
    this.container.addChild(this.root);

    this.outerAura = new Sprite(textures.glowSoft);
    this.outerAura.anchor.set(0.5);
    this.outerAura.blendMode = 'add';
    this.outerAura.tint = COLORS.lumenCyan;
    this.outerAura.scale.set(0.78);
    this.outerAura.alpha = 0.14;

    this.dashPipsArc = new Graphics();
    this.hitboxMarker = new Graphics();

    this.body = new Container();
    // Soft luminous colored corona (normal blend cushions behind the orb against particle noise)
    this.mantle = new Sprite(textures.glowTight);
    this.mantle.anchor.set(0.5);
    this.mantle.blendMode = 'normal';
    this.mantle.tint = COLORS.lumenCyan;
    this.mantle.scale.set(0.68);
    this.mantle.alpha = 0.72;

    // Pure radiant pearl starlight heart tinted subtly per Spirit
    this.core = new Sprite(textures.orbCore);
    this.core.anchor.set(0.5);
    this.core.blendMode = 'normal';
    this.core.tint = mixWithWhite(COLORS.lumenCyan, 0.56);
    this.core.scale.set(0.44);
    this.core.alpha = 0.98;

    // Delicate spinning star-glimmer at the heart of the light
    this.soul = new Sprite(textures.sparkStar);
    this.soul.anchor.set(0.5);
    this.soul.blendMode = 'add';
    this.soul.tint = COLORS.lumenGold;
    this.soul.scale.set(0.34);
    this.soul.alpha = 0.54;

    this.body.addChild(this.mantle, this.core, this.soul);

    this.root.addChild(this.outerAura, this.dashPipsArc, this.body, this.hitboxMarker);

    // Gameplay state
    this.x = 640;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.facingAngle = 0;
    this.time = 0;

    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.maxDashCharges = PLAYER_CONFIG.dashCharges;
    this.dashSpeed = PLAYER_CONFIG.dashSpeed;
    this.dashRechargeTime = PLAYER_CONFIG.dashRechargeTime;
    this.maxSpeed = PLAYER_CONFIG.maxSpeed;
    this.spiritColorHex = COLORS.lumenCyan;
    this.spiritAccentHex = COLORS.lumenGold;

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

    this.emberTimer = 0;
    this.pointerTargetGlow = new Sprite(textures.ring);
    this.pointerTargetGlow.anchor.set(0.5);
    this.pointerTargetGlow.blendMode = 'add';
    this.pointerTargetGlow.tint = COLORS.lumenCyan;
    this.pointerTargetGlow.scale.set(0.22);
    this.pointerTargetGlow.visible = false;
    this.container.addChild(this.pointerTargetGlow);
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
    this.spiritCoreTint = mixWithWhite(this.spiritColorHex, 0.56);
    this.trailRope.tint = this.spiritColorHex;
    this.trailRope.alpha = this.trailStyle === 'prism' ? 0.64 : this.trailStyle === 'solar' ? 0.56 : 0.48;
    this.pointerTargetGlow.tint = this.spiritColorHex;
    this.outerAura.tint = this.spiritColorHex;
    this.mantle.tint = this.spiritColorHex;
    this.core.tint = this.spiritCoreTint;
    this.soul.tint = this.spiritAccentHex;
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

    this.root.visible = true;
    this.root.alpha = 1;
    this.trailRope.visible = true;
    this.trailRope.alpha =
      this.trailStyle === 'prism' ? 0.64 : this.trailStyle === 'solar' ? 0.56 : 0.48;
    this.body.scale.set(1, 1);

    for (let i = 0; i < TRAIL_COUNT; i++) {
      this.trailPoints[i].x = x - i * 1.2;
      this.trailPoints[i].y = y;
    }
    for (const g of this.ghosts) {
      g.active = false;
      g.sprite.visible = false;
    }
  }

  get isDashing() {
    return this.dashTimer > 0;
  }

  get isInvulnerable() {
    return this.dashTimer > 0 || this.invulnTimer > 0;
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

  /** Updates dynamic utility card modifiers applied to movement, dash, and barrier display. */
  setCardModifiers({ speedMul = 1, dashRechargeMul = 1, aegisReady = false, extraDashes = 0 } = {}) {
    this.cardSpeedMul = speedMul;
    this.cardDashRechargeMul = dashRechargeMul;
    this.aegisReady = aegisReady;
    this.maxDashCharges = (this.baseDashCharges || PLAYER_CONFIG.dashCharges) + extraDashes;
    if (this.dashCharges > this.maxDashCharges) {
      this.dashCharges = this.maxDashCharges;
    }
  }

  _spawnGhost() {
    for (const g of this.ghosts) {
      if (!g.active) {
        g.active = true;
        g.age = 0;
        g.life = 0.24;
        g.sprite.x = this.x;
        g.sprite.y = this.y;
        g.sprite.rotation = this.facingAngle;
        g.sprite.scale.set(0.54, 0.28);
        g.sprite.tint = this.spiritColorHex;
        g.sprite.alpha = 0.36;
        g.sprite.visible = true;
        return;
      }
    }
  }

  updateTitleIdle(dt, cx, cy, boundsW, boundsH, pointer, attractTarget = null) {
    this.time += dt;
    const t = this.time * 0.68;
    const rx = Math.min(boundsW * 0.34, 340);
    const ry = Math.min(boundsH * 0.06, 38);

    // Graceful upper-sanctuary flight or gentle attract-mode weaving toward ambient motes
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

    this.pointerTargetGlow.visible = false;
    this._updateVisuals(dt, false);
  }

  update(dt, input, boundsW, boundsH, particles, envForces = null) {
    this.time += dt;

    // Recharge dash smoothly
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

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      const tNorm = this.dashTimer / PLAYER_CONFIG.dashDuration;
      const speed = lerp(effectiveMaxSpeed * 1.15, this.dashSpeed, tNorm);
      this.vx = this.dashDirX * speed;
      this.vy = this.dashDirY * speed;

      this.ghostSpawnTimer -= dt;
      if (this.ghostSpawnTimer <= 0) {
        this.ghostSpawnTimer = 0.028;
        this._spawnGhost();
      }
    } else {
      // Smooth hybrid steering: keyboard or active pointer drag
      let ax = input.moveX;
      let ay = input.moveY;
      const keyMag = Math.hypot(ax, ay);

      if (keyMag > 0.01) {
        ax /= keyMag;
        ay /= keyMag;
        this.vx += ax * PLAYER_CONFIG.accel * (this.cardSpeedMul || 1) * dt;
        this.vy += ay * PLAYER_CONFIG.accel * (this.cardSpeedMul || 1) * dt;
        this.pointerTargetGlow.visible = false;
      } else if (input.pointerActive) {
        const dx = input.pointerX - this.x;
        const dy = input.pointerY - this.y;
        const dist = Math.hypot(dx, dy);
        const deadzone = PLAYER_CONFIG.pointerDeadzone;
        const fullDist = PLAYER_CONFIG.pointerFullSpeedDist;
        this.pointerTargetGlow.visible = dist > 16;
        this.pointerTargetGlow.x = input.pointerX;
        this.pointerTargetGlow.y = input.pointerY;
        this.pointerTargetGlow.alpha = clamp((dist - 14) / (fullDist * 0.75), 0, 0.5);
        this.pointerTargetGlow.rotation += dt * 1.8;

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
      } else {
        this.pointerTargetGlow.visible = false;
      }

      // Fluid damping
      const dragFactor = Math.exp(-PLAYER_CONFIG.damping * dt);
      if (keyMag <= 0.01 && !input.pointerActive) {
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

    // Soft cushioned arena containment inside viewport + edge ward feedback
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

    // Emit delicate movement embers
    if (particles) {
      const spd = Math.hypot(this.vx, this.vy);
      const rate = this.dashTimer > 0 ? 0.012 : spd > 90 ? 0.036 : 0.11;
      this.emberTimer -= dt;
      if (this.emberTimer <= 0) {
        this.emberTimer = rate;
        const tint = this.dashTimer > 0 ? this.spiritAccentHex : this.spiritColorHex;
        particles.emitTrailEmber(
          this.x,
          this.y,
          this.vx,
          this.vy,
          tint,
          this.trailStyle || 'mist',
          this.spiritAccentHex
        );
      }
    }

    this._updateVisuals(dt, true);
  }

  _updateVisuals(dt, showDashPips = true) {
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 18) {
      const targetAngle = Math.atan2(this.vy, this.vx);
      const diff = wrapAngle(targetAngle - this.facingAngle);
      this.facingAngle += diff * (1 - Math.exp(-16 * dt));
    }

    this.root.x = this.x;
    this.root.y = this.y;

    // Invulnerability flicker
    if (this.invulnTimer > 0 && this.dashTimer <= 0) {
      this.root.alpha = 0.45 + 0.55 * Math.abs(Math.sin(this.time * 24));
    } else {
      this.root.alpha = 1;
    }

    // Squash & stretch along travel vector
    const stretch = this.dashTimer > 0 ? 0.52 : clamp(spd / this.maxSpeed, 0, 1) * 0.24;
    const breathe = Math.sin(this.time * 4.2) * 0.04;
    this.body.rotation = this.facingAngle;
    this.body.scale.set(1 + stretch + breathe, 1 - stretch * 0.48 - breathe * 0.5);

    // Ethereal light aura — luminous & clean without blowing out surrounding space
    const auraBase = 0.8 + Math.sin(this.time * 3.1) * 0.04;
    const dashBoost = this.dashTimer > 0 ? 0.22 : 0;
    this.outerAura.scale.set(auraBase + dashBoost);
    this.outerAura.alpha = this.dashTimer > 0 ? 0.24 : 0.14;
    const activeTint = this.dashTimer > 0 ? this.spiritAccentHex : this.spiritColorHex;
    this.outerAura.tint = activeTint;
    this.mantle.tint = this.dashTimer > 0 ? this.spiritAccentHex : this.spiritColorHex;
    this.core.tint = this.spiritCoreTint ?? mixWithWhite(this.spiritColorHex, 0.56);
    this.trailRope.tint = activeTint;
    this.soul.tint = this.spiritAccentHex;
    this.soul.scale.set(this.dashTimer > 0 ? 0.42 : 0.34 + Math.sin(this.time * 4.2) * 0.02);
    this.soul.alpha = this.dashTimer > 0 ? 0.68 : 0.54;

    this.soul.rotation += dt * (this.dashTimer > 0 ? 8 : 2.2);

    // Subtle crisp true-hitbox marker at Lumen's center for fair bullet-weaving
    this.hitboxMarker.clear();
    if (showDashPips) {
      this.hitboxMarker
        .circle(0, 0, PLAYER_CONFIG.hitRadius)
        .stroke({ width: 1.0, color: 0xffffff, alpha: 0.16 })
        .circle(0, 0, 2.5)
        .fill({ color: 0xffffff, alpha: 0.92 });
    }

    // Diegetic Solar Dash pips & defensive rings cleanly separated by radius
    this.dashPipsArc.clear();
    if (showDashPips) {
      const pipR = 31;
      const count = this.maxDashCharges;
      const span = count >= 3 ? 0.36 : 0.56;
      const centers =
        count >= 3
          ? [Math.PI * 0.72, Math.PI * 0.5, Math.PI * 0.28]
          : [Math.PI * 0.68, Math.PI * 0.32];
      for (let i = 0; i < count; i++) {
        const c = centers[i];
        const a0 = c - span * 0.5;
        const a1 = c + span * 0.5;
        // Faint track (moveTo avoids connecting line between separate arcs)
        this.dashPipsArc
          .moveTo(Math.cos(a0) * pipR, Math.sin(a0) * pipR)
          .arc(0, 0, pipR, a0, a1)
          .stroke({ width: 1.8, color: 0xffffff, alpha: 0.14, cap: 'round' });

        const fillFrac =
          i < this.dashCharges ? 1 : i === this.dashCharges ? this.dashRechargeProgress : 0;
        if (fillFrac > 0.03) {
          const isReady = fillFrac >= 0.999;
          this.dashPipsArc
            .moveTo(Math.cos(a0) * pipR, Math.sin(a0) * pipR)
            .arc(0, 0, pipR, a0, a0 + span * fillFrac)
            .stroke({
              width: isReady ? 2.4 : 1.9,
              color: isReady ? this.spiritAccentHex : this.spiritColorHex,
              alpha: isReady ? 0.88 : 0.55,
              cap: 'round',
            });
        }
      }
      if (this.aegisReady) {
        const wardR = 18.5 + Math.sin(this.time * 4.5) * 0.8;
        this.dashPipsArc
          .circle(0, 0, wardR)
          .stroke({ width: 1.7, color: 0xb9fff8, alpha: 0.52 });
      }
      if (this.maxShield > 0 && this.shield > 0) {
        const frac = clamp(this.shield / this.maxShield, 0, 1);
        const barrierR = 26 + Math.sin(this.time * 5.2) * 0.6;
        this.dashPipsArc
          .circle(0, 0, barrierR)
          .stroke({ width: 1.1, color: 0x76b8ff, alpha: 0.18 });
        this.dashPipsArc
          .moveTo(0, -barrierR)
          .arc(0, 0, barrierR, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * frac)
          .stroke({ width: 2.4, color: 0x7ec8ff, alpha: 0.62 + 0.22 * frac, cap: 'round' });
      }
    }

    // Update smooth spring-followed ribbon trail
    this.trailPoints[0].x = this.x;
    this.trailPoints[0].y = this.y;
    const followRate = this.dashTimer > 0 ? 38 : 25;
    const maxSeg = this.dashTimer > 0 ? 11 : 6.2;

    for (let i = 1; i < TRAIL_COUNT; i++) {
      const prev = this.trailPoints[i - 1];
      const curr = this.trailPoints[i];
      curr.x = damp(curr.x, prev.x, followRate, dt);
      curr.y = damp(curr.y, prev.y, followRate, dt);

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const d = Math.hypot(dx, dy);
      if (d > maxSeg) {
        curr.x = prev.x + (dx / d) * maxSeg;
        curr.y = prev.y + (dy / d) * maxSeg;
      } else if (d < 0.25) {
        // Keep minuscule separation so MeshRope normals never degenerate
        curr.x = prev.x - Math.cos(this.facingAngle) * 0.35;
        curr.y = prev.y - Math.sin(this.facingAngle) * 0.35;
      }
    }

    // Update dash ghosts
    for (const g of this.ghosts) {
      if (!g.active) continue;
      g.age += dt;
      if (g.age >= g.life) {
        g.active = false;
        g.sprite.visible = false;
      } else {
        const k = 1 - g.age / g.life;
        g.sprite.alpha = 0.34 * k;
        g.sprite.scale.set(0.54 * (0.6 + 0.4 * k), 0.28 * (0.6 + 0.4 * k));
      }
    }
  }
}
