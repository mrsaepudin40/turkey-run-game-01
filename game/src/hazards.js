// Hazards: ovens on the floor, carving knives falling from above
// and swinging from the ceiling. Spawning, motion and hit tests
// live here; what a hit costs lives in world.js.

import { FIELD } from './config.js';
import { spawnWeights } from './stages.js';

export const KIND_OVEN = 'oven';
export const KIND_KNIFE_FALL = 'knifeFall';
export const KIND_KNIFE_SWING = 'knifeSwing';
export const KIND_HAY = 'hay';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';

export function isDanger(kind) {
  return kind === KIND_OVEN || kind === KIND_KNIFE_FALL || kind === KIND_KNIFE_SWING;
}

export function isPickup(kind) {
  return kind === KIND_CORN || kind === KIND_FEATHER || kind === KIND_HAY;
}

function weightedKind(random, stageIndex) {
  const table = spawnWeights(stageIndex);
  let total = 0;
  for (const entry of table) total += entry[1];
  let roll = random() * total;
  for (const entry of table) {
    roll -= entry[1];
    if (roll <= 0) return entry[0];
  }
  return table[0][0];
}

/** Spawn one thing just off the right edge, by stage weights. */
export function spawnHazard(items, random, stageIndex) {
  const kind = weightedKind(random, stageIndex);
  const x = 1300;
  if (kind === KIND_OVEN) {
    items.push({ kind, x, y: FIELD.groundY - 70, w: 96, h: 70, flame: random() * 6 });
  } else if (kind === KIND_KNIFE_FALL) {
    items.push({ kind, x: random.range(560, 1240), y: -90, w: 34, h: 92, vy: 430 + stageIndex * 70, landed: 0 });
  } else if (kind === KIND_KNIFE_SWING) {
    items.push({ kind, x: random.range(700, 1240), y: 40, w: 30, h: 200, len: 200, phase: random() * 6.28, swing: 0 });
  } else if (kind === KIND_HAY) {
    items.push({ kind, x, y: FIELD.groundY - 64, w: 112, h: 64 });
  } else if (kind === KIND_CORN) {
    items.push({ kind, x, y: FIELD.groundY - 118, w: 30, h: 30, bob: random() * 6.28 });
  } else {
    items.push({ kind, x, y: FIELD.groundY - 168, w: 36, h: 26, bob: random() * 6.28 });
  }
}

/** Tip of a swinging knife, for the hit test. */
export function swingTip(item, elapsed) {
  const angle = Math.sin(elapsed * 2.3 + item.phase) * 0.75;
  return {
    x: item.x + Math.sin(angle) * item.len,
    y: item.y + Math.cos(angle) * item.len,
    angle,
  };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Does this hazard touch the turkey right now? */
export function hazardHits(item, turkey, turkeyH, elapsed) {
  const box = { x: turkey.x, y: turkey.y, w: 64, h: turkeyH };
  if (item.kind === KIND_KNIFE_SWING) {
    const tip = swingTip(item, elapsed);
    const cx = turkey.x + 32;
    const cy = turkey.y + turkeyH / 2;
    const dx = tip.x - cx;
    const dy = tip.y - cy;
    return dx * dx + dy * dy < 48 * 48;
  }
  if (item.kind === KIND_KNIFE_FALL && item.landed <= 0) {
    // Still falling: only the blade's lower half can touch.
    const blade = { x: item.x, y: item.y + item.h * 0.5, w: item.w, h: item.h * 0.5 };
    return boxesOverlap(blade, box);
  }
  return boxesOverlap(item, box);
}

/** Move every item with the scroll; falling knives drop, swinging
 *  knives keep their pivot. Returns items that just scrolled off. */
export function updateHazards(items, dt, speed, elapsed) {
  const gone = [];
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    item.x -= speed * dt;
    if (item.kind === KIND_KNIFE_FALL && item.landed <= 0) {
      item.y += item.vy * dt;
      if (item.y >= FIELD.groundY - item.h) {
        item.y = FIELD.groundY - item.h;
        item.landed = 1.5;
      }
    } else if (item.kind === KIND_KNIFE_FALL) {
      item.landed -= dt;
      if (item.landed <= 0) {
        items.splice(i, 1);
        gone.push(item);
        continue;
      }
    }
    if (item.kind === KIND_CORN || item.kind === KIND_FEATHER) {
      item.bob += dt * 3;
    }
    if (item.x + item.w < -40) {
      gone.push(item);
      items.splice(i, 1);
    }
  }
  return gone;
}
