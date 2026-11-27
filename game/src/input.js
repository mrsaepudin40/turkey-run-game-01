// Keyboard and pointer input for Pardon Run. Held keys steer the
// turkey; one-shot presses (confirm, pause, hide) are queued as bit
// flags and taken once by the loop, so a press between two frames is
// never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HIDE = 4;

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const JUMP_KEYS = new Set(['ArrowUp', 'KeyW', 'Space']);
const SLIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const HIDE_KEYS = new Set(['KeyH']);

export function createInput(target) {
  const held = new Set();
  let queued = 0;

  window.addEventListener('keydown', (event) => {
    if (LEFT_KEYS.has(event.code) || RIGHT_KEYS.has(event.code)) held.add(event.code);
    else if (SLIDE_KEYS.has(event.code)) held.add(event.code);
    else if (JUMP_KEYS.has(event.code)) {
      held.add(event.code);
      if (!event.repeat) queued |= ACTION_CONFIRM;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) queued |= ACTION_PAUSE;
    } else if (HIDE_KEYS.has(event.code)) {
      if (!event.repeat) queued |= ACTION_HIDE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go
  // of everything on blur.
  window.addEventListener('blur', () => held.clear());
  target.addEventListener('pointerdown', () => {
    queued |= ACTION_CONFIRM;
  });

  function hasAny(keys) {
    for (const key of keys) if (held.has(key)) return true;
    return false;
  }

  return {
    /** -1 for left, 1 for right, 0 for neither or both. */
    direction() {
      return (hasAny(RIGHT_KEYS) ? 1 : 0) - (hasAny(LEFT_KEYS) ? 1 : 0);
    },
    sliding() {
      return hasAny(SLIDE_KEYS);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = queued;
      queued = 0;
      return taken;
    },
  };
}
