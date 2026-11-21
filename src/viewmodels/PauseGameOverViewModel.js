import { Observable } from '../core/Observable.js';
import { formatDuration } from '../core/MathUtils.js';

/**
 * MVVM ViewModel for the Pause Screen and Game Over Summary Screen.
 */
export class PauseGameOverViewModel {
  constructor() {
    this.pauseScoreText = new Observable('0');
    this.pauseBestText = new Observable('0');
    this.finalScoreText = new Observable('0');
    this.finalTimeText = new Observable('0:00');
    this.finalPurgedText = new Observable('0');
    this.finalElitesText = new Observable('0');
    this.luminanceEarnedText = new Observable('+0 LUM');
  }

  syncPause({ score = 0, highScore = 0 } = {}) {
    this.pauseScoreText.value = Math.floor(score).toLocaleString();
    this.pauseBestText.value = Math.floor(Math.max(score, highScore)).toLocaleString();
  }

  syncGameOver(info = {}) {
    this.finalScoreText.value = Math.floor(info.score || 0).toLocaleString();
    this.finalTimeText.value = formatDuration(info.survivalTime || 0);
    this.finalPurgedText.value = String(info.purgedCount || 0);
    this.finalElitesText.value = String(info.elitesDefeated || 0);
    this.luminanceEarnedText.value = `+${(info.luminanceEarned || 0).toLocaleString()} LUM`;
  }
}
