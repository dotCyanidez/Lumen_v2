import { Observable } from '../core/Observable.js';
import {
  ABILITY_TALENT_GROUPS,
  ABILITY_TALENTS_BY_ID,
  BLESSINGS,
} from '../core/Constants.js';
import { isStartAbilityUnlocked } from '../services/SynergyTalentService.js';

/**
 * MVVM ViewModel for The Sanctuary progression modal (Upgrades, Talents, Trails & Palettes, Spirits).
 */
export class SanctuaryViewModel {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.isOpen = new Observable(false);
    this.activeTab = new Observable('upgrades');
    this.luminance = new Observable(0);
    this.lifetimeLuminance = new Observable(0);
    this.selectedTalentAbility = new Observable(BLESSINGS[0]?.id || 'resonant_volley');
    this.selectedTalentId = new Observable(null);
  }

  open() {
    this.isOpen.value = true;
  }

  close() {
    this.isOpen.value = false;
  }

  setTab(tabName) {
    this.activeTab.value = tabName;
  }

  resetSelection() {
    this.selectedTalentAbility.value = BLESSINGS[0]?.id || 'resonant_volley';
    const firstNodes = ABILITY_TALENT_GROUPS.get(this.selectedTalentAbility.value) || [];
    const rootNode = firstNodes.find((n) => n.slot === 'root') || firstNodes[0];
    this.selectedTalentId.value = rootNode ? rootNode.id : null;
  }

  selectAbilityGroup(abilityId) {
    this.selectedTalentAbility.value = abilityId;
    const nodes = ABILITY_TALENT_GROUPS.get(abilityId) || [];
    const rootNode = nodes.find((n) => n.slot === 'root') || nodes[0];
    this.selectedTalentId.value = rootNode ? rootNode.id : null;
  }

  selectTalentNode(talentId) {
    this.selectedTalentId.value = talentId;
  }

  computeTalentNodeState(talentId, luminance = 0, talentRanks = {}) {
    const node = ABILITY_TALENTS_BY_ID[talentId];
    if (!node) return null;
    const level = Math.max(0, Number(talentRanks?.[node.id]) || 0);
    const maxLevel = node.maxLevel;
    const maxed = level >= maxLevel;
    const reqNode = node.requires ? ABILITY_TALENTS_BY_ID[node.requires] : null;
    const reqLevel = reqNode ? Math.max(0, Number(talentRanks?.[reqNode.id]) || 0) : 1;
    const reqMet = !reqNode || reqLevel >= reqNode.maxLevel;
    const nextCost = maxed ? 0 : node.costs[level];
    const canAfford = !maxed && reqMet && luminance >= nextCost;
    return {
      node,
      level,
      maxLevel,
      maxed,
      reqNode,
      reqMet,
      nextCost,
      canAfford,
    };
  }

  canSelectAsStartAbility(abilityId, talentRanks = {}) {
    return isStartAbilityUnlocked(abilityId, talentRanks);
  }
}
