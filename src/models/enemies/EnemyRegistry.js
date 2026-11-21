import { StalkerEnemy } from './StalkerEnemy.js';
import { MantaEnemy } from './MantaEnemy.js';
import { SentinelEnemy } from './SentinelEnemy.js';
import { LancerEnemy } from './LancerEnemy.js';
import { SpitterEnemy } from './SpitterEnemy.js';
import { ArtilleryEnemy } from './ArtilleryEnemy.js';
import { WardenEnemy } from './WardenEnemy.js';
import { VortexEnemy } from './VortexEnemy.js';
import { HarbingerElite } from './HarbingerElite.js';
import { BehemothElite } from './BehemothElite.js';
import { EclipseCoreBoss } from './EclipseCoreBoss.js';

/**
 * Open/Closed Enemy Factory Registry mapping `kind` strings to pure OOP Enemy classes.
 */
export const ENEMY_CLASSES = {
  stalker: StalkerEnemy,
  manta: MantaEnemy,
  sentinel: SentinelEnemy,
  lancer: LancerEnemy,
  spitter: SpitterEnemy,
  artillery: ArtilleryEnemy,
  warden: WardenEnemy,
  vortex: VortexEnemy,
  harbinger: HarbingerElite,
  behemoth: BehemothElite,
  core: EclipseCoreBoss,
};

export function createEnemyModel(kind, opts = {}) {
  const EnemyClass = ENEMY_CLASSES[kind];
  if (!EnemyClass) {
    throw new Error(`Unknown enemy kind: ${kind}`);
  }
  return new EnemyClass(opts);
}
