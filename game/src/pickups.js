// Pickups: corn scores and pushes the farmer back, a feather
// blocks one hit, a haystack hides the turkey. What each one is
// worth lives here, so the numbers are easy to tune in one place.

export const CORN_POINTS = 10;
export const CORN_GAP = 1.5;
export const HIDE_POINTS = 25;
export const HIDE_GAP = 8;
export const HIDE_SECONDS = 2.2;
export const NEAR_MISS_POINTS = 5;
export const NEAR_MISS_GAP = 0.4;
export const WIN_BONUS = 500;

/** Apply a corn or feather pickup to the state. Returns a label. */
export function applyPickup(state, kind) {
  if (kind === 'corn') {
    state.score += CORN_POINTS;
    state.gap = Math.min(40, state.gap + CORN_GAP);
    state.burstTimer = 1.2;
    return 'corn';
  }
  if (kind === 'feather') {
    state.turkey.shield = true;
    state.score += 5;
    return 'feather';
  }
  return null;
}
