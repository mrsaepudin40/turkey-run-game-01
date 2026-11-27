// The game's rules and state, with no drawing and no browser in
// it: the turkey, the farmer's gap, spawning, collisions, score,
// lives and stages. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react — and play sounds —
// without the world knowing about screens or speakers.

import { FIELD, LIVES, MAX_GAP, START_GAP, STEP, WIN_DISTANCE } from './config.js';
import { createTurkey, resetTurkey, turkeyHeight, updateTurkey } from './turkey.js';
import { createFarmer, updateFarmer } from './farmer.js';
import {
  KIND_CORN, KIND_FEATHER, KIND_HAY, KIND_KNIFE_FALL, KIND_KNIFE_SWING, KIND_OVEN,
  hazardHits, isDanger, spawnHazard, updateHazards,
} from './hazards.js';
import { applyPickup, HIDE_GAP, HIDE_POINTS, HIDE_SECONDS, NEAR_MISS_GAP, NEAR_MISS_POINTS, WIN_BONUS } from './pickups.js';
import { STAGE_GAP_DRAIN, STAGE_SPEED, STAGE_SPAWN_INTERVAL, stageIndexFor, stageNameFor } from './stages.js';

export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_HIDE = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;

export function createWorld(random) {
  const turkey = createTurkey();
  const farmer = createFarmer();
  const state = {
    turkey, farmer,
    items: [],
    score: 0,
    lives: LIVES,
    distance: 0,
    gap: START_GAP,
    elapsed: 0,
    spawnTimer: 1.0,
    burstTimer: 0,
    over: null,
    stageName: 'FARMYARD',
    nearHay: false,
  };

  function reset() {
    resetTurkey(turkey);
    farmer.x = 0;
    farmer.mood = 'chase';
    state.items.length = 0;
    state.score = 0;
    state.lives = LIVES;
    state.distance = 0;
    state.gap = START_GAP;
    state.elapsed = 0;
    state.spawnTimer = 1.0;
    state.burstTimer = 0;
    state.over = null;
    state.stageName = 'FARMYARD';
    state.nearHay = false;
  }

  function scrollSpeed() {
    const stageIndex = stageIndexFor(state.distance);
    let speed = STAGE_SPEED[stageIndex];
    if (state.burstTimer > 0) speed += 110;
    return speed;
  }

  /** Hide in a haystack the turkey is standing in. */
  function tryHide() {
    if (turkey.hidden || state.over) return false;
    for (const item of state.items) {
      if (item.kind !== KIND_HAY) continue;
      if (item.x < turkey.x + 64 && item.x + item.w > turkey.x) {
        turkey.hidden = true;
        turkey.hiddenTimer = HIDE_SECONDS;
        state.score += HIDE_POINTS;
        state.gap = Math.min(MAX_GAP, state.gap + HIDE_GAP);
        return true;
      }
    }
    return false;
  }

  /**
   * One fixed step. `controls` is { direction, sliding, jumpPressed,
   * hidePressed }. With `harmless` set (the title screen's backdrop)
   * things move but nothing touches the player and nothing scores.
   */
  function step(dt, controls, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    const stageIndex = stageIndexFor(state.distance);
    state.stageName = stageNameFor(state.distance);
    const speed = scrollSpeed();

    if (controls.hidePressed && !harmless && tryHide()) events |= EVENT_HIDE;
    updateTurkey(turkey, dt, controls.direction, controls.sliding, controls.jumpPressed);
    updateFarmer(farmer, turkey, state.gap, turkey.hidden);
    if (state.burstTimer > 0) state.burstTimer -= dt;

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnHazard(state.items, random, stageIndex);
      state.spawnTimer = STAGE_SPAWN_INTERVAL[stageIndex] * random.range(0.75, 1.25);
      if (stageIndex === 2 && random() < 0.35) spawnHazard(state.items, random, stageIndex);
    }

    const gone = updateHazards(state.items, dt, speed, state.elapsed);
    if (!harmless) {
      for (const item of gone) {
        if (item.kind === KIND_OVEN || item.kind === KIND_KNIFE_FALL || item.kind === KIND_KNIFE_SWING) {
          state.score += NEAR_MISS_POINTS;
          state.gap = Math.min(MAX_GAP, state.gap + NEAR_MISS_GAP);
        }
      }
    }

    if (!harmless) {
      state.distance += (speed * dt) / 9;
      state.gap -= STAGE_GAP_DRAIN[stageIndex] * dt;
    }

    state.nearHay = false;
    if (!harmless && !turkey.hidden) {
      const height = turkeyHeight(turkey);
      for (let i = state.items.length - 1; i >= 0; i -= 1) {
        const item = state.items[i];
        if (item.kind === KIND_HAY) {
          if (item.x < turkey.x + 64 && item.x + item.w > turkey.x) state.nearHay = true;
          continue;
        }
        if (item.kind === KIND_CORN || item.kind === KIND_FEATHER) {
          const box = { x: turkey.x, y: turkey.y, w: 64, h: height };
          const pick = { x: item.x - 6, y: item.y - 6, w: item.w + 12, h: item.h + 12 };
          if (box.x < pick.x + pick.w && box.x + box.w > pick.x && box.y < pick.y + pick.h && box.y + box.h > pick.y) {
            applyPickup(state, item.kind);
            events |= EVENT_PICKUP;
            state.items.splice(i, 1);
          }
          continue;
        }
        if (isDanger(item.kind) && turkey.invuln <= 0 && hazardHits(item, turkey, height, state.elapsed)) {
          if (turkey.shield) {
            turkey.shield = false;
            turkey.invuln = 1.6;
            state.items.splice(i, 1);
          } else {
            state.lives -= 1;
            state.gap -= 5;
            turkey.invuln = 1.6;
            events |= EVENT_HIT;
            state.items.splice(i, 1);
            if (state.lives <= 0) {
              state.over = 'caught';
              events |= EVENT_OVER;
            }
          }
        }
      }
    }

    if (!harmless && !state.over) {
      if (state.distance >= WIN_DISTANCE) {
        state.distance = WIN_DISTANCE;
        state.score += WIN_BONUS;
        state.stageName = 'FOREST FREEDOM';
        state.items.length = 0;
        state.over = 'escaped';
        events |= EVENT_WIN | EVENT_OVER;
      } else if (state.gap <= 0) {
        state.gap = 0;
        state.over = 'caught';
        events |= EVENT_OVER;
      }
    }
    return events;
  }

  return { state, reset, step, tryHide, scrollSpeed };
}
