// The farmer: he chases from behind, and he searches when the
// turkey hides. His screen position is the pressure the player
// feels — the gap in metres decides it, never a scripted path.

import { MAX_GAP } from './config.js';

export function createFarmer() {
  return { x: 0, mood: 'chase', searchTimer: 0 };
}

export function updateFarmer(farmer, turkey, gap, hidden) {
  // Gap 0 puts him right on the turkey's tail; gap MAX_GAP pushes
  // him off the left edge of the screen.
  farmer.x = turkey.x - 120 - gap * 7;
  if (hidden) {
    farmer.mood = 'search';
    farmer.searchTimer += 1 / 60;
  } else {
    farmer.mood = 'chase';
    farmer.searchTimer = 0;
  }
}
