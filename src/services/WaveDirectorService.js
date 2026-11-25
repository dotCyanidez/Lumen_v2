import { PHASES } from '../core/Constants.js';

/**
 * Pure domain service for phase escalation, Endless Overdrive tier math,
 * and effective phase scaling parameters (SRP + DIP: zero Pixi/DOM imports).
 */
export class WaveDirectorService {
  static findTargetPhaseIndex(currentPhaseIndex, survivalTime, score) {
    let nextIdx = currentPhaseIndex;
    for (let i = PHASES.length - 1; i >= 0; i--) {
      const targetPhase = PHASES[i];
      const minAllowedTime = targetPhase.minTime * 0.85;
      const reachedByTime = survivalTime >= targetPhase.minTime;
      const reachedByScore = score >= targetPhase.minScore && survivalTime >= minAllowedTime;
      if (reachedByTime || reachedByScore) {
        nextIdx = Math.max(nextIdx, i);
        break;
      }
    }
    return nextIdx;
  }

  static computeOverdriveTier(currentPhaseIndex, survivalTime, score) {
    if (currentPhaseIndex < PHASES.length - 1 || survivalTime < 100) return 0;
    const timeTier = (survivalTime - 108) / 26;
    const scoreTier = (score - 13750) / 4500;
    return Math.max(0, Math.floor(Math.max(timeTier, Math.min(scoreTier, timeTier + 1))));
  }

  static getBaseHpBonusForPhase(phase) {
    if (!phase) return 0;
    if (phase.id >= 5) return 2;
    if (phase.id === 4) return 1;
    return 0;
  }

  static getOverdriveHpMul(overdriveTier = 0) {
    const od = Math.max(0, overdriveTier);
    return od > 4 ? +Math.pow(1.18, od - 4).toFixed(3) : 1;
  }

  static getOverdriveDamageMul(overdriveTier = 0) {
    const od = Math.max(0, overdriveTier);
    const lateExp = od > 12 ? Math.pow(1.08, od - 12) - 1 : 0;
    return +(1 + od * 0.14 + Math.max(0, od - 6) * 0.1 + lateExp).toFixed(3);
  }

  static buildEffectivePhase(phase, overdriveTier = 0, difficulty = null, dailyTwist = null) {
    const baseHpBonus = WaveDirectorService.getBaseHpBonusForPhase(phase);
    const od = Math.max(0, overdriveTier);
    const lateHpCurve = od > 5 ? Math.floor(Math.pow(od - 5, 1.35)) : 0;
    const odHpMul = WaveDirectorService.getOverdriveHpMul(od);
    return {
      ...phase,
      maxEnemies: Math.min(36, phase.maxEnemies + od * 3),
      spawnInterval: Math.max(
        0.26,
        (phase.spawnInterval - od * 0.04) / (difficulty?.spawnRateMul || 1)
      ),
      speedScale: Math.min(
        2.05,
        (phase.speedScale + od * 0.07) *
          (difficulty?.enemySpeedMul || 1) *
          (dailyTwist?.enemySpeedMul || 1)
      ),
      hpBonus: baseHpBonus + od + lateHpCurve,
      hpMul: +((difficulty?.hpMul || 1) * odHpMul).toFixed(3),
      overdriveDmgMul: WaveDirectorService.getOverdriveDamageMul(od),
    };
  }

  static getCoreExtraShieldsForPhase(phaseId, difficultyId = 'normal') {
    const diffShields = difficultyId === 'nightmare' ? 2 : difficultyId === 'hard' ? 1 : 0;
    return (phaseId === 5 ? 2 : 0) + diffShields;
  }

  static getCorePetalHp(phaseId = 3, overdriveTier = 0, hpMul = 1) {
    const od = Math.max(0, overdriveTier);
    const basePetal = (phaseId >= 5 ? 90 : 60) + od * 25;
    const odHpMul = WaveDirectorService.getOverdriveHpMul(od);
    return Math.max(10, Math.round(basePetal * (hpMul || 1) * odHpMul));
  }

  static getNextVolleyInterval(phaseId, overdriveTier = 0) {
    return Math.max(14, 26 - phaseId * 2 - overdriveTier);
  }

  static getNextEliteInterval(overdriveTier = 0) {
    return Math.max(26, 35 - overdriveTier * 2);
  }
}
