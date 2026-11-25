import { Container, Graphics, Sprite } from 'pixi.js';
import { COLORS } from '../../core/Constants.js';
import { clamp, easeOutCubic, lerp } from '../../core/MathUtils.js';

/**
 * PixiJS View Renderer for all `BaseEnemy` domain models, telegraphs, HP pips,
 * Eclipse Core shield petals, and `EnemyProjectile` instances.
 */
export class EnemyCanvasRenderer {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();
    this.overlayContainer = new Container();
    this.telegraphGraphics = new Graphics();
    this.trailGraphics = new Graphics();
    this.entityLayer = new Container();
    this.projectileGraphics = new Graphics();

    this.container.addChild(this.trailGraphics, this.entityLayer);
    this.overlayContainer.addChild(this.telegraphGraphics, this.projectileGraphics);
  }

  reset() {
    while (this.entityLayer.children.length > 0) {
      const child = this.entityLayer.removeChildAt(this.entityLayer.children.length - 1);
      child.destroy({ children: true });
    }
    this.beginFrame();
  }

  beginFrame() {
    this.telegraphGraphics.clear();
    this.trailGraphics.clear();
    this.projectileGraphics.clear();
  }

  _makeRim(tint, scaleX, alpha, scaleY = scaleX) {
    const rim = new Sprite(this.textures.glowSoft);
    rim.anchor.set(0.5);
    rim.blendMode = 'add';
    rim.tint = tint;
    rim.scale.set(scaleX, scaleY);
    rim.alpha = alpha;
    return rim;
  }

  _makeRingSprite(tint, scale, alpha) {
    const ringSprite = new Sprite(this.textures.ring);
    ringSprite.anchor.set(0.5);
    ringSprite.blendMode = 'add';
    ringSprite.tint = tint;
    ringSprite.scale.set(scale);
    ringSprite.alpha = alpha;
    return ringSprite;
  }

  attachEnemy(enemy) {
    if (enemy.view) return enemy.view;

    const root = new Container();
    root.x = enemy.x;
    root.y = enemy.y;

    let view;
    switch (enemy.kind) {
      case 'stalker': {
        const rim = this._makeRim(COLORS.shadowCrimson, 0.46, 0.48);
        const body = new Graphics();
        const tail = new Graphics();
        body
          .moveTo(17, 0)
          .quadraticCurveTo(3, -14, -14, -9)
          .quadraticCurveTo(-7, 0, -14, 9)
          .quadraticCurveTo(3, 14, 17, 0)
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.96 })
          .stroke({ width: 1.8, color: COLORS.shadowCrimson, alpha: 0.92 });
        body
          .moveTo(4, -4.5)
          .lineTo(10, -2.2)
          .lineTo(5, -1.8)
          .closePath()
          .fill({ color: 0xff5484, alpha: 1 });
        body
          .moveTo(4, 4.5)
          .lineTo(10, 2.2)
          .lineTo(5, 1.8)
          .closePath()
          .fill({ color: 0xff5484, alpha: 1 });
        root.addChild(rim, tail, body);
        view = { root, rim, body, tail, baseRimTint: rim.tint };
        break;
      }
      case 'manta': {
        const rim = this._makeRim(COLORS.shadowViolet, 0.58, 0.42);
        const body = new Graphics();
        root.addChild(rim, body);
        view = { root, rim, body, baseRimTint: rim.tint };
        enemy.view = view;
        this.drawManta(enemy, 0);
        break;
      }
      case 'sentinel': {
        const rim = this._makeRim(COLORS.shadowCrimson, 0.68, 0.45);
        const ringSprite = this._makeRingSprite(COLORS.shadowCrimson, 0.45, 0.4);
        const shards = new Graphics();
        const core = new Graphics();
        core
          .circle(0, 0, 14)
          .fill({ color: COLORS.shadowVoid, alpha: 0.98 })
          .stroke({ width: 2, color: COLORS.shadowCrimson, alpha: 0.95 });
        core.circle(0, 0, 4.5).fill({ color: 0xff3b72, alpha: 0.95 });

        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const ox = Math.cos(a) * 21;
          const oy = Math.sin(a) * 21;
          shards
            .moveTo(ox + Math.cos(a) * 6, oy + Math.sin(a) * 6)
            .lineTo(ox + Math.cos(a + 2.2) * 5, oy + Math.sin(a + 2.2) * 5)
            .lineTo(ox + Math.cos(a - 2.2) * 5, oy + Math.sin(a - 2.2) * 5)
            .closePath()
            .fill({ color: COLORS.shadowVoid, alpha: 0.95 })
            .stroke({ width: 1.4, color: COLORS.shadowViolet, alpha: 0.9 });
        }
        root.addChild(rim, ringSprite, shards, core);
        view = { root, rim, ringSprite, shards, core, baseRimTint: rim.tint };
        break;
      }
      case 'lancer': {
        root.rotation = enemy.angle || 0;
        root.visible = Boolean(enemy.launched);
        const rim = this._makeRim(COLORS.shadowCrimson, 0.55, 0.72, 0.28);
        const body = new Graphics();
        body
          .moveTo(26, 0)
          .lineTo(-16, -9)
          .lineTo(-8, 0)
          .lineTo(-16, 9)
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.98 })
          .stroke({ width: 2, color: 0xff3b78, alpha: 1 });
        root.addChild(rim, body);
        view = { root, rim, body, baseRimTint: rim.tint };
        break;
      }
      case 'vortex': {
        const rim = this._makeRim(COLORS.shadowViolet, 0.95, 0.38);
        const swirl = new Graphics();
        for (let arm = 0; arm < 3; arm++) {
          const baseA = (arm * Math.PI * 2) / 3;
          for (let s = 0; s < 10; s++) {
            const t = s / 9;
            const r = 10 + t * 24;
            const a = baseA + t * 1.65;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (s === 0) swirl.moveTo(px, py);
            else swirl.lineTo(px, py);
          }
          swirl.stroke({ width: 2.0, color: COLORS.shadowViolet, alpha: 0.78, cap: 'round' });
        }
        const core = new Graphics();
        core
          .circle(0, 0, 15)
          .fill({ color: COLORS.shadowVoid, alpha: 0.98 })
          .stroke({ width: 2.0, color: COLORS.shadowViolet, alpha: 0.95 });
        core.circle(0, 0, 5.5).fill({ color: 0x1e0936, alpha: 1 });
        root.addChild(rim, swirl, core);
        view = { root, rim, swirl, core, baseRimTint: rim.tint };
        break;
      }
      case 'warden': {
        const rim = this._makeRim(0xff7a5c, 0.76, 0.46);
        const shell = new Graphics();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const px = Math.cos(a) * 19;
          const py = Math.sin(a) * 19;
          if (i === 0) shell.moveTo(px, py);
          else shell.lineTo(px, py);
        }
        shell
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.98 })
          .stroke({ width: 2.2, color: 0xff8c5a, alpha: 0.94 });
        shell.circle(0, 0, 7).fill({ color: 0xff3b78, alpha: 0.95 });
        root.addChild(rim, shell);
        view = { root, rim, shell, baseRimTint: rim.tint };
        break;
      }
      case 'spitter': {
        const rim = this._makeRim(0xff4fb8, 0.48, 0.5);
        const body = new Graphics();
        body
          .moveTo(15, 0)
          .lineTo(-10, -10)
          .lineTo(-5, 0)
          .lineTo(-10, 10)
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.94 })
          .stroke({ width: 1.7, color: 0xff5ec4, alpha: 0.9 });
        const fins = new Graphics();
        fins
          .moveTo(2, -7)
          .quadraticCurveTo(-8, -17, -15, -9)
          .moveTo(2, 7)
          .quadraticCurveTo(-8, 17, -15, 9)
          .stroke({ width: 1.5, color: COLORS.shadowViolet, alpha: 0.78 });
        const eye = new Graphics().circle(3, 0, 3.3).fill({ color: 0xff7ae0, alpha: 0.95 });
        root.addChild(rim, fins, body, eye);
        view = { root, rim, fins, body, eye, baseRimTint: rim.tint };
        break;
      }
      case 'artillery': {
        const rim = this._makeRim(COLORS.shadowViolet, 0.58, 0.48);
        const frame = new Graphics();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          const tipX = Math.cos(a) * 18;
          const tipY = Math.sin(a) * 18;
          const sideA = a + 0.5;
          const sideB = a - 0.5;
          frame
            .moveTo(tipX, tipY)
            .lineTo(Math.cos(sideA) * 9, Math.sin(sideA) * 9)
            .lineTo(Math.cos(sideB) * 9, Math.sin(sideB) * 9)
            .closePath()
            .fill({ color: COLORS.shadowVoid, alpha: 0.95 })
            .stroke({ width: 1.8, color: COLORS.shadowViolet, alpha: 0.92 });
        }
        const core = new Graphics().circle(0, 0, 5.2).fill({ color: 0xff8ea6, alpha: 0.95 });
        root.addChild(rim, frame, core);
        view = { root, rim, frame, core, baseRimTint: rim.tint };
        break;
      }
      case 'harbinger': {
        const rim = this._makeRim(0xff4fa8, 0.95, 0.65);
        const outerHalo = new Graphics();
        outerHalo
          .moveTo(0, -30)
          .lineTo(30, 0)
          .lineTo(0, 30)
          .lineTo(-30, 0)
          .closePath()
          .stroke({ width: 2.0, color: 0xffb36b, alpha: 0.72 });
        const runes = new Graphics();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          runes
            .circle(Math.cos(a) * 23, Math.sin(a) * 23, 3.6)
            .fill({ color: 0xff62b8, alpha: 0.92 });
        }
        const body = new Graphics()
          .moveTo(0, -21)
          .lineTo(19, 0)
          .lineTo(0, 21)
          .lineTo(-19, 0)
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.96 })
          .stroke({ width: 2.4, color: COLORS.shadowCrimson, alpha: 0.95 });
        const jewel = new Graphics().circle(0, 0, 7).fill({ color: 0xffcf7d, alpha: 0.96 });
        root.addChild(rim, outerHalo, runes, body, jewel);
        view = { root, rim, outerHalo, runes, body, jewel, baseRimTint: rim.tint };
        break;
      }
      case 'behemoth': {
        const rim = this._makeRim(COLORS.shadowCrimson, 1.08, 0.68);
        const armor = new Graphics();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 25;
          const py = Math.sin(a) * 25;
          if (i === 0) armor.moveTo(px, py);
          else armor.lineTo(px, py);
        }
        armor
          .closePath()
          .fill({ color: COLORS.shadowVoid, alpha: 0.97 })
          .stroke({ width: 2.6, color: 0xff4d6d, alpha: 0.95 });
        const fins = new Graphics();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          fins
            .arc(0, 0, 34, a - 0.35, a + 0.35)
            .stroke({ width: 3.2, color: 0xffb36b, alpha: 0.85 });
        }
        const core = new Graphics().circle(0, 0, 9.5).fill({ color: 0xff3b78, alpha: 0.96 });
        root.addChild(rim, fins, armor, core);
        view = { root, rim, armor, fins, core, baseRimTint: rim.tint };
        break;
      }
      case 'core':
      default: {
        const rim = this._makeRim(COLORS.shadowCrimson, 1.15, 0.62);
        const ringSprite = this._makeRingSprite(0xff6b95, 0.62, 0.55);
        const petals = new Graphics();
        const core = new Graphics();
        core
          .circle(0, 0, 21)
          .fill({ color: COLORS.shadowVoid, alpha: 0.99 })
          .stroke({ width: 2.5, color: COLORS.shadowCrimson, alpha: 0.98 });
        core.circle(0, 0, 7.5).fill({ color: 0xff3b78, alpha: 0.95 });
        root.addChild(rim, ringSprite, petals, core);
        view = { root, rim, ringSprite, petals, core, baseRimTint: rim.tint };
        enemy.view = view;
        this.drawCoreShield(enemy, enemy.getPetalCount?.() ?? 3);
        break;
      }
    }

    this.entityLayer.addChild(root);
    enemy.view = view;
    return view;
  }

  detachEnemy(enemy) {
    const view = enemy?.view;
    if (!view) return;
    if (view.root && view.root.parent) {
      this.entityLayer.removeChild(view.root);
    }
    view.root?.destroy?.({ children: true });
    enemy.view = null;
  }

  drawManta(enemy, flap) {
    const body = enemy?.view?.body;
    if (!body) return;
    const wing = 22 + Math.sin(flap) * 5;
    body.clear();
    body
      .moveTo(18, 0)
      .bezierCurveTo(6, -12, -8, -wing, -15, -wing * 0.72)
      .quadraticCurveTo(-8, 0, -24, 0)
      .quadraticCurveTo(-8, 0, -15, wing * 0.72)
      .bezierCurveTo(-8, wing, 6, 12, 18, 0)
      .closePath()
      .fill({ color: COLORS.shadowVoid, alpha: 0.96 })
      .stroke({ width: 1.8, color: COLORS.shadowViolet, alpha: 0.9 });
    body.circle(6, -3.5, 1.8).fill({ color: 0xff6da3, alpha: 0.95 });
    body.circle(6, 3.5, 1.8).fill({ color: 0xff6da3, alpha: 0.95 });
  }

  drawCoreShield(enemy, count) {
    const petals = enemy?.view?.petals;
    if (!petals) return;
    petals.clear();
    enemy.drawnShields = count;
    const totalSlots =
      enemy.getTotalPetalSlots?.() ?? Math.max(3, Math.ceil((enemy.maxShields || 30) / 10), count || 3);
    const petalSpan = Math.min(0.72, ((Math.PI * 2) / totalSlots) * 0.62);
    for (let i = 0; i < count; i++) {
      const a0 = (i * Math.PI * 2) / totalSlots - petalSpan * 0.5;
      const a1 = a0 + petalSpan;
      const rOuter = 36;
      const rInner = 30;
      petals
        .moveTo(Math.cos(a0) * rOuter, Math.sin(a0) * rOuter)
        .arc(0, 0, rOuter, a0, a1)
        .lineTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner)
        .arc(0, 0, rInner, a1, a0, true)
        .closePath()
        .fill({ color: 0x1a0828, alpha: 0.96 })
        .stroke({ width: 1.8, color: 0xff8ea6, alpha: 0.92 });
    }
  }

  renderEnemy(enemy, dt, time) {
    const view = enemy.view || this.attachEnemy(enemy);
    const active = enemy.isActive();

    if ((enemy.markTimer || 0) > 0 && active) {
      this.telegraphGraphics
        .circle(enemy.x, enemy.y, enemy.radius + 5.5)
        .stroke({ width: 1.4, color: COLORS.lumenGold, alpha: Math.min(0.7, 0.35 + enemy.markTimer * 0.15) });
    }

    if ((enemy.burnTimer || 0) > 0 && active) {
      const bAlpha = Math.min(0.75, 0.3 + enemy.burnTimer * 0.2);
      this.telegraphGraphics
        .circle(enemy.x, enemy.y, enemy.radius + 3.5)
        .stroke({ width: 1.5, color: enemy.burnTint || COLORS.lumenGold, alpha: bAlpha });
    }

    if (enemy.kind === 'lancer') {
      if (!active) {
        const prog = enemy.age / enemy.spawnDelay;
        const pulse = 0.35 + 0.65 * Math.abs(Math.sin(prog * Math.PI * 5));
        const width = prog > 0.78 ? 3.4 : 1.7;
        this.strokeTelegraphLine(
          enemy.startX,
          enemy.startY,
          enemy.targetX,
          enemy.targetY,
          width,
          prog > 0.78 ? 0xff7096 : COLORS.shadowCrimson,
          0.38 + pulse * 0.56
        );
        return;
      }

      view.root.visible = true;
      view.root.x = enemy.x;
      view.root.y = enemy.y;
      this.drawRibbonTrail(enemy.trail, 7, 0xff2e6a);
    } else {
      if (!active) {
        const t = clamp(enemy.age / enemy.spawnDelay, 0, 1);
        view.root.alpha = t * 0.78;
        view.root.scale.set(0.35 + 0.65 * easeOutCubic(t));
        this.telegraphGraphics
          .circle(enemy.x, enemy.y, (1 - t) * 26 + enemy.radius)
          .stroke({ width: 1.5, color: COLORS.shadowCrimson, alpha: (1 - t) * 0.55 });
      } else {
        view.root.alpha = 1;
        view.root.scale.set(1);
      }

      view.root.x = enemy.x;
      view.root.y = enemy.y;

      switch (enemy.kind) {
        case 'stalker': {
          view.root.rotation = enemy.angle;
          view.rim.alpha = enemy.lungeCharge > 0 ? 0.96 : enemy.lungeActive > 0 ? 0.85 : 0.48;
          view.rim.scale.set(enemy.lungeCharge > 0 ? 0.64 : 0.46);
          const sway = Math.sin(time * 9 + enemy.phase) * 7;
          view.tail.clear();
          view.tail
            .moveTo(-10, -3)
            .quadraticCurveTo(-22, sway, -34, -sway * 0.6)
            .quadraticCurveTo(-22, sway * 0.4 + 2, -10, 3)
            .fill({ color: COLORS.shadowVoid, alpha: 0.72 })
            .stroke({ width: 1, color: COLORS.shadowViolet, alpha: 0.45 });
          break;
        }
        case 'manta': {
          view.root.rotation = enemy.angle;
          this.drawManta(enemy, time * 6.5 + enemy.phase);
          this.drawRibbonTrail(enemy.trail, 8, COLORS.shadowViolet);
          break;
        }
        case 'sentinel': {
          if (active) {
            if (enemy.pulseWaveAge >= 0) {
              const waveT = enemy.pulseWaveAge / 0.55;
              const waveR = enemy.radius + easeOutCubic(waveT) * 56;
              this.telegraphGraphics
                .circle(enemy.x, enemy.y, waveR)
                .stroke({ width: 2.6, color: 0xff3b78, alpha: (1 - waveT) * 0.78 });
            } else if (enemy.pulseCharge > 0) {
              const chargeFrac = clamp(enemy.pulseCharge / 0.85, 0, 1);
              this.telegraphGraphics
                .circle(enemy.x, enemy.y, enemy.radius + chargeFrac * 36)
                .stroke({ width: 1.4, color: COLORS.shadowViolet, alpha: (1 - chargeFrac) * 0.7 });
            }
          }
          view.shards.rotation += dt * (enemy.pulseCharge > 0 ? 4.2 : 1.45);
          const pulse = 0.85 + 0.15 * Math.sin(time * 4 + enemy.phase);
          view.ringSprite.scale.set(0.42 * pulse);
          view.rim.alpha = (enemy.pulseCharge > 0 ? 0.72 : 0.36) + 0.14 * Math.sin(time * 4 + enemy.phase);
          break;
        }
        case 'vortex': {
          if (active) {
            const ringAnim = (time * 0.75 + enemy.phase) % 1;
            this.telegraphGraphics
              .circle(enemy.x, enemy.y, lerp(enemy.pullRadius * 0.72, enemy.radius + 4, ringAnim))
              .stroke({
                width: 1.2,
                color: COLORS.shadowViolet,
                alpha: (1 - Math.abs(ringAnim - 0.5) * 2) * 0.28,
              });
          }
          view.swirl.rotation -= dt * 2.6;
          view.rim.alpha = 0.34 + 0.12 * Math.sin(time * 3.4 + enemy.phase);
          break;
        }
        case 'warden': {
          view.shell.rotation += dt * 1.1;
          view.rim.alpha = 0.42 + 0.16 * Math.sin(time * 4.5 + enemy.phase);
          break;
        }
        case 'spitter': {
          if (active && enemy.fireCharge > 0) {
            const aimX = Math.cos(enemy.aimAngle);
            const aimY = Math.sin(enemy.aimAngle);
            const perpX = -aimY;
            const perpY = aimX;
            const prog = 1 - clamp(enemy.fireCharge / 0.62, 0, 1);
            const converge = (1 - prog) * 14;
            const beamLen = 58 + prog * 48;
            this.strokeTelegraphLine(
              enemy.x + aimX * 14 + perpX * converge,
              enemy.y + aimY * 14 + perpY * converge,
              enemy.x + aimX * beamLen,
              enemy.y + aimY * beamLen,
              1.7,
              0xff6bd6,
              0.45 + prog * 0.52
            );
            this.strokeTelegraphLine(
              enemy.x + aimX * 14 - perpX * converge,
              enemy.y + aimY * 14 - perpY * converge,
              enemy.x + aimX * beamLen,
              enemy.y + aimY * beamLen,
              1.7,
              0xff6bd6,
              0.45 + prog * 0.52
            );
            this.strokeTelegraphCircle(
              enemy.x + aimX * 16,
              enemy.y + aimY * 16,
              4 + prog * 4,
              1.8,
              0xffb3ea,
              0.55 + prog * 0.42
            );
          }
          view.root.rotation = enemy.angle;
          view.eye.scale.set(enemy.fireCharge > 0 ? 1.38 : 1.0);
          view.rim.alpha = enemy.fireCharge > 0 ? 0.92 : 0.45 + 0.12 * Math.sin(time * 5 + enemy.phase);
          break;
        }
        case 'artillery': {
          if (active && enemy.fireCharge > 0) {
            const prog = 1 - clamp(enemy.fireCharge / 0.85, 0, 1);
            const fanR = 46 + prog * 40;
            for (const offset of [-0.28, 0, 0.28]) {
              const a = enemy.aimAngle + offset;
              this.strokeTelegraphLine(
                enemy.x + Math.cos(a) * 14,
                enemy.y + Math.sin(a) * 14,
                enemy.x + Math.cos(a) * fanR,
                enemy.y + Math.sin(a) * fanR,
                2.0,
                0xc77dff,
                0.45 + prog * 0.5
              );
              this.telegraphGraphics
                .circle(enemy.x + Math.cos(a) * fanR, enemy.y + Math.sin(a) * fanR, 2.8 + prog * 2)
                .fill({ color: 0xe6b8ff, alpha: 0.55 + prog * 0.42 });
            }
            this.telegraphGraphics
              .moveTo(
                enemy.x + Math.cos(enemy.aimAngle - 0.34) * fanR,
                enemy.y + Math.sin(enemy.aimAngle - 0.34) * fanR
              )
              .arc(enemy.x, enemy.y, fanR, enemy.aimAngle - 0.34, enemy.aimAngle + 0.34)
              .stroke({ width: 1.8, color: 0xc77dff, alpha: 0.38 + prog * 0.48 });
          }
          view.frame.rotation += dt * (enemy.fireCharge > 0 ? 3.8 : 1.15);
          view.core.scale.set(enemy.fireCharge > 0 ? 1.32 : 0.95 + 0.12 * Math.sin(time * 4 + enemy.phase));
          view.rim.alpha = enemy.fireCharge > 0 ? 0.88 : 0.44;
          break;
        }
        case 'harbinger': {
          if (active) {
            if (enemy.ringCharge > 0) {
              const prog = 1 - clamp(enemy.ringCharge / 0.9, 0, 1);
              const baseA = time * 0.9 + enemy.phase;
              const ringR = 30 + (1 - prog) * 34;
              this.strokeTelegraphCircle(enemy.x, enemy.y, ringR, 2.6, 0xffcf7d, 0.42 + prog * 0.55);
              for (let k = 0; k < 8; k++) {
                const a = baseA + (k * Math.PI * 2) / 8;
                this.strokeTelegraphLine(
                  enemy.x + Math.cos(a) * 20,
                  enemy.y + Math.sin(a) * 20,
                  enemy.x + Math.cos(a) * (54 + prog * 36),
                  enemy.y + Math.sin(a) * (54 + prog * 36),
                  1.9,
                  0xff7eb6,
                  0.4 + prog * 0.54
                );
              }
            } else if (enemy.boltCharge > 0) {
              const prog = 1 - clamp(enemy.boltCharge / 0.55, 0, 1);
              const lanceLen = 62 + prog * 54;
              for (const off of [-0.18, 0.18]) {
                const a = enemy.boltAngle + off;
                this.strokeTelegraphLine(
                  enemy.x + Math.cos(a) * 18,
                  enemy.y + Math.sin(a) * 18,
                  enemy.x + Math.cos(a) * lanceLen,
                  enemy.y + Math.sin(a) * lanceLen,
                  2.2,
                  0xffcf7d,
                  0.48 + prog * 0.5
                );
              }
            }
          }
          view.outerHalo.rotation += dt * 1.4;
          view.runes.rotation -= dt * 2.1;
          view.jewel.scale.set(enemy.ringCharge > 0 ? 1.36 : 1.0);
          view.rim.alpha = enemy.ringCharge > 0 ? 0.96 : 0.62 + 0.14 * Math.sin(time * 4.2 + enemy.phase);
          break;
        }
        case 'behemoth': {
          if (active) {
            if (enemy.dashCharge > 0) {
              const prog = 1 - clamp(enemy.dashCharge / 0.92, 0, 1);
              const cosD = Math.cos(enemy.dashAngle);
              const sinD = Math.sin(enemy.dashAngle);
              this.strokeTelegraphLine(
                enemy.x,
                enemy.y,
                enemy.x + cosD * 260,
                enemy.y + sinD * 260,
                4.2 + prog * 6,
                0xff3b78,
                0.35 + prog * 0.55
              );
              this.strokeTelegraphCircle(
                enemy.x,
                enemy.y,
                enemy.radius + 8 + prog * 18,
                2.4,
                0xffb36b,
                0.45 + prog * 0.52
              );
            } else if (enemy.dashActive > 0) {
              const slamProg = 1 - clamp(enemy.dashActive / 0.56, 0, 1);
              this.strokeTelegraphCircle(
                enemy.x,
                enemy.y,
                enemy.radius + 10 + slamProg * 14,
                2.8,
                0xff6b95,
                0.48 + slamProg * 0.44
              );
              for (let k = 0; k < 6; k++) {
                const a = enemy.dashAngle + (k * Math.PI * 2) / 6;
                this.strokeTelegraphLine(
                  enemy.x + Math.cos(a) * (enemy.radius + 4),
                  enemy.y + Math.sin(a) * (enemy.radius + 4),
                  enemy.x + Math.cos(a) * (enemy.radius + 22 + slamProg * 28),
                  enemy.y + Math.sin(a) * (enemy.radius + 22 + slamProg * 28),
                  2.2,
                  0xff5d6c,
                  0.4 + slamProg * 0.55
                );
              }
            }
          }
          view.armor.rotation += dt * 0.75;
          view.fins.rotation -= dt * (enemy.dashCharge > 0 || enemy.dashActive > 0 ? 4.4 : 1.7);
          view.rim.alpha = enemy.dashActive > 0 ? 0.98 : enemy.dashCharge > 0 ? 0.88 : 0.62;
          break;
        }
        case 'core': {
          view.petals.rotation += dt * 1.9;
          const corePulse = 0.88 + 0.14 * Math.sin(time * 5 + enemy.phase);
          view.ringSprite.scale.set(0.62 * corePulse);
          view.rim.alpha = 0.52 + 0.18 * Math.sin(time * 5 + enemy.phase);
          const wantedPetals = enemy.getPetalCount?.() ?? Math.max(0, Math.ceil((enemy.shields - 0.001) / 10));
          if (wantedPetals !== enemy.drawnShields) {
            this.drawCoreShield(enemy, wantedPetals);
          }
          if (active) {
            const RING_CHARGE = 0.85;
            const RING_DUR = 0.9;
            const RING_MAX_R = 230;
            if (enemy.guardRingAge >= 0) {
              const rt = enemy.guardRingAge / RING_DUR;
              const ringR = lerp(32, RING_MAX_R, rt);
              this.strokeTelegraphCircle(
                enemy.guardOriginX,
                enemy.guardOriginY,
                ringR,
                4.2,
                0xff5288,
                0.92 * (1 - rt * 0.3)
              );
              this.telegraphGraphics
                .circle(enemy.guardOriginX, enemy.guardOriginY, Math.max(10, ringR - 6))
                .stroke({ width: 1.6, color: 0xffc2d6, alpha: 0.55 * (1 - rt * 0.35) });
            } else if (enemy.guardCharge > 0) {
              const ct = Math.min(1, enemy.guardCharge / RING_CHARGE);
              this.strokeTelegraphCircle(enemy.x, enemy.y, RING_MAX_R, 1.4, 0xff5288, 0.24 + ct * 0.32);
              this.strokeTelegraphCircle(enemy.x, enemy.y, 28 + ct * 22, 2.8, 0xff7aa5, 0.5 + ct * 0.48);
            }
          }
          break;
        }
      }

      if (enemy.age >= enemy.life) {
        const fadeOut = 1 - (enemy.age - enemy.life) / 0.6;
        view.root.alpha = Math.max(0, fadeOut);
      }
    }

    if (!active) return;

    if (view.rim) {
      if (enemy.hitFlashTimer > 0) {
        view.rim.tint = 0xffffff;
        view.rim.alpha = 0.96;
      } else if (view.baseRimTint !== null) {
        view.rim.tint = view.baseRimTint;
      }
    }
    if (enemy.hitFlashTimer > 0) {
      const pop = 1 + 0.18 * (enemy.hitFlashTimer / 0.14);
      view.root.scale.set(pop);
    }

    if (!enemy.invulnerable && enemy.kind !== 'core' && enemy.maxHp > 10 && enemy.hp > 0) {
      this.drawHpPips(enemy, time);
    }
  }

  renderProjectiles(projectiles, time) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      const style = p.kind || p.style || 'nova';
      const tx = p.x - p.vx * 0.05;
      const ty = p.y - p.vy * 0.05;
      const spd = Math.hypot(p.vx, p.vy) || 1;
      const dx = p.vx / spd;
      const dy = p.vy / spd;
      const px = -dy;
      const py = dx;

      if (style === 'dart' || style === 'lance') {
        const tipLen = style === 'lance' ? p.radius * 2.4 : p.radius * 2.0;
        const tailLen = style === 'lance' ? p.radius * 1.9 : p.radius * 1.5;
        const wing = p.radius * 0.85;
        this.projectileGraphics
          .moveTo(tx - dx * 6, ty - dy * 6)
          .lineTo(p.x, p.y)
          .stroke({ width: p.radius * 1.4, color: 0x05020d, alpha: 0.72, cap: 'round' })
          .moveTo(tx - dx * 6, ty - dy * 6)
          .lineTo(p.x, p.y)
          .stroke({ width: p.radius * 0.95, color: p.color, alpha: 0.52, cap: 'round' })
          .moveTo(p.x + dx * tipLen, p.y + dy * tipLen)
          .lineTo(p.x - dx * tailLen + px * wing, p.y - dy * tailLen + py * wing)
          .lineTo(p.x - dx * (tailLen * 0.45), p.y - dy * (tailLen * 0.45))
          .lineTo(p.x - dx * tailLen - px * wing, p.y - dy * tailLen - py * wing)
          .closePath()
          .stroke({ width: 3.4, color: 0x05020d, alpha: 0.85 })
          .fill({ color: p.color, alpha: 0.98 })
          .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
      } else if (style === 'tri') {
        this.projectileGraphics
          .moveTo(tx, ty)
          .lineTo(p.x, p.y)
          .stroke({ width: p.radius * 1.1, color: p.color, alpha: 0.48, cap: 'round' })
          .circle(p.x, p.y, p.radius * 1.8)
          .stroke({ width: 3.0, color: 0x05020d, alpha: 0.72 })
          .circle(p.x, p.y, p.radius * 1.7)
          .stroke({ width: 1.6, color: p.color, alpha: 0.65 })
          .circle(p.x, p.y, p.radius * 1.05)
          .fill({ color: 0x1a0b2e, alpha: 0.96 })
          .stroke({ width: 2.1, color: p.color, alpha: 0.98 })
          .circle(p.x, p.y, p.radius * 0.45)
          .fill({ color: 0xf4dcff, alpha: 0.98 });
      } else if (style === 'bomb') {
        const pulse = 1 + 0.16 * Math.sin(time * 16 + p.age * 10);
        this.projectileGraphics
          .moveTo(tx, ty)
          .lineTo(p.x, p.y)
          .stroke({ width: p.radius * 1.35, color: p.color, alpha: 0.48, cap: 'round' })
          .circle(p.x, p.y, p.radius * 1.7 * pulse)
          .stroke({ width: 3.6, color: 0x05020d, alpha: 0.78 })
          .circle(p.x, p.y, p.radius * 1.7 * pulse)
          .stroke({ width: 2.1, color: 0xffb36b, alpha: 0.72 })
          .circle(p.x, p.y, p.radius * 1.1)
          .fill({ color: p.color, alpha: 0.98 })
          .circle(p.x, p.y, p.radius * 0.46)
          .fill({ color: 0xfff0cc, alpha: 0.98 });
      } else {
        this.projectileGraphics
          .moveTo(tx, ty)
          .lineTo(p.x, p.y)
          .stroke({ width: p.radius * 1.15, color: p.color, alpha: 0.52, cap: 'round' })
          .circle(p.x, p.y, p.radius * 1.65)
          .fill({ color: 0x05020d, alpha: 0.65 })
          .circle(p.x, p.y, p.radius * 1.35)
          .stroke({ width: 2.2, color: 0x05020d, alpha: 0.82 })
          .circle(p.x, p.y, p.radius)
          .fill({ color: p.color, alpha: 0.98 })
          .circle(p.x, p.y, p.radius * 0.45)
          .fill({ color: 0xffffff, alpha: 0.98 });
      }
    }
  }

  strokeTelegraphLine(x1, y1, x2, y2, width, color, alpha = 0.8) {
    this.telegraphGraphics
      .moveTo(x1, y1)
      .lineTo(x2, y2)
      .stroke({ width: width + 2.6, color: 0x05020d, alpha: Math.min(0.84, alpha * 0.92), cap: 'round' })
      .moveTo(x1, y1)
      .lineTo(x2, y2)
      .stroke({ width, color, alpha, cap: 'round' });
  }

  strokeTelegraphCircle(x, y, radius, width, color, alpha = 0.8) {
    this.telegraphGraphics
      .circle(x, y, radius)
      .stroke({ width: width + 2.6, color: 0x05020d, alpha: Math.min(0.84, alpha * 0.92) })
      .circle(x, y, radius)
      .stroke({ width, color, alpha });
  }

  drawHpPips(enemy, time = 0) {
    const r = enemy.radius + 7;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    const low = enemy.hp <= 10.001;
    const color = low ? COLORS.lumenGold : 0xff76a8;
    const alpha = low ? 0.85 : 0.62;

    if (enemy.maxHp <= 80) {
      const pipTotal = Math.max(1, Math.ceil((enemy.maxHp - 0.001) / 10));
      const lit = Math.max(1, Math.ceil((enemy.hp - 0.001) / 10));
      const baseRot = time * 1.15 + enemy.phase;
      for (let i = 0; i < pipTotal; i++) {
        const a = baseRot + (i * Math.PI * 2) / pipTotal;
        const px = enemy.x + Math.cos(a) * r;
        const py = enemy.y + Math.sin(a) * r;
        this.telegraphGraphics
          .circle(px, py, i < lit ? 2.2 : 1.5)
          .fill({ color: i < lit ? color : 0xffffff, alpha: i < lit ? alpha : 0.16 });
      }
    } else {
      const startA = -Math.PI * 0.5;
      const arcW = enemy.isElite ? 3.2 : 2.0;
      const arcColor = enemy.isElite ? 0xffcf7d : color;
      this.telegraphGraphics
        .circle(enemy.x, enemy.y, r)
        .stroke({ width: enemy.isElite ? 2.2 : 1.5, color: 0xffffff, alpha: enemy.isElite ? 0.2 : 0.14 });
      this.telegraphGraphics
        .moveTo(enemy.x, enemy.y - r)
        .arc(enemy.x, enemy.y, r, startA, startA + Math.PI * 2 * ratio)
        .stroke({ width: arcW, color: arcColor, alpha: enemy.isElite ? 0.92 : alpha });
    }
  }

  drawRibbonTrail(pts, maxWidth, rimColor) {
    if (!pts || pts.length < 2) return;
    for (let s = 0; s < pts.length - 1; s++) {
      const t = 1 - s / pts.length;
      this.trailGraphics
        .moveTo(pts[s].x, pts[s].y)
        .lineTo(pts[s + 1].x, pts[s + 1].y)
        .stroke({
          width: Math.max(1, maxWidth * t),
          color: s < 3 ? rimColor : COLORS.shadowVoid,
          alpha: t * 0.45,
          cap: 'round',
        });
    }
  }
}
