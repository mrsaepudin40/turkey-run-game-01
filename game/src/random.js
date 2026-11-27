// A tiny seeded generator (linear congruential): the same seed gives
// the same run, which is what makes the screenshot scenes repeatable.

export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  next.range = (low, high) => low + next() * (high - low);
  next.pick = (list) => list[Math.floor(next() * list.length)];
  return next;
}
