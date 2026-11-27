// Stages: farmyard, barn, kitchen — and the forest past the finish.
// Each stage scrolls faster, drains the farmer gap faster, and
// changes what spawns. The stage name is what the HUD shows.

import { FIELD, stageFor } from './config.js';

export function stageIndexFor(distance) {
  if (distance >= 2000) return 2;
  if (distance >= 1000) return 1;
  return 0;
}

export function stageNameFor(distance) {
  return stageFor(distance).name;
}

export const STAGE_SPEED = [250, 285, 325];
export const STAGE_GAP_DRAIN = [0.32, 0.4, 0.44];
export const STAGE_SPAWN_INTERVAL = [1.05, 0.9, 0.75];

/** Spawn weights per stage: [kind, weight]. */
export function spawnWeights(stageIndex) {
  if (stageIndex === 0) {
    return [['oven', 3], ['knifeFall', 2.5], ['corn', 2.5], ['hay', 1], ['feather', 1]];
  }
  if (stageIndex === 1) {
    return [['oven', 2.5], ['knifeFall', 2], ['knifeSwing', 1.5], ['corn', 2], ['hay', 1], ['feather', 1]];
  }
  return [['oven', 3], ['knifeSwing', 3], ['knifeFall', 1.5], ['corn', 1.5], ['hay', 0.5], ['feather', 0.5]];
}

export function groundLine() {
  return FIELD.groundY;
}
