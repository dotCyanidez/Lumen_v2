import { Container, Graphics, MeshRope, Point, Sprite } from 'pixi.js';
import { COLORS, PLAYER_CONFIG } from '../../core/Constants.js';
import { clamp, damp } from '../../core/MathUtils.js';

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

/**
 * PixiJS Canvas View Renderer for `PlayerModel`.
 * Manages the Spirit's ribbon trail (`MeshRope`), dash afterimage ghosts,
 * aura/core/soul sprites, diegetic dash pips, and pointer target ring.
 */
export class PlayerCanvasRenderer {
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
    this.spiritCoreTint = mixWithWhite(COLORS.lumenCyan, 0.56);
    this.core = new Sprite(textures.orbCore);
    this.core.anchor.set(0.5);
    this.core.blendMode = 'normal';
    this.core.tint = this.spiritCoreTint;
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

    this.pointerTargetGlow = new Sprite(textures.ring);
    this.pointerTargetGlow.anchor.set(0.5);
    this.pointerTargetGlow.blendMode = 'add';
    this.pointerTargetGlow.tint = COLORS.lumenCyan;
    this.pointerTargetGlow.scale.set(0.22);
    this.pointerTargetGlow.visible = false;
    this.container.addChild(this.pointerTargetGlow);
  }

  applySpiritStyle(player) {
    this.spiritCoreTint = mixWithWhite(player.spiritColorHex, 0.56);
    this.trailRope.tint = player.spiritColorHex;
    this.trailRope.alpha =
      player.trailStyle === 'prism' ? 0.64 : player.trailStyle === 'solar' ? 0.56 : 0.48;
    this.pointerTargetGlow.tint = player.spiritColorHex;
    this.outerAura.tint = player.spiritColorHex;
    this.mantle.tint = player.spiritColorHex;
    this.core.tint = this.spiritCoreTint;
    this.soul.tint = player.spiritAccentHex;
  }

  reset(player) {
    this.root.visible = true;
    this.root.alpha = 1;
    this.trailRope.visible = true;
    this.trailRope.alpha =
      player.trailStyle === 'prism' ? 0.64 : player.trailStyle === 'solar' ? 0.56 : 0.48;
    this.body.scale.set(1, 1);
    this.pointerTargetGlow.visible = false;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      this.trailPoints[i].x = player.x - i * 1.2;
      this.trailPoints[i].y = player.y;
    }
    for (const g of this.ghosts) {
      g.active = false;
      g.sprite.visible = false;
    }
  }

  spawnGhost(player) {
    for (const g of this.ghosts) {
      if (!g.active) {
        g.active = true;
        g.age = 0;
        g.life = 0.24;
        g.sprite.x = player.x;
        g.sprite.y = player.y;
        g.sprite.rotation = player.facingAngle;
        g.sprite.scale.set(0.54, 0.28);
        g.sprite.tint = player.spiritColorHex;
        g.sprite.alpha = 0.36;
        g.sprite.visible = true;
        return;
      }
    }
  }

  updatePointerGlow(dt, pointerGlow) {
    if (pointerGlow && pointerGlow.visible) {
      this.pointerTargetGlow.visible = true;
      this.pointerTargetGlow.x = pointerGlow.x;
      this.pointerTargetGlow.y = pointerGlow.y;
      this.pointerTargetGlow.alpha = pointerGlow.alpha;
      this.pointerTargetGlow.rotation += dt * 1.8;
    } else {
      this.pointerTargetGlow.visible = false;
    }
  }

  render(dt, player, showDashPips = true) {
    const spd = Math.hypot(player.vx, player.vy);

    this.root.x = player.x;
    this.root.y = player.y;

    // Invulnerability flicker
    if (player.invulnTimer > 0 && player.dashTimer <= 0) {
      this.root.alpha = 0.45 + 0.55 * Math.abs(Math.sin(player.time * 24));
    } else {
      this.root.alpha = 1;
    }

    // Squash & stretch along travel vector
    const stretch = player.dashTimer > 0 ? 0.52 : clamp(spd / player.maxSpeed, 0, 1) * 0.24;
    const breathe = Math.sin(player.time * 4.2) * 0.04;
    this.body.rotation = player.facingAngle;
    this.body.scale.set(1 + stretch + breathe, 1 - stretch * 0.48 - breathe * 0.5);

    // Ethereal light aura — luminous & clean without blowing out surrounding space
    const auraBase = 0.8 + Math.sin(player.time * 3.1) * 0.04;
    const dashBoost = player.dashTimer > 0 ? 0.22 : 0;
    this.outerAura.scale.set(auraBase + dashBoost);
    this.outerAura.alpha = player.dashTimer > 0 ? 0.24 : 0.14;
    const activeTint = player.dashTimer > 0 ? player.spiritAccentHex : player.spiritColorHex;
    this.outerAura.tint = activeTint;
    this.mantle.tint = activeTint;
    this.core.tint = this.spiritCoreTint ?? mixWithWhite(player.spiritColorHex, 0.56);
    this.trailRope.tint = activeTint;
    this.soul.tint = player.spiritAccentHex;
    this.soul.scale.set(player.dashTimer > 0 ? 0.42 : 0.34 + Math.sin(player.time * 4.2) * 0.02);
    this.soul.alpha = player.dashTimer > 0 ? 0.68 : 0.54;

    this.soul.rotation += dt * (player.dashTimer > 0 ? 8 : 2.2);

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
      const count = player.maxDashCharges;
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
          i < player.dashCharges ? 1 : i === player.dashCharges ? player.dashRechargeProgress : 0;
        if (fillFrac > 0.03) {
          const isReady = fillFrac >= 0.999;
          this.dashPipsArc
            .moveTo(Math.cos(a0) * pipR, Math.sin(a0) * pipR)
            .arc(0, 0, pipR, a0, a0 + span * fillFrac)
            .stroke({
              width: isReady ? 2.4 : 1.9,
              color: isReady ? player.spiritAccentHex : player.spiritColorHex,
              alpha: isReady ? 0.88 : 0.55,
              cap: 'round',
            });
        }
      }
      if (player.aegisReady) {
        const wardR = 18.5 + Math.sin(player.time * 4.5) * 0.8;
        this.dashPipsArc
          .circle(0, 0, wardR)
          .stroke({ width: 1.7, color: 0xb9fff8, alpha: 0.52 });
      }
      if (player.maxShield > 0 && player.shield > 0) {
        const frac = clamp(player.shield / player.maxShield, 0, 1);
        const barrierR = 26 + Math.sin(player.time * 5.2) * 0.6;
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
    this.trailPoints[0].x = player.x;
    this.trailPoints[0].y = player.y;
    const followRate = player.dashTimer > 0 ? 38 : 25;
    const maxSeg = player.dashTimer > 0 ? 11 : 6.2;

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
        curr.x = prev.x - Math.cos(player.facingAngle) * 0.35;
        curr.y = prev.y - Math.sin(player.facingAngle) * 0.35;
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
