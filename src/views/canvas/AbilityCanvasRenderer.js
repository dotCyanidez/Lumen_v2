import { Container, Graphics, Sprite } from 'pixi.js';
import { COLORS } from '../../core/Constants.js';
import { clamp } from '../../core/MathUtils.js';

/**
 * PixiJS View Renderer for all automatic abilities:
 * pooled projectile sprites, orbital blades, Starbloom spore sprites,
 * light pools, sunbeam rays, Celestial Spear beams, and shock pulse rings.
 */
export class AbilityCanvasRenderer {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.fxGraphics = new Graphics();
    this.sporeLayer = new Container();
    this.spriteLayer = new Container();
    this.container.addChild(this.fxGraphics, this.sporeLayer, this.spriteLayer);

    this.orbitSprites = [];
  }

  createProjectileSprite() {
    const sprite = new Sprite(this.textures.streak);
    sprite.anchor.set(0.5);
    sprite.blendMode = 'add';
    sprite.visible = false;
    this.spriteLayer.addChild(sprite);
    return sprite;
  }

  syncProjectileSpawn(p) {
    if (!p?.sprite) return;
    p.sprite.texture =
      p.kind === 'seeker' || p.kind === 'spark' ? this.textures.sparkStar : this.textures.streak;
    p.sprite.x = p.x;
    p.sprite.y = p.y;
    p.sprite.rotation = p.rotation;
    p.sprite.tint = p.tint;
    p.sprite.scale.set(p.scaleX, p.scaleY);
    p.sprite.alpha = 0.98;
    p.sprite.visible = true;
  }

  syncProjectileTransform(p) {
    if (!p?.sprite) return;
    p.sprite.x = p.x;
    p.sprite.y = p.y;
    p.sprite.rotation = p.rotation;
  }

  ensureOrbitalCapacity(target) {
    while (this.orbitSprites.length < target) {
      const sprite = new Sprite(this.textures.sparkStar);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.visible = false;
      this.spriteLayer.addChild(sprite);
      this.orbitSprites.push(sprite);
    }
  }

  createSporeView() {
    const root = new Container();
    root.visible = false;

    const halo = new Sprite(this.textures.glowSoft);
    halo.anchor.set(0.5);
    halo.blendMode = 'add';
    halo.tint = COLORS.lumenCyan;
    halo.scale.set(0.48);
    halo.alpha = 0.42;

    const ring = new Sprite(this.textures.ring);
    ring.anchor.set(0.5);
    ring.blendMode = 'add';
    ring.tint = COLORS.lumenCyan;
    ring.scale.set(0.32);
    ring.alpha = 0.56;

    const bud = new Sprite(this.textures.diamond);
    bud.anchor.set(0.5);
    bud.tint = 0xdffef9;
    bud.scale.set(0.3);
    bud.alpha = 0.98;

    const glint = new Sprite(this.textures.sparkStar);
    glint.anchor.set(0.5);
    glint.blendMode = 'add';
    glint.tint = COLORS.lumenGold;
    glint.scale.set(0.26);
    glint.alpha = 0.9;

    root.addChild(halo, ring, bud, glint);
    this.sporeLayer.addChild(root);
    return { root, halo, ring, bud, glint };
  }

  syncSporeSpawn(sp) {
    const v = sp?.view;
    if (!v) return;
    v.halo.tint = sp.tint;
    v.ring.tint = COLORS.lumenCyan;
    v.glint.tint = sp.damage >= 14 ? COLORS.lumenCyan : COLORS.lumenGold;
    v.root.x = sp.x;
    v.root.y = sp.y;
    v.root.scale.set(0.2);
    v.root.alpha = 0;
    v.root.visible = true;
  }

  syncSporeFrame(sp) {
    const v = sp?.view;
    if (!v) return;
    const fadeOut = sp.age > sp.life - 0.65 ? clamp((sp.life - sp.age) / 0.65, 0, 1) : 1;
    const bloomIn = clamp(sp.age / 0.24, 0, 1);
    const breathe = 0.92 + Math.sin(sp.age * 4.4 + sp.phase) * 0.1;

    v.root.x = sp.x;
    v.root.y = sp.y;
    v.root.scale.set(bloomIn * breathe);
    v.root.alpha = fadeOut;
    v.bud.rotation = sp.age * 1.15 + sp.phase;
    v.glint.rotation = -sp.age * 1.85;
    v.ring.scale.set(0.3 + Math.sin(sp.age * 5.2 + sp.phase) * 0.04);
  }

  hideSpore(sp) {
    if (sp?.view) {
      sp.view.root.visible = false;
    }
  }

  reset(projectiles = [], spores = []) {
    for (let i = 0; i < projectiles.length; i++) {
      if (projectiles[i].sprite) {
        projectiles[i].sprite.visible = false;
      }
    }
    for (let i = 0; i < this.orbitSprites.length; i++) {
      this.orbitSprites[i].visible = false;
    }
    for (let i = 0; i < spores.length; i++) {
      this.hideSpore(spores[i]);
    }
    this.fxGraphics.clear();
  }

  renderFrame({
    player,
    tint,
    orbitalSt,
    orbitalRank,
    reachMul,
    orbitSurgeActive,
    orbitalPos,
    orbitRays,
    lightPools,
    projectiles,
    spears,
    pulses,
  }) {
    this.fxGraphics.clear();

    // Persistent bioluminescent Starbloom Mist zones
    for (let i = 0; i < lightPools.length; i++) {
      const pl = lightPools[i];
      const fade = Math.min(1, (pl.life - pl.age) / 0.55) * Math.min(1, pl.age / 0.16);
      const pulse = 0.62 + 0.14 * Math.sin(pl.age * 5.2 + i);
      const col = pl.tint || COLORS.lumenCyan;
      this.fxGraphics
        .circle(pl.x, pl.y, pl.radius)
        .fill({ color: col, alpha: 0.13 * fade })
        .stroke({ width: 1.8, color: col, alpha: 0.52 * fade });
      this.fxGraphics
        .circle(pl.x, pl.y, pl.radius * pulse)
        .stroke({ width: 1.2, color: COLORS.lumenGold, alpha: 0.28 * fade });
    }

    // Subtle crisp streak tails for active automatic projectiles
    let activeProj = 0;
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active) continue;
      activeProj++;
      this.fxGraphics
        .moveTo(p.x - p.vx * 0.024, p.y - p.vy * 0.024)
        .lineTo(p.x, p.y)
        .stroke({
          width: p.kind === 'bolt' ? 3.2 : 2.3,
          color: p.tint ?? p.sprite?.tint ?? COLORS.lumenCyan,
          alpha: 0.54,
        });
    }

    const fxCrowd = Math.max(0, activeProj - 16) + orbitRays.length * 1.5 + spears.length * 2;
    const densityAlpha = clamp(1 - fxCrowd * 0.0085, 0.54, 1);
    this.spriteLayer.alpha = densityAlpha;
    this.fxGraphics.alpha = densityAlpha;
    this.sporeLayer.alpha = clamp(1 - fxCrowd * 0.004, 0.72, 1);

    // Sync orbital blade sprites to pure domain orbital positions
    for (let i = 0; i < this.orbitSprites.length; i++) {
      const sprite = this.orbitSprites[i];
      const pos = orbitalPos[i];
      if (!pos || !pos.active) {
        sprite.visible = false;
        continue;
      }
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = pos.rotation || 0;
      sprite.tint = pos.tint ?? tint;
      sprite.scale.set(pos.scale || 0.32);
      sprite.alpha = 0.96;
      sprite.visible = true;
    }

    // Soft orbital path halo & outward Sunbeam Lasers when Orbiting Blades active
    if (orbitalRank > 0) {
      const sizeMul = Math.min(2.4, orbitalSt?.sizeMul || 1);
      const orbitR = 74 * sizeMul * reachMul * (orbitSurgeActive > 0 ? 1.45 : 1);
      const haloStroke =
        orbitalRank >= 5 || orbitSurgeActive > 0
          ? { width: orbitalRank >= 10 ? 2.8 : 2.1, color: COLORS.lumenGold, alpha: 0.48 }
          : { width: 1.5, color: tint, alpha: 0.28 };
      this.fxGraphics.circle(player.x, player.y, orbitR).stroke(haloStroke);

      for (let i = 0; i < orbitRays.length; i++) {
        const r = orbitRays[i];
        this.fxGraphics
          .moveTo(r.ax, r.ay)
          .lineTo(r.bx, r.by)
          .stroke({ width: 5.5, color: r.tint || tint, alpha: 0.34 });
        this.fxGraphics
          .moveTo(r.ax, r.ay)
          .lineTo(r.bx, r.by)
          .stroke({ width: 1.8, color: 0xffffff, alpha: 0.92 });
      }
    }

    // Celestial Spear beams
    for (let i = 0; i < spears.length; i++) {
      const s = spears[i];
      const alpha = clamp(1 - s.age / s.life, 0, 1);
      this.fxGraphics
        .moveTo(s.ax, s.ay)
        .lineTo(s.bx, s.by)
        .stroke({ width: s.width * 2.8 * alpha, color: s.tint || COLORS.lumenCyan, alpha: 0.4 * alpha });
      this.fxGraphics
        .moveTo(s.ax, s.ay)
        .lineTo(s.bx, s.by)
        .stroke({ width: s.width * 1.15 * alpha, color: 0xffffff, alpha: 0.96 * alpha });
    }

    // Expanding radial wave outlines (Astral Pulse / Starbloom burst)
    for (let i = 0; i < pulses.length; i++) {
      const pl = pulses[i];
      const t = clamp(pl.age / pl.life, 0, 1);
      const r = 18 + (pl.radius - 18) * (1 - Math.pow(1 - t, 3));
      this.fxGraphics
        .circle(pl.x, pl.y, r)
        .stroke({ width: 3.0 * (1 - t), color: pl.color || COLORS.lumenCyan, alpha: 0.86 * (1 - t) });
    }
  }
}
