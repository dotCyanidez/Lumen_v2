import { StarlightBoltAbility } from './StarlightBoltAbility.js';
import { OrbitingBladesAbility } from './OrbitingBladesAbility.js';
import { VoltaicArcAbility } from './VoltaicArcAbility.js';
import { AstralPulseAbility } from './AstralPulseAbility.js';
import { SeekerBarrageAbility } from './SeekerBarrageAbility.js';
import { StarbloomSporesAbility } from './StarbloomSporesAbility.js';
import { CelestialSpearAbility } from './CelestialSpearAbility.js';
import { EchoConduitPassive } from './EchoConduitPassive.js';

/**
 * Open/Closed Ability Registry mapping `abilityId` strings to pure OOP Ability classes.
 */
export const ABILITY_CLASSES = {
  resonant_volley: StarlightBoltAbility,
  solar_orbitals: OrbitingBladesAbility,
  voltaic_chain: VoltaicArcAbility,
  astral_pulse: AstralPulseAbility,
  seeker_barrage: SeekerBarrageAbility,
  starbloom_spores: StarbloomSporesAbility,
  celestial_spear: CelestialSpearAbility,
  echo_conduit: EchoConduitPassive,
};

export function createAbilityInstances() {
  const instances = {};
  for (const [id, AbilityClass] of Object.entries(ABILITY_CLASSES)) {
    instances[id] = new AbilityClass();
  }
  return instances;
}
