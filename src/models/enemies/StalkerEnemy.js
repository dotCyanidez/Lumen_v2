import { clamp, damp, seededRange, wrapAngle } from '../../core/MathUtils.js';
import { BaseEnemy } from './BaseEnemy.js';

/**
 * Stalker (`kind: 'stalker'`): fast homing chaser with periodic Predator Lunge bursts.
 */
export class StalkerEnemy extends BaseEnemy {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    angle = 0,
    speedScale = 1,
    speed = seededRange(132, 165) * speedScale,
    turnRate = 2.35,
    radius = 14,
    spawnDelay = 0.65,
    life = 24,
    phase = seededRange(0, Math.PI * 2),
    hpBonus = 0,
    hpMul = 1,
    splitWisp = false,
  } = {}) {
    super({
      kind: 'stalker',
      x,
      y,
      vx,
      vy,
      radius,
      spawnDelay,
      life,
      speed,
      phase,
      hpBonus,
      hpMul,
    });
    this.angle = angle;
    this.turnRate = turnRate;
    this.lungeTimer = seededRange(3.0, 5.0);
    this.lungeCharge = 0;
    this.lungeActive = 0;
    this.splitWisp = Boolean(splitWisp);
  }

  updateAI(dt, { player } = {}) {
    if (!this.isActive() || !player) return null;

    const speedMult = this.getSpeedMultiplier();
    const desiredAngle = Math.atan2(player.y - this.y, player.x - this.x);
    const diff = wrapAngle(desiredAngle - this.angle);
    this.angle += clamp(diff, -this.turnRate * dt, this.turnRate * dt);

    this.lungeTimer -= dt;
    if (this.lungeTimer <= 0 && this.lungeCharge <= 0 && this.lungeActive <= 0) {
      this.lungeCharge = 0.34;
    }
    if (this.lungeCharge > 0) {
      this.lungeCharge = Math.max(0, this.lungeCharge - dt);
      if (this.lungeCharge <= 0) {
        this.lungeActive = 0.44;
        this.lungeTimer = seededRange(3.2, 5.2);
      }
    }
    if (this.lungeActive > 0) {
      this.lungeActive = Math.max(0, this.lungeActive - dt);
    }

    const lungeFactor = this.lungeCharge > 0 ? 0.38 : this.lungeActive > 0 ? 1.68 : 1.0;
    const spd = this.speed * lungeFactor * speedMult;
    this.vx = damp(this.vx, Math.cos(this.angle) * spd, 6.0, dt);
    this.vy = damp(this.vy, Math.sin(this.angle) * spd, 6.0, dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return null;
  }
}
