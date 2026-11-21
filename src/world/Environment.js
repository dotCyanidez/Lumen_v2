import { Container, Graphics, Sprite } from 'pixi.js';
import { clamp, damp, randRange } from '../core/MathUtils.js';

export class SanctuaryEnvironment {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.farLayer = new Container();
    this.streamGraphics = new Graphics();
    this.jellyLayer = new Container();
    this.floraLayer = new Container();
    this.sporeLayer = new Container();
    this.boundaryGraphics = new Graphics();

    this.container.addChild(
      this.farLayer,
      this.streamGraphics,
      this.jellyLayer,
      this.floraLayer,
      this.sporeLayer,
      this.boundaryGraphics
    );

    this.width = 4200;
    this.height = 3000;
    this.time = 0;

    this.jellies = [];
    this.reeds = [];
    this.hangingVines = [];
    this.spores = [];
    this.glowSpots = [];
    this.streams = [
      { yFrac: 0.14, amp: 32, freq: 0.0028, speed: 62, dir: 1, phase: 0.4 },
      { yFrac: 0.30, amp: 28, freq: 0.0034, speed: 54, dir: -1, phase: 1.7 },
      { yFrac: 0.46, amp: 36, freq: 0.0026, speed: 68, dir: 1, phase: 2.9 },
      { yFrac: 0.63, amp: 30, freq: 0.0032, speed: 58, dir: -1, phase: 4.1 },
      { yFrac: 0.80, amp: 26, freq: 0.0038, speed: 50, dir: 1, phase: 5.3 },
    ];

    this._initParticles();
  }

  _initParticles() {
    // Distant luminous jellyfish silhouettes across the vast abyss
    for (let i = 0; i < 22; i++) {
      const root = new Container();
      const dome = new Graphics();
      const halo = new Sprite(this.textures.glowSoft);
      halo.anchor.set(0.5);
      halo.blendMode = 'add';

      const tendrils = new Graphics();
      root.addChild(halo, tendrils, dome);
      this.jellyLayer.addChild(root);

      const scale = randRange(0.42, 0.95);
      const jelly = {
        root,
        dome,
        halo,
        tendrils,
        normX: randRange(0.06, 0.94),
        normY: randRange(0.14, 0.86),
        scale,
        speedY: randRange(-14, -6),
        driftPhase: randRange(0, Math.PI * 2),
        pulsePhase: randRange(0, Math.PI * 2),
        parallax: randRange(0.12, 0.25),
        hueMix: Math.random(),
      };
      this._drawJelly(jelly, 0);
      this.jellies.push(jelly);
    }

    // Floating bioluminescent plankton / spores across 3 depth layers
    for (let i = 0; i < 260; i++) {
      const depth = i < 95 ? 0.22 : i < 200 ? 0.55 : 1.18;
      const sprite = new Sprite(depth > 1 ? this.textures.glowSoft : this.textures.glowTight);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      this.sporeLayer.addChild(sprite);

      const isGold = i % 5 === 0;
      sprite.tint = isGold ? 0xffe49b : 0x6bf7eb;

      const baseSize =
        depth < 0.35
          ? randRange(0.06, 0.14)
          : depth < 0.8
            ? randRange(0.11, 0.23)
            : randRange(0.18, 0.32);

      this.spores.push({
        sprite,
        x: Math.random(),
        y: Math.random(),
        depth,
        vx: randRange(-0.008, 0.008),
        vy: randRange(-0.016, -0.004),
        baseSize,
        baseAlpha:
          depth < 0.35 ? randRange(0.18, 0.36) : depth < 0.8 ? randRange(0.26, 0.54) : randRange(0.12, 0.24),
        phase: randRange(0, Math.PI * 2),
        twinkleSpeed: randRange(1.1, 2.7),
      });
    }
  }

  _drawJelly(jelly, pulse) {
    const r = 18 * jelly.scale;
    const squeeze = 1 + Math.sin(pulse) * 0.14;
    const bellW = r * squeeze;
    const bellH = r * (0.72 / squeeze);
    const tintColor = jelly.hueMix > 0.5 ? 0x62f4ec : 0x89d3ff;

    jelly.dome.clear();
    // Soft translucent inner bell
    jelly.dome
      .moveTo(-bellW, 2)
      .bezierCurveTo(-bellW * 0.92, -bellH * 1.48, bellW * 0.92, -bellH * 1.48, bellW, 2)
      .quadraticCurveTo(0, bellH * 0.24, -bellW, 2)
      .fill({ color: tintColor, alpha: 0.12 })
      .stroke({ width: 1.25, color: tintColor, alpha: 0.34 });

    // Glowing inner core arc
    jelly.dome
      .ellipse(0, -bellH * 0.42, bellW * 0.48, bellH * 0.34)
      .fill({ color: 0xffffff, alpha: 0.1 });

    jelly.halo.tint = tintColor;
    jelly.halo.alpha = 0.16 + Math.sin(pulse) * 0.05;
    jelly.halo.scale.set(0.75 * jelly.scale);
    jelly.halo.y = -bellH * 0.22;

    jelly.tendrils.clear();
    for (let i = 0; i < 4; i++) {
      const tx = (i - 1.5) * bellW * 0.32;
      const sway = Math.sin(pulse * 0.85 + i * 1.2) * 6.5 * jelly.scale;
      jelly.tendrils
        .moveTo(tx, 1)
        .bezierCurveTo(
          tx + sway * 0.5,
          14 * jelly.scale,
          tx - sway,
          28 * jelly.scale,
          tx + sway * 0.6,
          44 * jelly.scale
        )
        .stroke({ width: 1.0, color: tintColor, alpha: 0.19 });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this._rebuildArchitecture();
  }

  _rebuildArchitecture() {
    this.farLayer.removeChildren();
    this.floraLayer.removeChildren();
    this.reeds = [];
    this.hangingVines = [];
    this.glowSpots = [];

    const w = this.width;
    const h = this.height;

    const farShapes = new Graphics();

    // Distant deep sea ridge (layer 1)
    farShapes.moveTo(0, h);
    farShapes.lineTo(0, h * 0.82);
    farShapes.bezierCurveTo(w * 0.18, h * 0.72, w * 0.34, h * 0.87, w * 0.52, h * 0.81);
    farShapes.bezierCurveTo(w * 0.7, h * 0.74, w * 0.86, h * 0.86, w, h * 0.79);
    farShapes.lineTo(w, h);
    farShapes.closePath();
    farShapes.fill({ color: 0x050b1d, alpha: 0.36 });

    // Sculptural coral-arch & curved sanctuary spires along edges (leaving center open)
    // Left sweeping arch spire + delicate bioluminescent rim & coral fans
    farShapes
      .moveTo(-10, h)
      .lineTo(-10, h * 0.42)
      .bezierCurveTo(w * 0.08, h * 0.44, w * 0.13, h * 0.58, w * 0.12, h * 0.74)
      .bezierCurveTo(w * 0.11, h * 0.84, w * 0.17, h * 0.9, w * 0.21, h)
      .closePath()
      .fill({ color: 0x040917, alpha: 0.44 });

    farShapes
      .moveTo(-10, h * 0.42)
      .bezierCurveTo(w * 0.08, h * 0.44, w * 0.13, h * 0.58, w * 0.12, h * 0.74)
      .stroke({ width: 1.5, color: 0x45c8d6, alpha: 0.22 });

    // Right organic curved spire + subtle rim light
    farShapes
      .moveTo(w + 10, h)
      .lineTo(w + 10, h * 0.46)
      .bezierCurveTo(w * 0.91, h * 0.5, w * 0.87, h * 0.64, w * 0.89, h * 0.78)
      .bezierCurveTo(w * 0.9, h * 0.88, w * 0.83, h * 0.93, w * 0.78, h)
      .closePath()
      .fill({ color: 0x040917, alpha: 0.44 });

    farShapes
      .moveTo(w + 10, h * 0.46)
      .bezierCurveTo(w * 0.91, h * 0.5, w * 0.87, h * 0.64, w * 0.89, h * 0.78)
      .stroke({ width: 1.5, color: 0x45c8d6, alpha: 0.22 });

    // Foreground seabed silhouette curve + bioluminescent ridge sheen
    farShapes.moveTo(0, h);
    farShapes.lineTo(0, h * 0.91);
    farShapes.bezierCurveTo(w * 0.16, h * 0.85, w * 0.28, h * 0.95, w * 0.44, h * 0.91);
    farShapes.bezierCurveTo(w * 0.62, h * 0.87, w * 0.75, h * 0.96, w * 0.9, h * 0.88);
    farShapes.quadraticCurveTo(w * 0.96, h * 0.86, w, h * 0.89);
    farShapes.lineTo(w, h);
    farShapes.closePath();
    farShapes.fill({ color: 0x030713, alpha: 0.76 });

    farShapes
      .moveTo(0, h * 0.91)
      .bezierCurveTo(w * 0.16, h * 0.85, w * 0.28, h * 0.95, w * 0.44, h * 0.91)
      .bezierCurveTo(w * 0.62, h * 0.87, w * 0.75, h * 0.96, w * 0.9, h * 0.88)
      .quadraticCurveTo(w * 0.96, h * 0.86, w, h * 0.89)
      .stroke({ width: 1.4, color: 0x52e5de, alpha: 0.18 });

    // Glowing mycelial caps & coral clusters along ridge & spires
    const glowSpots = [
      { x: w * 0.09, y: h * 0.47, scale: 0.26, gold: true },
      { x: w * 0.115, y: h * 0.63, scale: 0.2, gold: false },
      { x: w * 0.905, y: h * 0.52, scale: 0.24, gold: false },
      { x: w * 0.885, y: h * 0.68, scale: 0.2, gold: true },
      { x: w * 0.17, y: h * 0.885, scale: 0.28, gold: false },
      { x: w * 0.56, y: h * 0.895, scale: 0.25, gold: true },
      { x: w * 0.87, y: h * 0.89, scale: 0.28, gold: false },
    ];
    for (const spot of glowSpots) {
      farShapes
        .ellipse(spot.x, spot.y, 9, 4)
        .fill({ color: spot.gold ? 0xffe498 : 0x5ff7eb, alpha: 0.35 });
      const glow = new Sprite(this.textures.glowSoft);
      glow.anchor.set(0.5);
      glow.blendMode = 'add';
      glow.tint = spot.gold ? 0xffe498 : 0x5ff7eb;
      glow.x = spot.x;
      glow.y = spot.y;
      glow.scale.set(spot.scale);
      glow.alpha = 0.26;
      this.farLayer.addChild(glow);
      this.glowSpots.push({
        sprite: glow,
        baseScale: spot.scale,
        baseAlpha: 0.26,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Sunken abyssal sanctuary rings & gentle bioluminescent anchors for clear motion landmarks
    const cols = 5;
    const rows = 4;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const idx = gy * cols + gx;
        const jx = ((gx + 0.5 + Math.sin(idx * 2.17) * 0.22) / cols) * w;
        const jy = ((gy + 0.5 + Math.cos(idx * 1.63) * 0.22) / rows) * h;
        const r = 46 + (idx % 4) * 26;
        const isGold = idx % 3 === 0;
        farShapes
          .circle(jx, jy, r)
          .stroke({ width: 1.2, color: isGold ? 0xffe498 : 0x45c8d6, alpha: 0.075 });
        farShapes
          .circle(jx, jy, r * 0.52)
          .stroke({ width: 1, color: 0x5ff7eb, alpha: 0.05 });
        farShapes
          .circle(jx, jy, 3.2)
          .fill({ color: isGold ? 0xffe498 : 0x5ff7eb, alpha: 0.22 });
      }
    }

    this.farLayer.addChild(farShapes);

    // Interactive bottom sanctuary kelp-blossoms & glowing lantern reeds
    const reedCount = clamp(Math.floor(w / 95), 10, 44);
    for (let i = 0; i < reedCount; i++) {
      const baseX = ((i + 0.5) / reedCount) * w + randRange(-20, 20);
      const baseY = h + 6;
      const len = randRange(h * 0.068, h * 0.155);
      const hasBulb = i % 2 === 0 || i % 3 === 0;
      const isGold = i % 4 === 0;

      const stem = new Graphics();
      const bulb = hasBulb ? new Sprite(this.textures.glowTight) : null;
      if (bulb) {
        bulb.anchor.set(0.5);
        bulb.blendMode = 'add';
        bulb.tint = isGold ? 0xffe498 : 0x5ff7eb;
        this.floraLayer.addChild(bulb);
      }
      this.floraLayer.addChild(stem);

      this.reeds.push({
        stem,
        bulb,
        baseX,
        baseY,
        len,
        phase: randRange(0, Math.PI * 2),
        bend: 0,
        bendVel: 0,
        flare: 0,
        thickness: randRange(1.8, 3.2),
        isGold,
        curveSign: i % 2 === 0 ? 1 : -1,
      });
    }

    // Upper canopy hanging glowing spore tendrils
    const vineCount = clamp(Math.floor(w / 155), 5, 28);
    for (let i = 0; i < vineCount; i++) {
      const baseX = ((i + 0.45) / vineCount) * w + randRange(-26, 26);
      const len = randRange(h * 0.048, h * 0.11);
      const stem = new Graphics();
      const tip = new Sprite(this.textures.glowTight);
      tip.anchor.set(0.5);
      tip.blendMode = 'add';
      tip.tint = i % 3 === 0 ? 0xffe396 : 0x62f4ea;
      this.floraLayer.addChild(stem, tip);

      this.hangingVines.push({
        stem,
        tip,
        baseX,
        baseY: -4,
        len,
        phase: randRange(0, Math.PI * 2),
        bend: 0,
        flare: 0,
      });
    }
  }

  sampleCurrent(x, y) {
    const w = this.width;
    const h = this.height;
    let vx = 0;
    let vy = 0;
    for (const s of this.streams) {
      const centerY = s.yFrac * h + Math.sin(x * s.freq + this.time * 0.9 + s.phase) * s.amp;
      const dy = y - centerY;
      if (Math.abs(dy) < 52) {
        const wgt = 1 - Math.abs(dy) / 52;
        const slope = Math.cos(x * s.freq + this.time * 0.9 + s.phase) * s.amp * s.freq;
        vx += s.dir * s.speed * wgt;
        vy += s.dir * slope * s.speed * wgt;
      }
    }
    return { vx, vy };
  }

  update(dt, playerX, playerY, playerSpeed, dashTimer, accentHex, audioPulse = 0, shockWaves = []) {
    this.time += dt;
    const w = this.width;
    const h = this.height;
    const camOffsetX = clamp((playerX - w * 0.5) * -0.024, -55, 55);
    const camOffsetY = clamp((playerY - h * 0.5) * -0.024, -45, 45);

    this.farLayer.x = camOffsetX * 0.35;
    this.farLayer.y = camOffsetY * 0.35;
    this.floraLayer.x = camOffsetX * 0.6;
    this.floraLayer.y = camOffsetY * 0.6;

    // Render Sanctuary world boundary & outer void shroud
    this.boundaryGraphics.clear();
    const borderColor = accentHex || 0x5ff7eb;
    const outerVoid = 2200;
    this.boundaryGraphics
      .rect(-outerVoid, -outerVoid, w + outerVoid * 2, outerVoid)
      .rect(-outerVoid, h, w + outerVoid * 2, outerVoid)
      .rect(-outerVoid, 0, outerVoid, h)
      .rect(w, 0, outerVoid, h)
      .fill({ color: 0x02040c, alpha: 0.66 });

    const borderPulse = 0.38 + Math.sin(this.time * 2.2) * 0.08 + audioPulse * 0.2;
    this.boundaryGraphics
      .rect(0, 0, w, h)
      .stroke({ width: 10, color: borderColor, alpha: borderPulse * 0.16 });
    this.boundaryGraphics
      .rect(0, 0, w, h)
      .stroke({ width: 2.2, color: borderColor, alpha: borderPulse * 0.85 });
    this.boundaryGraphics
      .rect(12, 12, w - 24, h - 24)
      .stroke({ width: 1.0, color: 0xffffff, alpha: 0.16 });

    // Render ambient bioluminescent ocean current ribbons
    this.streamGraphics.clear();
    const streamColor = accentHex || 0x5ff7eb;
    for (const s of this.streams) {
      const baseY = s.yFrac * h;
      const steps = 42;
      for (let idx = 0; idx <= steps; idx++) {
        const px = (idx / steps) * w;
        const py = baseY + Math.sin(px * s.freq + this.time * 0.9 + s.phase) * s.amp;
        if (idx === 0) this.streamGraphics.moveTo(px, py);
        else this.streamGraphics.lineTo(px, py);
      }
      this.streamGraphics.stroke({
        width: 1.4,
        color: streamColor,
        alpha: 0.055 + audioPulse * 0.04,
        cap: 'round',
      });

      // Flowing dashed streak pulses moving along the stream
      for (let d = 0; d < 5; d++) {
        const rawFrac = (this.time * 0.055 * s.dir + d * 0.2 + s.phase * 0.1) % 1;
        const frac = rawFrac < 0 ? rawFrac + 1 : rawFrac;
        const sx0 = frac * w;
        const sx1 = sx0 + s.dir * 82;
        const sy0 = baseY + Math.sin(sx0 * s.freq + this.time * 0.9 + s.phase) * s.amp;
        const sy1 = baseY + Math.sin(sx1 * s.freq + this.time * 0.9 + s.phase) * s.amp;
        this.streamGraphics
          .moveTo(sx0, sy0)
          .lineTo(sx1, sy1)
          .stroke({ width: 2.0, color: 0xffffff, alpha: 0.09 + audioPulse * 0.08, cap: 'round' });
      }
    }

    for (const spot of this.glowSpots) {
      const beat = 1 + audioPulse * 0.24 + Math.sin(this.time * 1.9 + spot.phase) * 0.08;
      spot.sprite.scale.set(spot.baseScale * beat);
      spot.sprite.alpha = spot.baseAlpha + audioPulse * 0.16;
    }

    for (const j of this.jellies) {
      j.normY += (j.speedY * dt) / Math.max(h, 1);
      if (j.normY < -0.15) {
        j.normY = 1.14;
        j.normX = randRange(0.06, 0.94);
      }
      const swayX = Math.sin(this.time * 0.55 + j.driftPhase) * 16;
      j.root.x = j.normX * w + swayX + camOffsetX * j.parallax * 2.2;
      j.root.y = j.normY * h + camOffsetY * j.parallax * 2.2;
      j.root.rotation = Math.cos(this.time * 0.55 + j.driftPhase) * 0.08;
      this._drawJelly(j, this.time * 2.1 + j.pulsePhase + audioPulse * 0.35);
      j.halo.alpha += audioPulse * 0.11;
    }

    const wakeRadius = dashTimer > 0 ? 155 : 105;
    const wakeRadiusSq = wakeRadius * wakeRadius;

    for (const r of this.reeds) {
      const tipApproxX = r.baseX + this.floraLayer.x;
      const tipApproxY = r.baseY - r.len * 0.72 + this.floraLayer.y;
      const dx = tipApproxX - playerX;
      const dy = tipApproxY - playerY;
      const dSq = dx * dx + dy * dy;

      let targetForce = 0;
      if (dSq < wakeRadiusSq) {
        const proximity = 1 - Math.sqrt(dSq) / wakeRadius;
        const dir = dx >= 0 ? 1 : -1;
        targetForce = dir * proximity * (dashTimer > 0 ? 48 : clamp(playerSpeed * 0.085, 8, 28));
        r.flare = Math.max(r.flare, proximity * (dashTimer > 0 ? 1.0 : 0.75));
      }

      for (const sw of shockWaves) {
        if (sw.age <= 0 || sw.age >= 1) continue;
        const ringR = sw.age * 920 * 0.65;
        const sdx = tipApproxX - sw.x;
        const sdy = tipApproxY - sw.y;
        const sd = Math.hypot(sdx, sdy);
        if (Math.abs(sd - ringR) < 75) {
          const waveForce = (1 - Math.abs(sd - ringR) / 75) * sw.strength * (1 - sw.age);
          targetForce += (sdx >= 0 ? 1 : -1) * waveForce * 52;
          r.flare = Math.max(r.flare, waveForce * 0.9);
        }
      }

      const stiffness = 14;
      const damping = 5.5;
      r.bendVel += (targetForce - r.bend * stiffness) * dt * 8;
      r.bendVel *= Math.exp(-damping * dt);
      r.bend = clamp(r.bend + r.bendVel * dt, -52, 52);
      r.flare = damp(r.flare, 0, 2.2, dt);

      const idleSway = Math.sin(this.time * 1.35 + r.phase) * 12 + r.curveSign * 7;
      const tipX = r.baseX + idleSway + r.bend;
      const tipY = r.baseY - r.len;

      r.stem.clear();
      r.stem
        .moveTo(r.baseX, r.baseY)
        .bezierCurveTo(
          r.baseX - r.curveSign * 10,
          r.baseY - r.len * 0.35,
          r.baseX + (idleSway + r.bend) * 0.6,
          r.baseY - r.len * 0.72,
          tipX,
          tipY
        )
        .stroke({
          width: r.thickness,
          color: r.isGold ? 0x3b4d5f : 0x163d54,
          alpha: 0.45 + r.flare * 0.38,
          cap: 'round',
        });

      if (r.bulb) {
        // Delicate glowing teardrop petal bud at reed tip
        const budColor = r.isGold ? 0xffe498 : 0x62f7eb;
        r.stem
          .ellipse(tipX, tipY, 3.2 + r.flare * 1.4, 5.2 + r.flare * 2.0)
          .fill({ color: budColor, alpha: 0.42 + r.flare * 0.48 });

        r.bulb.x = tipX;
        r.bulb.y = tipY;
        const pulse = 0.85 + Math.sin(this.time * 2.4 + r.phase) * 0.15;
        const glowScale = (0.3 + r.flare * 0.36) * pulse;
        r.bulb.scale.set(glowScale);
        r.bulb.alpha = 0.38 + r.flare * 0.55;
      }
    }

    for (const v of this.hangingVines) {
      const tipApproxX = v.baseX + this.floraLayer.x;
      const tipApproxY = v.len * 0.85 + this.floraLayer.y;
      const dx = tipApproxX - playerX;
      const dy = tipApproxY - playerY;
      const dSq = dx * dx + dy * dy;
      if (dSq < wakeRadiusSq) {
        const proximity = 1 - Math.sqrt(dSq) / wakeRadius;
        v.bend = clamp(v.bend + (dx >= 0 ? 1 : -1) * proximity * 26 * dt * 10, -40, 40);
        v.flare = Math.max(v.flare, proximity * 0.85);
      }
      v.bend = damp(v.bend, 0, 3.2, dt);
      v.flare = damp(v.flare, 0, 2.2, dt);

      const sway = Math.sin(this.time * 1.15 + v.phase) * 9;
      const tipX = v.baseX + sway + v.bend;
      const tipY = v.baseY + v.len;

      v.stem.clear();
      v.stem
        .moveTo(v.baseX, v.baseY)
        .quadraticCurveTo(v.baseX + sway * 0.4, v.len * 0.5, tipX, tipY)
        .stroke({ width: 1.5, color: 0x1f4961, alpha: 0.36 + v.flare * 0.35, cap: 'round' });

      v.tip.x = tipX;
      v.tip.y = tipY;
      v.tip.scale.set(0.26 + v.flare * 0.28);
      v.tip.alpha = 0.36 + v.flare * 0.52;
    }

    for (const s of this.spores) {
      s.x += (s.vx + Math.sin(this.time * 0.4 + s.phase) * 0.004) * dt;
      s.y += s.vy * dt;

      if (s.y < -0.04) s.y = 1.04;
      if (s.x < -0.04) s.x = 1.04;
      if (s.x > 1.04) s.x = -0.04;

      const px = s.x * w + camOffsetX * s.depth * 1.8;
      const py = s.y * h + camOffsetY * s.depth * 1.8;
      const twinkle = 0.65 + 0.35 * Math.sin(this.time * s.twinkleSpeed + s.phase) + audioPulse * 0.25;

      // Subtle shockwave scatter displacement for ambient spores
      let pushX = 0;
      let pushY = 0;
      for (const sw of shockWaves) {
        if (sw.age <= 0 || sw.age >= 1) continue;
        const ringR = sw.age * 920 * 0.62;
        const dx = px - sw.x;
        const dy = py - sw.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && Math.abs(dist - ringR) < 60) {
          const push = (1 - Math.abs(dist - ringR) / 60) * 14 * sw.strength;
          pushX += (dx / dist) * push;
          pushY += (dy / dist) * push;
        }
      }

      s.sprite.x = px + pushX;
      s.sprite.y = py + pushY;
      s.sprite.scale.set(s.baseSize * (0.9 + twinkle * 0.25));
      s.sprite.alpha = Math.min(1, s.baseAlpha * twinkle);

      if (s.sprite.tint !== 0xffe49b && accentHex) {
        s.sprite.tint = accentHex;
      }
    }
  }
}
