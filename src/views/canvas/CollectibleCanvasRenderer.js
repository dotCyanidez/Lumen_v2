import { Container, Graphics, Sprite } from 'pixi.js';
import { COLORS } from '../../core/Constants.js';
import { clamp, easeOutBack, lerp } from '../../core/MathUtils.js';

/**
 * Pooled PixiJS View Renderer for `CollectibleModel` items (motes, prisms, shards, stars).
 * Reuses a fixed pool of `{ root, halo, ring, core, glint }` display slots rather than
 * allocating and destroying Pixi Containers/Sprites on every spawn & pickup (Audit Finding #4).
 */
export class CollectibleCanvasRenderer {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.threadGraphics = new Graphics();
    this.constellationGraphics = new Graphics();
    this.itemsLayer = new Container();
    this.container.addChild(this.constellationGraphics, this.threadGraphics, this.itemsLayer);

    this._slotPool = [];
  }

  _createSlot() {
    const root = new Container();
    root.visible = false;

    const halo = new Sprite(this.textures.glowSoft);
    halo.anchor.set(0.5);
    halo.blendMode = 'add';

    const ring = new Sprite(this.textures.ring);
    ring.anchor.set(0.5);
    ring.blendMode = 'add';

    const core = new Sprite(this.textures.diamond);
    core.anchor.set(0.5);

    const glint = new Sprite(this.textures.sparkStar);
    glint.anchor.set(0.5);
    glint.blendMode = 'add';

    root.addChild(halo, ring, core, glint);
    this.itemsLayer.addChild(root);
    return { root, halo, ring, core, glint };
  }

  _acquireSlot() {
    return this._slotPool.length > 0 ? this._slotPool.pop() : this._createSlot();
  }

  attach(item) {
    const view = item.view || this._acquireSlot();
    item.view = view;

    const { root, halo, ring, core, glint } = view;
    core.rotation = 0;
    glint.rotation = 0;

    if (item.type === 'prism') {
      halo.tint = COLORS.prismAura;
      halo.scale.set(0.56);
      halo.alpha = 0.4;

      ring.visible = true;
      ring.tint = COLORS.lumenCyan;
      ring.scale.set(0.36);
      ring.alpha = 0.48;

      core.texture = this.textures.diamond;
      core.blendMode = 'normal';
      core.tint = COLORS.prismCore;
      core.scale.set(0.38);
      core.alpha = 1;

      glint.texture = this.textures.sparkStar;
      glint.blendMode = 'add';
      glint.tint = COLORS.lumenGold;
      glint.scale.set(0.42);
      glint.alpha = 0.64;
    } else if (item.type === 'shard') {
      halo.tint = 0xd696ff;
      halo.scale.set(0.5);
      halo.alpha = 0.44;

      ring.visible = true;
      ring.tint = 0xffdf80;
      ring.scale.set(0.32);
      ring.alpha = 0.54;

      core.texture = this.textures.diamond;
      core.blendMode = 'normal';
      core.tint = 0xe8bcff;
      core.scale.set(0.36);
      core.alpha = 1;

      glint.texture = this.textures.sparkStar;
      glint.blendMode = 'add';
      glint.tint = 0xffe699;
      glint.scale.set(0.4);
      glint.alpha = 0.72;
    } else if (item.type === 'star') {
      halo.tint = 0xffe493;
      halo.scale.set(0.44);
      halo.alpha = 0.4;

      ring.visible = true;
      ring.tint = 0xffdf80;
      ring.scale.set(0.28);
      ring.alpha = 0.48;

      core.texture = this.textures.sparkStar;
      core.blendMode = 'add';
      core.tint = 0xffeeb5;
      core.scale.set(0.32);
      core.alpha = 0.68;

      glint.texture = this.textures.diamond;
      glint.blendMode = 'normal';
      glint.tint = 0xffe79a;
      glint.scale.set(0.24);
      glint.alpha = 1;
    } else {
      const gold = Boolean(item.isGolden);
      halo.tint = gold ? COLORS.moteGold : COLORS.moteCyan;
      halo.scale.set(gold ? 0.36 : 0.3);
      halo.alpha = 0.36;

      ring.visible = false;

      core.texture = this.textures.diamond;
      core.blendMode = 'normal';
      core.tint = gold ? COLORS.moteGold : 0xbefcf9;
      core.scale.set(gold ? 0.32 : 0.25);
      core.alpha = 1;

      glint.texture = this.textures.sparkStar;
      glint.blendMode = 'add';
      glint.tint = gold ? COLORS.moteGold : COLORS.moteCyan;
      glint.scale.set(gold ? 0.24 : 0.18);
      glint.alpha = 0.56;
    }

    root.x = item.x;
    root.y = item.y;
    root.scale.set(1);
    root.alpha = 1;
    root.visible = true;
    return view;
  }

  release(item) {
    if (!item?.view) return;
    item.view.root.visible = false;
    this._slotPool.push(item.view);
    item.view = null;
  }

  reset(items = []) {
    for (let i = 0; i < items.length; i++) {
      this.release(items[i]);
    }
    this.beginFrame();
  }

  beginFrame() {
    this.threadGraphics.clear();
    this.constellationGraphics.clear();
  }

  drawConstellations(starGroups, time) {
    for (const stars of starGroups.values()) {
      if (stars.length > 1) {
        const pulse = 0.28 + 0.16 * Math.sin(time * 4.0);
        for (let a = 0; a < stars.length; a++) {
          const s1 = stars[a];
          const s2 = stars[(a + 1) % stars.length];
          if (stars.length === 2 && a === 1) break;
          this.constellationGraphics
            .moveTo(s1.x, s1.y)
            .lineTo(s2.x, s2.y)
            .stroke({ width: 1.6, color: 0xffe493, alpha: pulse, cap: 'round' });
        }
      }
    }
  }

  drawMagnetThread(item, player, dist, magnetR, isHighValue) {
    const threadAlpha = clamp(1 - dist / (magnetR * 1.1), 0.18, 0.72);
    this.threadGraphics
      .moveTo(item.x, item.y)
      .lineTo(player.x, player.y)
      .stroke({
        width: isHighValue ? 1.5 : 1.1,
        color: item.isGolden ? COLORS.moteGold : COLORS.moteCyan,
        alpha: threadAlpha * (isHighValue ? 0.65 : 0.45),
        cap: 'round',
      });
  }

  syncItemTransform(item, dt, time) {
    const v = item?.view;
    if (!v) return;

    const spawnScale = item.age < 0.35 ? easeOutBack(item.age / 0.35) : 1;
    const expireAlpha = item.age > item.life - 2.2 ? Math.max(0, (item.life - item.age) / 2.2) : 1;
    const blink = item.age > item.life - 2.2 ? 0.55 + 0.45 * Math.sin(time * 16) : 1;

    v.root.x = item.x;
    v.root.y = item.y + Math.sin(time * 2.8 + item.phase) * (item.type === 'star' ? 1.8 : 2.5);
    v.root.scale.set(spawnScale);
    v.root.alpha = expireAlpha * blink;

    v.core.rotation =
      item.type === 'star'
        ? v.core.rotation + dt * 1.8
        : Math.sin(time * 2.2 + item.phase) * 0.25;
    v.glint.rotation += dt * (item.type === 'prism' || item.type === 'shard' ? 2.6 : 1.4);

    const pulse = 1 + Math.sin(time * 4.5 + item.phase) * 0.14;
    const haloBase =
      item.type === 'prism'
        ? 0.56
        : item.type === 'shard'
          ? 0.5
          : item.type === 'star'
            ? 0.44
            : item.isGolden
              ? 0.36
              : 0.3;
    v.halo.scale.set(haloBase * pulse);

    if (v.ring.visible) {
      const ringPulse = (time * 0.9 + item.phase) % 1;
      v.ring.scale.set(lerp(0.24, item.type === 'star' ? 0.52 : 0.64, ringPulse));
      v.ring.alpha = (1 - ringPulse) * 0.46;
    }
  }
}
