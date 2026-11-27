// Sound for Pardon Run, generated with WebAudio — no audio files.
// The context is created on the first player gesture, so browsers
// never autoplay anything before the player has touched the game.

export function createAudio() {
  let context = null;

  function ensure() {
    if (context === null) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        context = new Ctor();
      } catch {
        context = false;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context || null;
  }

  function tone(freq, seconds, type, volume, delay) {
    const ctx = ensure();
    if (!ctx) return;
    const when = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + seconds + 0.02);
  }

  return {
    /** Touch once on any gesture so later sounds are allowed. */
    unlock() {
      ensure();
    },
    gobble() {
      tone(520, 0.09, 'square', 0.08, 0);
      tone(380, 0.09, 'square', 0.08, 0.1);
      tone(300, 0.14, 'square', 0.08, 0.2);
    },
    pickup() {
      tone(660, 0.08, 'sine', 0.1, 0);
      tone(990, 0.12, 'sine', 0.1, 0.07);
    },
    hide() {
      tone(220, 0.18, 'triangle', 0.07, 0);
      tone(180, 0.22, 'triangle', 0.07, 0.12);
    },
    hit() {
      tone(160, 0.25, 'sawtooth', 0.14, 0);
      tone(90, 0.3, 'sawtooth', 0.14, 0.08);
    },
    fanfare() {
      tone(523, 0.16, 'triangle', 0.12, 0);
      tone(659, 0.16, 'triangle', 0.12, 0.16);
      tone(784, 0.3, 'triangle', 0.12, 0.32);
    },
  };
}
