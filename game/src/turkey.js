// The turkey: run, jump, double jump, slide. Pure physics — no
// drawing and no rules about the farmer or the hazards in here.

import { FIELD, GRAVITY, TURKEY } from './config.js';

export function createTurkey() {
  return {
    x: 320,
    y: FIELD.groundY - TURKEY.height,
    vy: 0,
    jumps: 0,
    sliding: false,
    hidden: false,
    hiddenTimer: 0,
    shield: false,
    invuln: 0,
    runPhase: 0,
  };
}

export function resetTurkey(turkey) {
  turkey.x = 320;
  turkey.y = FIELD.groundY - TURKEY.height;
  turkey.vy = 0;
  turkey.jumps = 0;
  turkey.sliding = false;
  turkey.hidden = false;
  turkey.hiddenTimer = 0;
  turkey.shield = false;
  turkey.invuln = 0;
  turkey.runPhase = 0;
}

export function turkeyHeight(turkey) {
  return turkey.sliding ? TURKEY.slideHeight : TURKEY.height;
}

export function turkeyTop(turkey) {
  return FIELD.groundY - turkeyHeight(turkey);
}

/** One step of turkey physics. `jumpPressed` is a single press, not a hold. */
export function updateTurkey(turkey, dt, direction, sliding, jumpPressed) {
  const onGround = turkey.y >= turkeyTop(turkey) - 0.5;
  turkey.sliding = sliding && onGround;
  turkey.x = Math.min(640, Math.max(110, turkey.x + direction * TURKEY.runSpeed * dt));
  if (jumpPressed && turkey.jumps < TURKEY.maxJumps) {
    turkey.vy = -TURKEY.jumpSpeed;
    turkey.jumps += 1;
    turkey.sliding = false;
  }
  turkey.vy += GRAVITY * dt;
  turkey.y += turkey.vy * dt;
  const top = turkeyTop(turkey);
  if (turkey.y >= top) {
    turkey.y = top;
    turkey.vy = 0;
    turkey.jumps = 0;
  }
  if (turkey.invuln > 0) turkey.invuln = Math.max(0, turkey.invuln - dt);
  if (turkey.hiddenTimer > 0) {
    turkey.hiddenTimer -= dt;
    if (turkey.hiddenTimer <= 0) turkey.hidden = false;
  }
  turkey.runPhase += dt * (onGround ? 11 : 4);
}
