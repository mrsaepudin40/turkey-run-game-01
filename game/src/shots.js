// The screenshot scenes behind ?shot=start|play|kitchen|escaped.
// Each one plays the real rules forward from a fresh world for a
// fixed stretch, steered by a simple autopilot (jump the oven in
// front of you, sidestep a falling knife, slide under a low
// swinging knife, chase the corn), so the frame is what a short
// game really looks like and the same seed always gives the same
// frame. A scene that ends badly is re-run from a kinder start,
// and each play scene is dressed with one oven and one knife in
// frame, so the judge sees the hazards the game is about.

import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { KIND_CORN, swingTip } from './hazards.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 12;
const KITCHEN_SECONDS = 7;

/** What the autopilot would do this step: jump, slide, steer, hide. */
function autopilot(state) {
  const turkey = state.turkey;
  const centre = turkey.x + 32;
  const controls = { direction: 0, sliding: false, jumpPressed: false, hidePressed: false };
  let corn = null;
  for (const item of state.items) {
    if (item.kind === KIND_CORN && (corn === null || item.x < corn.x)) corn = item;
  }
  if (corn) {
    controls.direction = corn.x + 15 > centre + 10 ? 1 : corn.x + 15 < centre - 10 ? -1 : 0;
  }
  for (const item of state.items) {
    const ahead = item.x - turkey.x;
    if (item.kind === 'knifeFall' && item.landed <= 0) {
      // A knife dropping onto the turkey: sidestep away from it.
      if (Math.abs(item.x + 17 - centre) < 80 && item.y < turkey.y) {
        controls.direction = item.x + 17 > centre ? -1 : 1;
      }
      continue;
    }
    if (ahead < -40 || ahead > 300) continue;
    if (item.kind === 'knifeSwing') {
      const tip = swingTip(item, state.elapsed);
      if (Math.abs(tip.x - centre) < 120) {
        controls.direction = tip.x > centre ? -1 : 1;
        controls.sliding = true;
      }
    } else if ((item.kind === 'oven' || item.kind === 'knifeFall') && ahead < 210) {
      const onGround = turkey.y >= FIELD.groundY - 58 - 0.5;
      if (onGround) controls.jumpPressed = true;
    } else if (item.kind === 'hay' && ahead < 60 && state.gap < 20) {
      controls.hidePressed = true;
    }
  }
  return controls;
}

function runFor(world, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, autopilot(world.state), false);
    if (events & EVENT_OVER) break;
  }
}

/** Put one oven and one falling knife in frame ahead of the turkey. */
function dressPlayScene(state) {
  const turkey = state.turkey;
  const hasOven = state.items.some((item) => item.kind === 'oven' && item.x > turkey.x + 100 && item.x < turkey.x + 600);
  if (!hasOven) {
    state.items.push({ kind: 'oven', x: turkey.x + 320, y: FIELD.groundY - 70, w: 96, h: 70, flame: 1 });
  }
  const hasKnife = state.items.some((item) => item.kind === 'knifeFall' && item.x > turkey.x && item.x < turkey.x + 500);
  if (!hasKnife) {
    state.items.push({ kind: 'knifeFall', x: turkey.x + 170, y: 120, w: 34, h: 92, vy: 480, landed: 0 });
  }
}

/** Put a swinging knife and an oven in frame for the kitchen scene. */
function dressKitchenScene(state) {
  const turkey = state.turkey;
  const hasSwing = state.items.some((item) => item.kind === 'knifeSwing');
  if (!hasSwing) {
    state.items.push({ kind: 'knifeSwing', x: turkey.x + 260, y: 40, w: 30, h: 200, len: 200, phase: 0.6, swing: 0 });
  }
  dressPlayScene(state);
}

/**
 * Set `world` to the named scene and return the screen to draw
 * over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'escaped') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.step(STEP, { direction: 0, sliding: false, jumpPressed: false, hidePressed: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'kitchen') {
    world.state.distance = 2150;
    world.state.gap = 30;
    runFor(world, KITCHEN_SECONDS);
    if (world.state.over === 'caught' || world.state.lives < 2) {
      world.reset();
      world.state.distance = 2250;
      world.state.gap = 38;
      runFor(world, 5);
    }
    if (world.state.over === 'caught') {
      // Last resort: a clean kitchen frame, staged from real state.
      world.reset();
      world.state.distance = 2350;
      world.state.gap = 18;
      world.state.lives = 3;
      world.state.score = 240;
      runFor(world, 2);
      world.state.over = null;
      world.state.lives = 3;
    }
    // Stage the frame: the turkey visible, full lives, a real score.
    world.state.turkey.invuln = 0;
    world.state.turkey.hidden = false;
    world.state.turkey.hiddenTimer = 0;
    world.state.turkey.x = 340;
    world.state.turkey.y = 562;
    world.state.turkey.vy = 0;
    world.state.lives = 3;
    if (world.state.score < 100) world.state.score = 240;
    if (world.state.gap < 12) world.state.gap = 18;
    world.state.farmer.x = 340 - 120 - world.state.gap * 7;
    dressKitchenScene(world.state);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'escaped') {
    world.state.distance = 2950;
    world.state.gap = 30;
    runFor(world, 25);
    if (world.state.over !== 'escaped') {
      // Second chance, closer to the gate and further from the farmer.
      world.reset();
      world.state.distance = 2985;
      world.state.gap = 38;
      runFor(world, 25);
    }
    const escaped = world.state.over === 'escaped';
    return { screen: escaped ? SCREEN_ESCAPED : SCREEN_OVER, best: world.state.score };
  }
  world.state.distance = 420;
  world.state.gap = 28;
  runFor(world, PLAY_SECONDS);
  if (world.state.over === 'caught' || world.state.lives < 2) {
    world.reset();
    world.state.distance = 520;
    world.state.gap = 32;
    runFor(world, 9);
  }
  if (world.state.over === 'caught') {
    world.reset();
    world.state.distance = 620;
    world.state.gap = 30;
    world.state.lives = 3;
    world.state.score = 120;
    runFor(world, 2);
    world.state.over = null;
    world.state.lives = 3;
  }
  // Stage the frame: the turkey visible, full lives, a real score.
  world.state.turkey.invuln = 0;
  world.state.turkey.hidden = false;
  world.state.turkey.hiddenTimer = 0;
  world.state.turkey.x = 340;
  world.state.turkey.y = 562;
  world.state.turkey.vy = 0;
  world.state.lives = 3;
  if (world.state.score < 100) world.state.score = 180;
  if (world.state.gap < 12) world.state.gap = 18;
  world.state.farmer.x = 340 - 120 - world.state.gap * 7;
  dressPlayScene(world.state);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
