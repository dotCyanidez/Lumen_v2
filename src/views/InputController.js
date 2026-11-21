import { COLORS, GAME_STATES } from '../core/Constants.js';
import { storage } from '../core/Storage.js';

/**
 * View-layer Input Controller encapsulating keyboard, pointer, touch, and window focus/visibility
 * bindings and translating them into normalized movement/dash commands for the coordinator.
 */
export class InputController {
  constructor(game = null) {
    this.game = game;
    this.keys = new Set();
    this.pointer = {
      active: false,
      inside: false,
      x: 640,
      y: 360,
      id: null,
      lastTapTime: 0,
    };
    this._bound = false;
  }

  readMoveInput(game = this.game) {
    let mx = 0;
    let my = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;

    const isTouch = Boolean(game?.ui?.isTouchMode);
    const hoverGlide = storage.cursorGlide && this.pointer.inside && !isTouch;
    const wp = game?._screenToWorld
      ? game._screenToWorld(this.pointer.x, this.pointer.y)
      : { x: this.pointer.x, y: this.pointer.y };

    return {
      moveX: mx,
      moveY: my,
      pointerActive: this.pointer.active || hoverGlide,
      pointerX: wp.x,
      pointerY: wp.y,
    };
  }

  bindInputs(game = this.game) {
    if (game) this.game = game;
    const target = this.game;
    if (!target || this._bound) return;
    this._bound = true;

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'Space'
      ) {
        e.preventDefault();
      }
      target.audio.unlock();
      this.keys.add(code);

      if (target.blessingDraftOpen) {
        if (target.blessingDraftLockTimer > 0) return;
        let pickIdx = -1;
        if (code === 'Digit1' || code === 'Numpad1') pickIdx = 0;
        else if (code === 'Digit2' || code === 'Numpad2') pickIdx = 1;
        else if (code === 'Digit3' || code === 'Numpad3') pickIdx = 2;
        if (pickIdx >= 0 && !e.repeat && target.blessingOptions[pickIdx]) {
          target.audio.playUIClick();
          const pickedUid = target.blessingOptions[pickIdx].uid;
          if (target.ui.banishMode) {
            target.ui.banishMode = false;
            target.banishDraftOption(pickedUid);
          } else {
            target.chooseBlessing(pickedUid);
          }
        }
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        if (target.ui.isSanctuaryOpen?.()) {
          target.ui.closeSanctuary();
        } else if (target.ui.isSettingsOpen()) {
          target.ui.closeSettings();
        } else if (target.ui.isGuideOpen()) {
          target.ui.closeGuide();
        } else if (target.state === GAME_STATES.PLAYING || target.state === GAME_STATES.PAUSED) {
          target.togglePause();
        }
        return;
      }

      if (code === 'KeyM' && !e.repeat) {
        target.toggleMuteAll();
        return;
      }

      if (
        code === 'KeyR' &&
        !e.repeat &&
        (target.state === GAME_STATES.PLAYING ||
          target.state === GAME_STATES.PAUSED ||
          target.state === GAME_STATES.DYING ||
          target.state === GAME_STATES.GAMEOVER)
      ) {
        if (target.ui.isGuideOpen()) target.ui.closeGuide();
        target.startNewRun();
        return;
      }

      if (target.state === GAME_STATES.PLAYING) {
        if ((code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') && !e.repeat) {
          target.triggerDash();
        }
      } else if (target.state === GAME_STATES.GAMEOVER && target.gameOverAge > 0.55) {
        if ((code === 'Space' || code === 'Enter') && !e.repeat) {
          target.startNewRun();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointer.active = false;
      if (target.state === GAME_STATES.PLAYING) {
        target.pauseGame();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && target.state === GAME_STATES.PLAYING) {
        target.pauseGame();
      }
    });

    const canvas = target.app.canvas;

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      target.audio.unlock();
      if (target.state === GAME_STATES.PLAYING) {
        const rect = canvas.getBoundingClientRect();
        const tx = e.clientX - rect.left;
        const ty = e.clientY - rect.top;
        const wp = target._screenToWorld(tx, ty);
        target.triggerDash(wp.x - target.player.x, wp.y - target.player.y);
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      target.audio.unlock();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.pointerType === 'touch') {
        target.ui.enableTouchControls();
      }

      if (e.button === 2) {
        if (target.state === GAME_STATES.PLAYING) {
          const wp = target._screenToWorld(x, y);
          target.triggerDash(wp.x - target.player.x, wp.y - target.player.y);
        }
        return;
      }

      // Secondary finger tap on touch triggers Dash seamlessly!
      if (
        this.pointer.active &&
        e.pointerId !== this.pointer.id &&
        target.state === GAME_STATES.PLAYING
      ) {
        target.triggerDash();
        return;
      }

      this.pointer.active = true;
      this.pointer.inside = true;
      this.pointer.id = e.pointerId;
      this.pointer.x = x;
      this.pointer.y = y;
    });

    window.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
      this.pointer.inside =
        this.pointer.x >= 0 &&
        this.pointer.y >= 0 &&
        this.pointer.x <= target.width &&
        this.pointer.y <= target.height;

      if (
        target.state === GAME_STATES.TITLE &&
        this.pointer.inside &&
        target.titleCursorSparkTimer <= 0
      ) {
        target.titleCursorSparkTimer = 0.045;
        const wp = target._screenToWorld(this.pointer.x, this.pointer.y);
        target.particles.emitTrailEmber(
          wp.x,
          wp.y,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          Math.random() < 0.35 ? COLORS.lumenGold : COLORS.lumenCyan
        );
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerId === this.pointer.id) {
        this.pointer.active = false;
        this.pointer.id = null;
      }
    });

    window.addEventListener('pointercancel', (e) => {
      if (e.pointerId === this.pointer.id) {
        this.pointer.active = false;
        this.pointer.id = null;
      }
    });
  }
}
