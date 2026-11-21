import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { COLORS } from '../core/Constants.js';
import { easeOutBack, lerp, randRange } from '../core/MathUtils.js';

const POOL_SIZE = 340;
const CALLOUT_POOL_SIZE = 24;
const DAMAGE_NUM_POOL_SIZE = 56;

function formatDamageNumber(amount) {
  const val = Number(amount);
  if (!Number.isFinite(val) || val <= 0) return '';
  if (val >= 10 || Math.abs(val - Math.round(val)) < 0.05) {
    return String(Math.max(1, Math.round(val)));
  }
  if (val >= 0.1) {
    return Number(val.toFixed(1)).toString();
  }
  return Number(Math.max(0.01, val).toFixed(2)).toString();
}

export class ParticleSystem {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.normalLayer = new Container();
    this.addLayer = new Container();
    this.arcGraphics = new Graphics();
    this.calloutLayer = new Container();

    this.container.addChild(this.normalLayer, this.addLayer, this.arcGraphics);

    this.particles = [];
    this.activeArcs = [];
    this.callouts = [];
    this.damageNumbers = [];
    this.damageNumCursor = 0;

    for (let i = 0; i < POOL_SIZE; i++) {
      const sprite = new Sprite(textures.glowTight);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.addLayer.addChild(sprite);
      this.particles.push({
        sprite,
        active: false,
        isNormal: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        drag: 3,
        buoyancy: 0,
        age: 0,
        life: 0.5,
        startScale: 0.4,
        endScale: 0.02,
        startAlpha: 1,
        endAlpha: 0,
        spin: 0,
        alignVelocity: false,
      });
    }

    for (let i = 0; i < CALLOUT_POOL_SIZE; i++) {
      this.callouts.push(this._createPopupSlot('#ffffff', 0.85, 1));
    }

    for (let i = 0; i < DAMAGE_NUM_POOL_SIZE; i++) {
      this.damageNumbers.push(this._createPopupSlot('#ff6d94', 0.88, 1.1));
    }
  }

  _createPopupSlot(fill = '#ffffff', life = 0.88, targetScale = 1.0) {
    const text = new Text({
      text: '',
      style: {
        fontFamily: 'Outfit, system-ui, sans-serif',
        fontSize: 16,
        fontWeight: '700',
        fill,
        letterSpacing: 1.5,
        dropShadow: {
          color: 0x030712,
          blur: 6,
          distance: 1,
          alpha: 0.85,
        },
      },
    });
    text.anchor.set(0.5);
    text.visible = false;
    this.calloutLayer.addChild(text);
    return {
      label: text,
      active: false,
      x: 0,
      y: 0,
      vy: -42,
      age: 0,
      life,
      targetScale,
    };
  }

  _acquire(isNormal = false) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        if (p.isNormal !== isNormal) {
          p.isNormal = isNormal;
          if (isNormal) {
            this.normalLayer.addChild(p.sprite);
            p.sprite.blendMode = 'normal';
          } else {
            this.addLayer.addChild(p.sprite);
            p.sprite.blendMode = 'add';
          }
        }
        p.active = true;
        p.age = 0;
        p.sprite.visible = true;
        return p;
      }
    }
    return null;
  }

  spawn({
    x,
    y,
    vx = 0,
    vy = 0,
    texture = this.textures.glowTight,
    tint = 0xffffff,
    life = 0.5,
    startScale = 0.3,
    endScale = 0.02,
    startAlpha = 0.9,
    endAlpha = 0,
    drag = 3.2,
    buoyancy = 0,
    spin = 0,
    rotation = 0,
    alignVelocity = false,
    isNormal = false,
  }) {
    const p = this._acquire(isNormal);
    if (!p) return null;

    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.drag = drag;
    p.buoyancy = buoyancy;
    p.life = life;
    p.startScale = startScale;
    p.endScale = endScale;
    p.startAlpha = startAlpha;
    p.endAlpha = endAlpha;
    p.spin = spin;
    p.alignVelocity = alignVelocity;

    p.sprite.texture = texture;
    p.sprite.tint = tint;
    p.sprite.x = x;
    p.sprite.y = y;
    p.sprite.rotation = rotation;
    p.sprite.scale.set(startScale);
    p.sprite.alpha = startAlpha;
    return p;
  }

  emitShockRing(x, y, startScale = 0.25, endScale = 1.9, tint = COLORS.lumenCyan, life = 0.45, startAlpha = 0.8) {
    this.spawn({
      x,
      y,
      texture: this.textures.ring,
      tint,
      life,
      startScale,
      endScale,
      startAlpha,
      endAlpha: 0,
      drag: 0,
    });
  }

  emitTrailEmber(x, y, vx, vy, tint = COLORS.lumenCyan, trailStyle = 'mist', accentTint = COLORS.lumenGold) {
    if (trailStyle === 'stardust') {
      this.spawn({
        x: x + randRange(-7, 7),
        y: y + randRange(-7, 7),
        vx: vx * 0.1 + randRange(-32, 32),
        vy: vy * 0.1 + randRange(-32, 32),
        texture: Math.random() > 0.45 ? this.textures.diamond : this.textures.sparkStar,
        tint: Math.random() > 0.4 ? accentTint : tint,
        life: randRange(0.38, 0.65),
        startScale: randRange(0.11, 0.2),
        endScale: 0.01,
        startAlpha: 0.56,
        drag: 2.2,
        buoyancy: -22,
        spin: randRange(-6, 6),
      });
      return;
    }
    if (trailStyle === 'prism') {
      const dual = Math.random() > 0.5;
      this.spawn({
        x: x + randRange(-6, 6),
        y: y + randRange(-6, 6),
        vx: vx * 0.12 + randRange(-28, 28),
        vy: vy * 0.12 + randRange(-28, 28),
        texture: dual ? this.textures.diamond : this.textures.sparkStar,
        tint: dual ? tint : accentTint,
        life: randRange(0.36, 0.62),
        startScale: randRange(0.14, 0.24),
        endScale: 0.02,
        startAlpha: 0.62,
        drag: 2.6,
        buoyancy: -14,
        spin: randRange(-5, 5),
      });
      return;
    }
    if (trailStyle === 'solar') {
      const a = Math.atan2(-vy, -vx) + randRange(-0.48, 0.48);
      const spd = randRange(45, 110);
      const useStreak = Math.random() > 0.35;
      this.spawn({
        x: x + randRange(-5, 5),
        y: y + randRange(-5, 5),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: useStreak ? this.textures.streak : this.textures.sparkStar,
        tint: useStreak ? accentTint : tint,
        life: randRange(0.24, 0.42),
        startScale: randRange(0.12, 0.22),
        endScale: 0.01,
        startAlpha: 0.58,
        drag: 3.4,
        alignVelocity: useStreak,
        spin: useStreak ? 0 : randRange(-7, 7),
      });
      return;
    }

    this.spawn({
      x: x + randRange(-4, 4),
      y: y + randRange(-4, 4),
      vx: vx * 0.14 + randRange(-24, 24),
      vy: vy * 0.14 + randRange(-24, 24),
      texture: Math.random() > 0.72 ? this.textures.sparkStar : this.textures.glowTight,
      tint,
      life: randRange(0.28, 0.52),
      startScale: randRange(0.09, 0.18),
      endScale: 0.01,
      startAlpha: 0.46,
      drag: 2.8,
      buoyancy: -18,
      spin: randRange(-3, 3),
    });
  }

  emitMotePickup(x, y, tint = COLORS.moteGold) {
    this.emitShockRing(x, y, 0.12, 0.75, tint, 0.32, 0.44);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + randRange(-0.22, 0.22);
      const spd = randRange(75, 220);
      const isStar = i % 3 === 0;
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: isStar ? this.textures.sparkStar : this.textures.streak,
        tint,
        life: randRange(0.24, 0.42),
        startScale: isStar ? randRange(0.14, 0.22) : randRange(0.14, 0.24),
        endScale: 0.02,
        startAlpha: 0.54,
        drag: 5.2,
        alignVelocity: !isStar,
        spin: isStar ? randRange(-5, 5) : 0,
      });
    }
  }

  emitPrismBurst(x, y) {
    this.emitShockRing(x, y, 0.2, 2.5, COLORS.lumenGold, 0.56, 0.52);
    this.emitShockRing(x, y, 0.14, 1.8, COLORS.lumenCyan, 0.44, 0.44);

    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + randRange(-0.1, 0.1);
      const spd = randRange(130, 350);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: i % 2 === 0 ? this.textures.sparkStar : this.textures.diamond,
        tint: i % 2 === 0 ? COLORS.lumenGold : COLORS.lumenCyan,
        life: randRange(0.36, 0.65),
        startScale: randRange(0.16, 0.28),
        endScale: 0.02,
        startAlpha: 0.54,
        drag: 3.4,
        spin: randRange(-6, 6),
      });
    }
  }

  emitDashBurst(x, y, angle) {
    this.emitShockRing(x, y, 0.18, 2.0, COLORS.lumenCyan, 0.36, 0.48);
    this.emitShockRing(x, y, 0.12, 1.25, COLORS.lumenGold, 0.28, 0.42);

    for (let i = 0; i < 12; i++) {
      // Cone bursting backward & radially from dash origin
      const spread = angle + Math.PI + randRange(-1.15, 1.15);
      const spd = randRange(140, 410);
      const isStreak = i % 2 === 0;
      this.spawn({
        x,
        y,
        vx: Math.cos(spread) * spd,
        vy: Math.sin(spread) * spd,
        texture: isStreak ? this.textures.streak : this.textures.sparkStar,
        tint: i % 2 === 0 ? COLORS.lumenCyan : COLORS.lumenGold,
        life: randRange(0.22, 0.42),
        startScale: isStreak ? randRange(0.2, 0.36) : randRange(0.13, 0.22),
        endScale: 0.02,
        startAlpha: 0.52,
        drag: 4.6,
        alignVelocity: isStreak,
        spin: isStreak ? 0 : randRange(-6, 6),
      });
    }
  }

  emitPurgeExplosion(x, y) {
    this.emitShockRing(x, y, 0.2, 1.85, COLORS.lumenGold, 0.38, 0.54);

    // Shadow ink burst
    for (let i = 0; i < 12; i++) {
      const a = randRange(0, Math.PI * 2);
      const spd = randRange(60, 220);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: this.textures.inkPuff,
        tint: i % 3 === 0 ? 0x240a2c : 0x07040f,
        life: randRange(0.35, 0.65),
        startScale: randRange(0.32, 0.62),
        endScale: 0.06,
        startAlpha: 0.85,
        drag: 4.0,
        isNormal: true,
      });
    }

    // Radiant purification sparks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + randRange(-0.2, 0.2);
      const spd = randRange(140, 350);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: i % 3 === 0 ? this.textures.sparkStar : this.textures.streak,
        tint: i % 3 === 0 ? COLORS.lumenCyan : COLORS.lumenGold,
        life: randRange(0.26, 0.46),
        startScale: randRange(0.16, 0.3),
        endScale: 0.02,
        startAlpha: 0.54,
        drag: 4.8,
        alignVelocity: i % 3 !== 0,
      });
    }
  }

  emitGrazeSparks(px, py, ex, ey) {
    this.activeArcs.push({
      ax: px,
      ay: py,
      bx: ex,
      by: ey,
      age: 0,
      life: 0.18,
      color: COLORS.grazeSpark,
      width: 1.8,
      jitter: 14,
      steps: 4,
    });

    const mx = (px + ex) * 0.5;
    const my = (py + ey) * 0.5;
    for (let i = 0; i < 5; i++) {
      const a = randRange(0, Math.PI * 2);
      const spd = randRange(70, 200);
      this.spawn({
        x: mx,
        y: my,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: this.textures.sparkStar,
        tint: i % 2 === 0 ? COLORS.grazeSpark : COLORS.lumenGold,
        life: randRange(0.2, 0.34),
        startScale: randRange(0.12, 0.21),
        endScale: 0.01,
        startAlpha: 0.62,
        drag: 5.5,
      });
    }
  }

  emitChainSlash(ax, ay, bx, by) {
    this.activeArcs.push({
      ax,
      ay,
      bx,
      by,
      age: 0,
      life: 0.32,
      color: COLORS.lumenGold,
      width: 2.8,
      jitter: 6,
      steps: 6,
    });
  }

  emitChainLightning(ax, ay, bx, by) {
    this.activeArcs.push({
      ax,
      ay,
      bx,
      by,
      age: 0,
      life: 0.29,
      color: COLORS.lumenCyan,
      width: 3.6,
      glowWidth: 7.5,
      jitter: 28,
      steps: 8,
    });
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      this.spawn({
        x: lerp(ax, bx, t),
        y: lerp(ay, by, t),
        vx: randRange(-85, 85),
        vy: randRange(-85, 85),
        texture: this.textures.sparkStar,
        tint: i % 2 === 0 ? COLORS.lumenCyan : COLORS.lumenGold,
        life: randRange(0.22, 0.4),
        startScale: randRange(0.21, 0.32),
        endScale: 0.01,
        startAlpha: 0.68,
        drag: 4.5,
      });
    }
  }

  emitEclipseCoreShatter(x, y) {
    this.emitShockRing(x, y, 0.2, 3.6, COLORS.lumenGold, 0.72, 0.56);
    this.emitShockRing(x, y, 0.14, 2.7, COLORS.lumenCyan, 0.58, 0.48);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + randRange(-0.12, 0.12);
      const spd = randRange(140, 440);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: i % 2 === 0 ? this.textures.sparkStar : this.textures.streak,
        tint: i % 2 === 0 ? COLORS.lumenGold : COLORS.lumenCyan,
        life: randRange(0.38, 0.8),
        startScale: randRange(0.18, 0.32),
        endScale: 0.02,
        startAlpha: 0.58,
        drag: 3.2,
        alignVelocity: i % 2 !== 0,
        spin: i % 2 === 0 ? randRange(-6, 6) : 0,
      });
    }
  }

  emitHitBurst(x, y) {
    this.emitShockRing(x, y, 0.2, 2.5, COLORS.shadowCrimson, 0.46, 0.68);
    for (let i = 0; i < 18; i++) {
      const a = randRange(0, Math.PI * 2);
      const spd = randRange(110, 320);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: i % 2 === 0 ? this.textures.streak : this.textures.glowTight,
        tint: i % 3 === 0 ? COLORS.grazeSpark : COLORS.shadowCrimson,
        life: randRange(0.28, 0.56),
        startScale: randRange(0.2, 0.38),
        endScale: 0.02,
        startAlpha: 0.66,
        drag: 3.8,
        alignVelocity: i % 2 === 0,
      });
    }
  }

  emitDeathShatter(x, y) {
    this.emitShockRing(x, y, 0.25, 4.2, COLORS.lumenCyan, 0.9, 0.95);
    this.emitShockRing(x, y, 0.15, 2.9, COLORS.lumenGold, 0.75, 0.88);
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * Math.PI * 2 + randRange(-0.15, 0.15);
      const spd = randRange(60, 420);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        texture: i % 3 === 0 ? this.textures.sparkStar : this.textures.glowTight,
        tint: i % 3 === 0 ? 0xffffff : i % 2 === 0 ? COLORS.lumenGold : COLORS.lumenCyan,
        life: randRange(0.65, 1.35),
        startScale: randRange(0.18, 0.42),
        endScale: 0.01,
        startAlpha: 1,
        drag: 2.2,
        buoyancy: -28,
        spin: randRange(-4, 4),
      });
    }
  }

  spawnCallout(x, y, text, color = '#ffe599', scale = 1.0, boundsW = 1280, boundsH = 720) {
    const halfW = Math.min(boundsW * 0.42, Math.max(78, text.length * 6.5 * scale + 18));
    const cx = Math.max(halfW, Math.min(Math.max(halfW + 4, boundsW - halfW), x));
    let cy = Math.max(56, Math.min(Math.max(70, boundsH - 48), y));

    for (let attempt = 0; attempt < 5; attempt++) {
      const collides = this.callouts.some(
        (other) => other.active && Math.abs(other.x - cx) < halfW + 42 && Math.abs(other.y - cy) < 26
      );
      if (!collides) break;
      cy = Math.max(56, cy - 26);
    }

    for (let i = 0; i < this.callouts.length; i++) {
      const c = this.callouts[i];
      if (!c.active) {
        c.active = true;
        c.age = 0;
        c.life = 0.88;
        c.x = cx;
        c.y = cy;
        c.vy = -42;
        c.targetScale = scale;
        c.label.text = text;
        c.label.style.fill = color;
        c.label.x = cx;
        c.label.y = cy;
        c.label.alpha = 1;
        c.label.scale.set(0.3);
        c.label.visible = true;
        return;
      }
    }
  }

  spawnDamageNumber(x, y, amount, { isDot = false, isCrit = false } = {}) {
    const labelText = formatDamageNumber(amount);
    if (!labelText || this.damageNumbers.length === 0) return;

    let cy = y - 14;
    for (let attempt = 0; attempt < 3; attempt++) {
      const collides = this.damageNumbers.some(
        (other) => other.active && Math.abs(other.x - x) < 28 && Math.abs(other.y - cy) < 20
      );
      if (!collides) break;
      cy -= 20;
    }

    let slot = null;
    for (let i = 0; i < this.damageNumbers.length; i++) {
      if (!this.damageNumbers[i].active) {
        slot = this.damageNumbers[i];
        break;
      }
    }
    if (!slot) {
      slot = this.damageNumbers[this.damageNumCursor % this.damageNumbers.length];
      this.damageNumCursor++;
    }

    slot.active = true;
    slot.age = 0;
    slot.life = 0.88;
    slot.x = x;
    slot.y = cy;
    slot.vy = -42;
    slot.targetScale = isDot ? 0.9 : 1.1;
    slot.label.text = labelText;
    slot.label.style.fill = '#ff6d94';
    slot.label.x = x;
    slot.label.y = cy;
    slot.label.alpha = 1;
    slot.label.scale.set(0.3);
    slot.label.visible = true;
  }

  clearAll() {
    for (const p of this.particles) {
      p.active = false;
      p.sprite.visible = false;
    }
    for (const c of this.callouts) {
      c.active = false;
      c.label.visible = false;
    }
    for (const d of this.damageNumbers) {
      d.active = false;
      d.label.visible = false;
    }
    this.activeArcs.length = 0;
    this.arcGraphics.clear();
  }

  update(dt) {
    // Update sprite particles & track additive density to keep enemy telegraphs legible
    let activeAdd = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        p.sprite.visible = false;
        continue;
      }

      if (!p.isNormal) activeAdd++;
      const t = p.age / p.life;
      if (p.drag > 0) {
        const dampFactor = Math.exp(-p.drag * dt);
        p.vx *= dampFactor;
        p.vy *= dampFactor;
      }
      p.vy += p.buoyancy * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.scale.set(lerp(p.startScale, p.endScale, t));
      p.sprite.alpha = lerp(p.startAlpha, p.endAlpha, t * t);

      if (p.alignVelocity && (p.vx !== 0 || p.vy !== 0)) {
        p.sprite.rotation = Math.atan2(p.vy, p.vx);
      } else if (p.spin !== 0) {
        p.sprite.rotation += p.spin * dt;
      }
    }

    this.addLayer.alpha = activeAdd > 65 ? Math.max(0.56, 1 - (activeAdd - 65) * 0.0035) : 1;
    this.arcGraphics.alpha = activeAdd > 80 ? Math.max(0.65, 1 - (activeAdd - 80) * 0.003) : 1;

    // Draw graze / chain electric & slash arcs
    this.arcGraphics.clear();
    for (let i = this.activeArcs.length - 1; i >= 0; i--) {
      const arc = this.activeArcs[i];
      arc.age += dt;
      if (arc.age >= arc.life) {
        this.activeArcs.splice(i, 1);
        continue;
      }
      const alpha = 1 - arc.age / arc.life;
      const dx = arc.bx - arc.ax;
      const dy = arc.by - arc.ay;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;
      const steps = arc.steps || 4;
      const jitterAmt = arc.jitter !== undefined ? arc.jitter : 14;

      const pts = [{ x: arc.ax, y: arc.ay }];
      for (let s = 1; s < steps; s++) {
        const frac = s / steps;
        const jitter = (Math.random() - 0.5) * jitterAmt;
        pts.push({
          x: arc.ax + dx * frac + nx * jitter,
          y: arc.ay + dy * frac + ny * jitter,
        });
      }
      pts.push({ x: arc.bx, y: arc.by });

      const traceArc = () => {
        this.arcGraphics.moveTo(pts[0].x, pts[0].y);
        for (let s = 1; s < pts.length; s++) {
          this.arcGraphics.lineTo(pts[s].x, pts[s].y);
        }
      };

      if (arc.glowWidth > 0) {
        traceArc();
        this.arcGraphics.stroke({
          width: arc.glowWidth * (0.65 + 0.35 * alpha),
          color: arc.color || COLORS.grazeSpark,
          alpha: alpha * 0.32,
          cap: 'round',
        });
      }

      traceArc();
      this.arcGraphics.stroke({
        width: (arc.width || 2.2) * (0.65 + 0.35 * alpha),
        color: arc.color || COLORS.grazeSpark,
        alpha: alpha * 0.92,
        cap: 'round',
      });
    }

    this._updatePopupList(this.callouts, dt);
    this._updatePopupList(this.damageNumbers, dt);
  }

  _updatePopupList(list, dt) {
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!c.active) continue;
      c.age += dt;
      if (c.age >= c.life) {
        c.active = false;
        c.label.visible = false;
        continue;
      }
      const t = c.age / c.life;
      c.y += c.vy * (1 - t * 0.65) * dt;
      c.label.x = c.x;
      c.label.y = c.y;

      const popT = Math.min(1, c.age / 0.16);
      const scale = c.targetScale * (popT < 1 ? lerp(0.5, 1, easeOutBack(popT)) : 1);
      c.label.scale.set(scale);
      c.label.alpha = t > 0.55 ? 1 - (t - 0.55) / 0.45 : 1;
    }
  }
}
