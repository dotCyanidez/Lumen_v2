import { Container, Graphics, Sprite } from 'pixi.js';
import { COLORS, PLAYER_CONFIG } from '../core/Constants.js';
import {
  clamp,
  damp,
  easeOutBack,
  lerp,
  rand,
  seededRange as randRange,
} from '../core/MathUtils.js';

export class CollectibleManager {
  constructor(textures) {
    this.textures = textures;
    this.container = new Container();

    this.threadGraphics = new Graphics();
    this.constellationGraphics = new Graphics();
    this.itemsLayer = new Container();
    this.container.addChild(this.constellationGraphics, this.threadGraphics, this.itemsLayer);

    this.items = [];
    this.moteSpawnTimer = 0.6;
    this.prismSpawnTimer = 11.5;
    this.constellationTimer = 9.0;
    this.constellationIdCounter = 1;
    this.time = 0;
  }

  reset() {
    this.items.length = 0;
    while (this.itemsLayer.children.length > 0) {
      const child = this.itemsLayer.removeChildAt(this.itemsLayer.children.length - 1);
      child.destroy({ children: true });
    }
    this.threadGraphics.clear();
    this.constellationGraphics.clear();
    this.moteSpawnTimer = 0.35;
    this.prismSpawnTimer = 11.5;
    this.constellationTimer = 8.5;
  }

  spawnMote(x, y, isGolden = false) {
    const root = new Container();
    root.x = x;
    root.y = y;

    const halo = new Sprite(this.textures.glowSoft);
    halo.anchor.set(0.5);
    halo.blendMode = 'add';
    halo.tint = isGolden ? COLORS.moteGold : COLORS.moteCyan;
    halo.scale.set(isGolden ? 0.36 : 0.3);
    halo.alpha = 0.36;

    const core = new Sprite(this.textures.diamond);
    core.anchor.set(0.5);
    core.tint = isGolden ? COLORS.moteGold : 0xbefcf9;
    core.scale.set(isGolden ? 0.32 : 0.25);

    const glint = new Sprite(this.textures.sparkStar);
    glint.anchor.set(0.5);
    glint.blendMode = 'add';
    glint.tint = isGolden ? COLORS.moteGold : COLORS.moteCyan;
    glint.scale.set(isGolden ? 0.24 : 0.18);
    glint.alpha = 0.56;

    root.addChild(halo, core, glint);
    this.itemsLayer.addChild(root);

    const item = {
      type: 'mote',
      isGolden,
      root,
      halo,
      core,
      glint,
      ring: null,
      x,
      y,
      vx: randRange(-14, 14),
      vy: randRange(-14, 14),
      radius: isGolden ? 15 : 13,
      age: 0,
      life: 15,
      phase: randRange(0, Math.PI * 2),
      magnetized: false,
      baseValue: isGolden ? 85 : 50,
    };
    this.items.push(item);
    return item;
  }

  spawnPrism(x, y) {
    const root = new Container();
    root.x = x;
    root.y = y;

    const halo = new Sprite(this.textures.glowSoft);
    halo.anchor.set(0.5);
    halo.blendMode = 'add';
    halo.tint = COLORS.prismAura;
    halo.scale.set(0.56);
    halo.alpha = 0.4;

    const ring = new Sprite(this.textures.ring);
    ring.anchor.set(0.5);
    ring.blendMode = 'add';
    ring.tint = COLORS.lumenCyan;
    ring.scale.set(0.36);
    ring.alpha = 0.48;

    const core = new Sprite(this.textures.diamond);
    core.anchor.set(0.5);
    core.tint = COLORS.prismCore;
    core.scale.set(0.38);

    const glint = new Sprite(this.textures.sparkStar);
    glint.anchor.set(0.5);
    glint.blendMode = 'add';
    glint.tint = COLORS.lumenGold;
    glint.scale.set(0.42);
    glint.alpha = 0.64;

    root.addChild(halo, ring, core, glint);
    this.itemsLayer.addChild(root);

    const item = {
      type: 'prism',
      isGolden: true,
      root,
      halo,
      core,
      glint,
      ring,
      x,
      y,
      vx: randRange(-10, 10),
      vy: randRange(-10, 10),
      radius: 20,
      age: 0,
      life: 13.5,
      phase: randRange(0, Math.PI * 2),
      magnetized: false,
      baseValue: 300,
    };
    this.items.push(item);
    return item;
  }

  /**
   * Drop an in-arena Luminance Shard from Guardian Shatters and Overdrive Waves.
   * Magnetizes cleanly on foot so players are rewarded for positioning into loot.
   */
  spawnShard(x, y, lumValue = 38) {
    const root = new Container();
    root.x = x;
    root.y = y;

    const halo = new Sprite(this.textures.glowSoft);
    halo.anchor.set(0.5);
    halo.blendMode = 'add';
    halo.tint = 0xd696ff;
    halo.scale.set(0.5);
    halo.alpha = 0.44;

    const ring = new Sprite(this.textures.ring);
    ring.anchor.set(0.5);
    ring.blendMode = 'add';
    ring.tint = 0xffdf80;
    ring.scale.set(0.32);
    ring.alpha = 0.54;

    const core = new Sprite(this.textures.diamond);
    core.anchor.set(0.5);
    core.tint = 0xe8bcff;
    core.scale.set(0.36);

    const glint = new Sprite(this.textures.sparkStar);
    glint.anchor.set(0.5);
    glint.blendMode = 'add';
    glint.tint = 0xffe699;
    glint.scale.set(0.4);
    glint.alpha = 0.72;

    root.addChild(halo, ring, core, glint);
    this.itemsLayer.addChild(root);

    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(36, 72);
    const item = {
      type: 'shard',
      isGolden: true,
      lumValue,
      root,
      halo,
      core,
      glint,
      ring,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 18,
      age: 0,
      life: 16,
      phase: randRange(0, Math.PI * 2),
      magnetized: false,
      baseValue: 150,
    };
    this.items.push(item);
    return item;
  }

  /** Event Horizon synergy helper: magnetizes motes, stars & shards inside a radius. */
  magnetizeAllNear(cx, cy, radius = 340) {
    const rSq = radius * radius;
    let count = 0;
    for (const item of this.items) {
      const dx = item.x - cx;
      const dy = item.y - cy;
      if (dx * dx + dy * dy <= rSq) {
        item.magnetized = true;
        count++;
      }
    }
    return count;
  }

  spawnConstellation(boundsW, boundsH, playerX = null, playerY = null) {
    const cid = this.constellationIdCounter++;
    const padX = Math.min(130, boundsW * 0.16);
    const padY = Math.min(130, boundsH * 0.16);
    let cx;
    let cy;
    if (playerX !== null && playerY !== null && boundsW > 1400) {
      const a = randRange(0, Math.PI * 2);
      const dist = randRange(260, 620);
      cx = clamp(playerX + Math.cos(a) * dist, padX, boundsW - padX);
      cy = clamp(playerY + Math.sin(a) * dist, padY, boundsH - padY);
    } else {
      cx = clamp(boundsW * randRange(0.32, 0.68), padX, boundsW - padX);
      cy = clamp(boundsH * randRange(0.32, 0.68), padY, boundsH - padY);
    }
    const radius = clamp(Math.min(boundsW, boundsH) * 0.2, 140, 220);
    const baseAngle = randRange(0, Math.PI * 2);

    for (let k = 0; k < 3; k++) {
      const a = baseAngle + (k * Math.PI * 2) / 3 + randRange(-0.2, 0.2);
      const sx = clamp(cx + Math.cos(a) * radius, padX, boundsW - padX);
      const sy = clamp(cy + Math.sin(a) * radius, padY, boundsH - padY);

      const root = new Container();
      root.x = sx;
      root.y = sy;

      const halo = new Sprite(this.textures.glowSoft);
      halo.anchor.set(0.5);
      halo.blendMode = 'add';
      halo.tint = 0xffe493;
      halo.scale.set(0.44);
      halo.alpha = 0.4;

      const ring = new Sprite(this.textures.ring);
      ring.anchor.set(0.5);
      ring.blendMode = 'add';
      ring.tint = 0xffdf80;
      ring.scale.set(0.28);
      ring.alpha = 0.48;

      const core = new Sprite(this.textures.sparkStar);
      core.anchor.set(0.5);
      core.blendMode = 'add';
      core.tint = 0xffeeb5;
      core.scale.set(0.32);
      core.alpha = 0.68;

      const glint = new Sprite(this.textures.diamond);
      glint.anchor.set(0.5);
      glint.tint = 0xffe79a;
      glint.scale.set(0.24);

      root.addChild(halo, ring, glint, core);
      this.itemsLayer.addChild(root);

      this.items.push({
        type: 'star',
        constellationId: cid,
        isGolden: true,
        root,
        halo,
        core,
        glint,
        ring,
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        radius: 17,
        age: 0,
        life: 17.5,
        phase: randRange(0, Math.PI * 2),
        magnetized: false,
        baseValue: 130,
      });
    }
  }

  seedInitial(boundsW, boundsH, playerX, playerY) {
    const count = boundsW > 1600 ? 34 : 7;
    for (let i = 0; i < count; i++) {
      const maxDist = i < 7 ? 560 : null;
      const pos = this._pickSafeSpot(boundsW, boundsH, playerX, playerY, 130, maxDist);
      this.spawnMote(pos.x, pos.y, i === 0 || i % 6 === 0);
    }
  }

  _pickSafeSpot(boundsW, boundsH, playerX, playerY, minDist = 110, maxDist = null) {
    const padX = Math.min(95, boundsW * 0.12);
    const padY = Math.min(95, boundsH * 0.14);
    for (let attempt = 0; attempt < 8; attempt++) {
      let x;
      let y;
      if (maxDist && maxDist > minDist) {
        const a = randRange(0, Math.PI * 2);
        const r = randRange(minDist, maxDist);
        x = clamp(playerX + Math.cos(a) * r, padX, Math.max(padX + 20, boundsW - padX));
        y = clamp(playerY + Math.sin(a) * r, padY, Math.max(padY + 20, boundsH - padY));
      } else {
        x = randRange(padX, Math.max(padX + 20, boundsW - padX));
        y = randRange(padY, Math.max(padY + 20, boundsH - padY));
      }
      if (Math.hypot(x - playerX, y - playerY) >= minDist) {
        return { x, y };
      }
    }
    return {
      x: randRange(padX, Math.max(padX + 20, boundsW - padX)),
      y: randRange(padY, Math.max(padY + 20, boundsH - padY)),
    };
  }

  countRemainingInConstellation(cid) {
    let count = 0;
    for (const item of this.items) {
      if (item.type === 'star' && item.constellationId === cid) count++;
    }
    return count;
  }

  update(
    dt,
    player,
    boundsW,
    boundsH,
    onCollect,
    pullSources = [],
    magnetMul = 1,
    starPull = false
  ) {
    this.time += dt;
    this.threadGraphics.clear();
    this.constellationGraphics.clear();

    const targetMotes =
      boundsW > 1600
        ? clamp(Math.round((boundsW * boundsH) / 280000), 14, 44)
        : boundsW < 640
          ? 7
          : 9;
    let moteCount = 0;
    let prismCount = 0;
    let hasConstellation = false;
    const starGroups = new Map();

    for (const item of this.items) {
      if (item.type === 'mote') moteCount++;
      else if (item.type === 'prism') prismCount++;
      else if (item.type === 'star') {
        hasConstellation = true;
        if (!starGroups.has(item.constellationId)) {
          starGroups.set(item.constellationId, []);
        }
        starGroups.get(item.constellationId).push(item);
      }
    }

    this.moteSpawnTimer -= dt;
    if (moteCount < targetMotes && this.moteSpawnTimer <= 0) {
      this.moteSpawnTimer = moteCount < 10 ? 0.24 : 0.65;
      const nearby = boundsW > 1600 && rand() < 0.48;
      const pos = this._pickSafeSpot(boundsW, boundsH, player.x, player.y, 120, nearby ? 680 : null);
      this.spawnMote(pos.x, pos.y, rand() < 0.22);
    }

    this.prismSpawnTimer -= dt;
    if (prismCount === 0 && this.prismSpawnTimer <= 0) {
      this.prismSpawnTimer = randRange(13, 18);
      const pos = this._pickSafeSpot(boundsW, boundsH, player.x, player.y, 170, boundsW > 1600 ? 900 : null);
      this.spawnPrism(pos.x, pos.y);
    }

    this.constellationTimer -= dt;
    if (!hasConstellation && this.constellationTimer <= 0) {
      this.constellationTimer = randRange(17, 22);
      this.spawnConstellation(boundsW, boundsH, player.x, player.y);
    }

    // Draw luminous astral constellation threads connecting remaining stars
    for (const stars of starGroups.values()) {
      if (stars.length > 1) {
        const pulse = 0.28 + 0.16 * Math.sin(this.time * 4.0);
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

    const magnetR = PLAYER_CONFIG.magnetRadius * magnetMul;
    const magnetRSq = magnetR * magnetR;
    const pickupR = PLAYER_CONFIG.radius + 14;
    let regularThreadCount = 0;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.age += dt;

      if (item.age >= item.life) {
        this.itemsLayer.removeChild(item.root);
        item.root.destroy({ children: true });
        this.items.splice(i, 1);
        continue;
      }

      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const dSq = dx * dx + dy * dy;

      const pullRadiusSq =
        item.type === 'shard'
          ? magnetRSq * 1.45
          : item.type === 'prism'
            ? magnetRSq * 1.15
            : item.type === 'star'
              ? magnetRSq * (starPull ? 1.55 : 0.92)
              : magnetRSq;
      if (dSq < pullRadiusSq) {
        item.magnetized = true;
      }

      if (item.magnetized) {
        const dist = Math.max(1, Math.sqrt(dSq));
        const pullSpeed = item.type === 'shard' ? 500 : item.type === 'prism' ? 460 : 540;
        item.vx = damp(item.vx, (dx / dist) * pullSpeed, 11, dt);
        item.vy = damp(item.vy, (dy / dist) * pullSpeed, 11, dt);

        // Draw magnetic threads for high-value pickups & cap regular mote lines to reduce clutter
        const isHighValue =
          item.isGolden || item.type === 'star' || item.type === 'prism' || item.type === 'shard';
        if (isHighValue || regularThreadCount < 6) {
          if (!isHighValue) regularThreadCount++;
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
      } else if (item.type === 'star' && starPull) {
        const dist = Math.max(1, Math.sqrt(dSq));
        item.vx = damp(item.vx, (dx / dist) * 115, 3.2, dt);
        item.vy = damp(item.vy, (dy / dist) * 115, 3.2, dt);
      } else if (item.type !== 'star') {
        item.vx *= Math.exp(-0.9 * dt);
        item.vy *= Math.exp(-0.9 * dt);
        item.vx += Math.cos(this.time * 1.4 + item.phase) * 12 * dt;
        item.vy += Math.sin(this.time * 1.7 + item.phase) * 12 * dt;

        for (const src of pullSources) {
          const vdx = src.x - item.x;
          const vdy = src.y - item.y;
          const vdSq = vdx * vdx + vdy * vdy;
          if (vdSq < src.radius * src.radius && vdSq > 900) {
            const vd = Math.sqrt(vdSq);
            const pull = (1 - vd / src.radius) * src.strength * dt;
            item.vx += (vdx / vd) * pull;
            item.vy += (vdy / vd) * pull;
          }
        }
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      const pad = 28;
      if (item.x < pad) {
        item.x = pad;
        item.vx = Math.abs(item.vx);
      } else if (item.x > boundsW - pad) {
        item.x = boundsW - pad;
        item.vx = -Math.abs(item.vx);
      }
      if (item.y < pad) {
        item.y = pad;
        item.vy = Math.abs(item.vy);
      } else if (item.y > boundsH - pad) {
        item.y = boundsH - pad;
        item.vy = -Math.abs(item.vy);
      }

      const collectDist =
        pickupR + (item.type === 'prism' || item.type === 'shard' ? 8 : item.type === 'star' ? 5 : 2);
      if (dSq <= collectDist * collectDist) {
        const removed = item;
        this.itemsLayer.removeChild(item.root);
        item.root.destroy({ children: true });
        this.items.splice(i, 1);
        onCollect(removed);
        continue;
      }

      const spawnScale = item.age < 0.35 ? easeOutBack(item.age / 0.35) : 1;
      const expireAlpha = item.age > item.life - 2.2 ? Math.max(0, (item.life - item.age) / 2.2) : 1;
      const blink =
        item.age > item.life - 2.2 ? 0.55 + 0.45 * Math.sin(this.time * 16) : 1;

      item.root.x = item.x;
      item.root.y = item.y + Math.sin(this.time * 2.8 + item.phase) * (item.type === 'star' ? 1.8 : 2.5);
      item.root.scale.set(spawnScale);
      item.root.alpha = expireAlpha * blink;

      item.core.rotation =
        item.type === 'star'
          ? item.core.rotation + dt * 1.8
          : Math.sin(this.time * 2.2 + item.phase) * 0.25;
      item.glint.rotation += dt * (item.type === 'prism' || item.type === 'shard' ? 2.6 : 1.4);
      const pulse = 1 + Math.sin(this.time * 4.5 + item.phase) * 0.14;
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
      item.halo.scale.set(haloBase * pulse);

      if (item.ring) {
        const ringPulse = (this.time * 0.9 + item.phase) % 1;
        item.ring.scale.set(lerp(0.24, item.type === 'star' ? 0.52 : 0.64, ringPulse));
        item.ring.alpha = (1 - ringPulse) * 0.46;
      }
    }
  }
}
