import { LumenGame } from './Game.js';

async function bootstrap() {
  const host = document.getElementById('canvas-host');
  if (!host) return;

  const game = new LumenGame(host);
  await game.init();

  // Expose debug hook safely if needed for inspection without interfering with gameplay
  window.__LUMEN_GAME__ = game;
}

bootstrap().catch((err) => {
  console.error('Failed to initialize LUMEN:', err);
});
