import { clamp, rand, seededRange as randRange } from '../core/MathUtils.js';
import { CollectibleModel } from '../models/CollectibleModel.js';
import { CollectibleCanvasRenderer } from '../views/canvas/CollectibleCanvasRenderer.js';

/**
 * Facade & Coordinator over pooled `CollectibleModel` domain objects and
 * pooled `CollectibleCanvasRenderer` PixiJS display slots (Audit Finding #4).
 */
export class CollectibleManager {
  constructor(textures) {
    this.textures = textures;
    this.renderer = new CollectibleCanvasRenderer(textures);
    this.container = this.renderer.container;
    this.threadGraphics = this.renderer.threadGraphics;
    this.constellationGraphics = this.renderer.constellationGraphics;
    this.itemsLayer = this.renderer.itemsLayer;

    this.items = [];
    this._modelPool = [];
    this.moteSpawnTimer = 0.6;
    this.prismSpawnTimer = 11.5;
    this.constellationTimer = 9.0;
    this.constellationIdCounter = 1;
    this.time = 0;
  }

  _acquireItem(spec) {
    const model = this._modelPool.length > 0 ? this._modelPool.pop() : new CollectibleModel();
    model.init(spec);
    this.renderer.attach(model);
    this.items.push(model);
    return model;
  }

  _recycleModel(model) {
    model.active = false;
    this._modelPool.push(model);
  }

  reset() {
    this.renderer.reset(this.items);
    for (let i = 0; i < this.items.length; i++) {
      this._recycleModel(this.items[i]);
    }
    this.items.length = 0;
    this.moteSpawnTimer = 0.35;
    this.prismSpawnTimer = 11.5;
    this.constellationTimer = 8.5;
  }

  spawnMote(x, y, isGolden = false) {
    return this._acquireItem({
      type: 'mote',
      isGolden,
      x,
      y,
      vx: randRange(-14, 14),
      vy: randRange(-14, 14),
      radius: isGolden ? 15 : 13,
      life: 15,
      baseValue: isGolden ? 85 : 50,
    });
  }

  spawnPrism(x, y) {
    return this._acquireItem({
      type: 'prism',
      isGolden: true,
      x,
      y,
      vx: randRange(-10, 10),
      vy: randRange(-10, 10),
      radius: 20,
      life: 13.5,
      baseValue: 300,
    });
  }

  /**
   * Drop an in-arena Luminance Shard from Guardian Shatters and Overdrive Waves.
   * Magnetizes cleanly on foot so players are rewarded for positioning into loot.
   */
  spawnShard(x, y, lumValue = 38) {
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(36, 72);
    return this._acquireItem({
      type: 'shard',
      isGolden: true,
      lumValue,
      lumAmount: lumValue,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 18,
      life: 16,
      baseValue: 150,
    });
  }

  /** Event Horizon synergy helper: magnetizes motes, stars & shards inside a radius. */
  magnetizeAllNear(cx, cy, radius = 340) {
    const rSq = radius * radius;
    let count = 0;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
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

      this._acquireItem({
        type: 'star',
        constellationId: cid,
        isGolden: true,
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        radius: 17,
        life: 17.5,
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
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
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
    this.renderer.beginFrame();

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

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
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
      const pos = this._pickSafeSpot(
        boundsW,
        boundsH,
        player.x,
        player.y,
        170,
        boundsW > 1600 ? 900 : null
      );
      this.spawnPrism(pos.x, pos.y);
    }

    this.constellationTimer -= dt;
    if (!hasConstellation && this.constellationTimer <= 0) {
      this.constellationTimer = randRange(17, 22);
      this.spawnConstellation(boundsW, boundsH, player.x, player.y);
    }

    // Draw luminous astral constellation threads connecting remaining stars
    this.renderer.drawConstellations(starGroups, this.time);

    let regularThreadCount = 0;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const stepRes = item.step(dt, player, boundsW, boundsH, pullSources, magnetMul, starPull);

      if (stepRes.expired) {
        this.renderer.release(item);
        this.items.splice(i, 1);
        this._recycleModel(item);
        continue;
      }

      if (stepRes.collected) {
        this.renderer.release(item);
        this.items.splice(i, 1);
        onCollect(item);
        this._recycleModel(item);
        continue;
      }

      if (item.magnetized) {
        const isHighValue =
          item.isGolden || item.type === 'star' || item.type === 'prism' || item.type === 'shard';
        if (isHighValue || regularThreadCount < 6) {
          if (!isHighValue) regularThreadCount++;
          this.renderer.drawMagnetThread(
            item,
            player,
            stepRes.dist,
            stepRes.magnetRange || 120,
            isHighValue
          );
        }
      }

      this.renderer.syncItemTransform(item, dt, this.time);
    }
  }
}
