import { BaseEnemy } from './BaseEnemy.js';

/**
 * Lancer (`kind: 'lancer'`): telegraphed railgun snipe dash across the viewport.
 */
export class LancerEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    angle = 0,
    speedScale = 1,
    endDist = 1720,
    spawnDelay = 1.15,
    hpBonus = 0,
    hpMul = 1,
  } = {}) {
    const speed = 780 * Math.min(1.35, speedScale);
    super({
      kind: 'lancer',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
      spawnDelay,
      life: 4.5,
      speed,
      hpBonus,
      hpMul,
    });
    this.invulnerable = true;
    this.startX = x;
    this.startY = y;
    this.targetX = x + Math.cos(angle) * endDist;
    this.targetY = y + Math.sin(angle) * endDist;
    this.angle = angle;
    this.launched = false;
    this.telegraphedSound = false;
    this.trail = [];
    this._expired = false;
  }

  takeDamage() {
    return null;
  }

  applySlow() {}
  applyMark() {}
  applyBurn() {}

  updateAI(
    dt,
    { player, boundsW = 4200, boundsH = 3000, viewW = 1280, viewH = 720, onLancerTelegraph } = {}
  ) {
    if (!this.isActive()) {
      if (!this.telegraphedSound && onLancerTelegraph) {
        this.telegraphedSound = true;
        onLancerTelegraph();
      }
      return null;
    }

    if (!this.launched) {
      this.launched = true;
      this.trail.push({ x: this.x, y: this.y });
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 9) this.trail.pop();

    if (
      this.x < -140 ||
      this.x > boundsW + 140 ||
      this.y < -140 ||
      this.y > boundsH + 140 ||
      (player && Math.hypot(this.x - player.x, this.y - player.y) > Math.max(viewW, viewH) + 340)
    ) {
      this._expired = true;
      return { expired: true };
    }

    return null;
  }
}
