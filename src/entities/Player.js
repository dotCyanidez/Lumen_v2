import { PlayerModel } from '../models/PlayerModel.js';
import { PlayerCanvasRenderer } from '../views/canvas/PlayerCanvasRenderer.js';

/**
 * Player entity combining pure `PlayerModel` domain kinematics/stats with
 * `PlayerCanvasRenderer` PixiJS display objects (zero-overhead inheritance).
 */
export class Player extends PlayerModel {
  constructor(textures) {
    super();
    this.renderer = new PlayerCanvasRenderer(textures);
    this.container = this.renderer.container;
    this.root = this.renderer.root;
    this.trailRope = this.renderer.trailRope;
    this.pointerTargetGlow = this.renderer.pointerTargetGlow;
  }

  applySpiritMods(mods = {}) {
    super.applySpiritMods(mods);
    this.renderer.applySpiritStyle(this);
  }

  reset(x, y, mods = null) {
    super.reset(x, y, mods);
    this.renderer.reset(this);
  }

  updateTitleIdle(dt, cx, cy, boundsW, boundsH, pointer, attractTarget = null) {
    this.stepTitleIdle(dt, cx, cy, boundsW, boundsH, pointer, attractTarget);
    this.renderer.updatePointerGlow(dt, null);
    this.renderer.render(dt, this, false);
  }

  update(dt, input, boundsW, boundsH, particles, envForces = null) {
    const { spawnGhost, pointerGlow, speed } = this.stepKinematics(
      dt,
      input,
      boundsW,
      boundsH,
      envForces
    );

    if (spawnGhost) {
      this.renderer.spawnGhost(this);
    }
    this.renderer.updatePointerGlow(dt, pointerGlow);

    // Emit delicate movement embers
    if (particles) {
      const rate = this.dashTimer > 0 ? 0.012 : speed > 90 ? 0.036 : 0.11;
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

    this.renderer.render(dt, this, true);
  }
}
