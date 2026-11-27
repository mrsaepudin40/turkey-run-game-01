// Drawing only: the world's state and the current screen in,
// pixels out. The 1280x720 playfield is scaled to fit the window
// and centred, the margin filled with the backdrop colour. Flat
// autumn shapes — a turkey, a farmer with a net, ovens, carving
// knives, haystacks, corn — plus canvas text for the HUD and panels.

import { FIELD, FONT, PALETTE, WIN_DISTANCE, stageFor } from './config.js';
import { KIND_CORN, KIND_FEATHER, KIND_HAY, KIND_KNIFE_FALL, KIND_KNIFE_SWING, KIND_OVEN, swingTip } from './hazards.js';
import { drawHud } from './hud.js';
import { turkeyHeight } from './turkey.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

const PANEL = { width: 780, top: 120, line: 34, bottom: 76 };

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    ctx.font = fonts.get(size);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y);
  }

  function drawSun(stage) {
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(1120, 110, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.beginPath();
    ctx.arc(1120, 110, 70, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackdrop(state) {
    const stage = stageFor(state.distance);
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, stage.skyTop);
    grad.addColorStop(1, stage.skyLow);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    drawSun(stage);
    // Distant silhouettes, per stage.
    ctx.fillStyle = 'rgba(60, 30, 18, 0.35)';
    if (state.distance < 1000) {
      // Farmyard fence and barn.
      ctx.fillRect(0, 470, FIELD.width, 10);
      for (let x = 40; x < FIELD.width; x += 90) ctx.fillRect(x, 440, 10, 60);
      ctx.fillRect(880, 380, 260, 120);
      ctx.beginPath();
      ctx.moveTo(860, 380);
      ctx.lineTo(1010, 310);
      ctx.lineTo(1160, 380);
      ctx.closePath();
      ctx.fill();
    } else if (state.distance < 2000) {
      // Barn beams.
      for (let x = 0; x < FIELD.width; x += 160) ctx.fillRect(x, 0, 26, FIELD.groundY);
      ctx.fillRect(0, 180, FIELD.width, 18);
    } else if (state.distance < 3000) {
      // Kitchen wall tiles and a window.
      ctx.fillStyle = 'rgba(255, 240, 210, 0.16)';
      for (let y = 60; y < 480; y += 60) ctx.fillRect(0, y, FIELD.width, 4);
      ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
      ctx.fillRect(80, 90, 190, 150);
      ctx.fillStyle = 'rgba(60, 30, 18, 0.4)';
      ctx.fillRect(170, 90, 10, 150);
      ctx.fillRect(80, 160, 190, 10);
    } else {
      // Forest: pine silhouettes.
      for (let x = 20; x < FIELD.width; x += 110) {
        ctx.beginPath();
        ctx.moveTo(x, 500);
        ctx.lineTo(x + 40, 340);
        ctx.lineTo(x + 80, 500);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
  }

  function drawOven(item, elapsed) {
    const flicker = Math.sin(elapsed * 9 + item.flame) * 4;
    ctx.fillStyle = 'rgba(255, 150, 40, 0.35)';
    ctx.beginPath();
    ctx.arc(item.x + item.w / 2, item.y + 10, 70 + flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenBody;
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = PALETTE.ovenFire;
    ctx.fillRect(item.x + 16, item.y + 14, item.w - 32, 26);
    ctx.fillStyle = PALETTE.ovenGlow;
    ctx.beginPath();
    ctx.moveTo(item.x + 28, item.y + 36);
    ctx.quadraticCurveTo(item.x + 48, item.y - 6 + flicker, item.x + 68, item.y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d7dce3';
    ctx.fillRect(item.x + 10, item.y + 52, item.w - 20, 6);
  }

  function drawKnifeFall(item) {
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(item.x + item.w * 0.38, item.y, item.w * 0.24, item.h * 0.3);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + item.h * 0.3);
    ctx.lineTo(item.x + item.w, item.y + item.h * 0.3);
    ctx.lineTo(item.x + item.w / 2, item.y + item.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawKnifeSwing(item, elapsed) {
    const tip = swingTip(item, elapsed);
    ctx.strokeStyle = '#8a7a5a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(tip.angle + Math.PI / 2);
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(-7, -34, 14, 22);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-13, -12);
    ctx.lineTo(13, -12);
    ctx.lineTo(0, 44);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHay(item) {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.arc(item.x + item.w / 2, item.y + item.h, item.w / 2, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#b98f2e';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(item.x + item.w / 2, item.y + item.h, item.w / 2 - 12, Math.PI + i * 0.28, Math.PI + i * 0.28 + 0.2);
      ctx.stroke();
    }
  }

  function drawCorn(item, elapsed) {
    const bob = Math.sin(item.bob) * 4;
    ctx.fillStyle = '#3d6b35';
    ctx.beginPath();
    ctx.moveTo(item.x + 4, item.y + item.h + bob);
    ctx.lineTo(item.x + 14, item.y + item.h - 14 + bob);
    ctx.lineTo(item.x + 26, item.y + item.h + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(item.x + 15, item.y + 14 + bob, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x + 8, item.y + 8 + bob);
    ctx.lineTo(item.x + 22, item.y + 8 + bob);
    ctx.moveTo(item.x + 8, item.y + 18 + bob);
    ctx.lineTo(item.x + 22, item.y + 18 + bob);
    ctx.stroke();
  }

  function drawFeather(item, elapsed) {
    const bob = Math.sin(item.bob) * 4;
    ctx.fillStyle = PALETTE.feather;
    ctx.beginPath();
    ctx.ellipse(item.x + 18, item.y + 12 + bob, 16, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9b2a2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x + 4, item.y + 20 + bob);
    ctx.lineTo(item.x + 32, item.y + 4 + bob);
    ctx.stroke();
  }

  function drawFarmer(farmer, state) {
    const x = farmer.x;
    const base = FIELD.groundY;
    if (x < -90 || x > FIELD.width + 40) return;
    const legSwing = Math.sin(state.elapsed * 11) * 10;
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(x + 18 + legSwing * 0.4, base - 52, 12, 52);
    ctx.fillRect(x + 38 - legSwing * 0.4, base - 52, 12, 52);
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(x + 12, base - 96, 46, 48);
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.fillRect(x + 20, base - 122, 30, 28);
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.fillRect(x + 12, base - 130, 46, 10);
    ctx.fillRect(x + 18, base - 146, 34, 18);
    // The net, held out toward the turkey.
    ctx.strokeStyle = '#c9b18a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 56, base - 84);
    ctx.lineTo(x + 92, base - 108);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220, 200, 160, 0.8)';
    ctx.beginPath();
    ctx.arc(x + 100, base - 112, 18, 0, Math.PI * 2);
    ctx.stroke();
    if (farmer.mood === 'search') {
      text('?', x + 34, base - 168, 30, PALETTE.text, 'center');
    }
  }

  function drawTurkey(turkey, state) {
    if (turkey.hidden) return;
    const height = turkeyHeight(turkey);
    const cx = turkey.x + 32;
    const base = turkey.y + height;
    const blink = turkey.invuln > 0 && Math.floor(turkey.invuln * 10) % 2 === 0;
    if (blink) return;
    const squash = turkey.sliding ? 0.55 : 1;
    // Tail fan.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = PALETTE.turkeyTail[i];
      ctx.beginPath();
      ctx.arc(cx - 14, base - 12 * squash, 34 - i * 7, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(cx + 6, base - 16 * squash, 30, 24 * squash, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#6e3f22';
    ctx.beginPath();
    ctx.ellipse(cx, base - 16 * squash, 16, 12 * squash, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Legs, running.
    const swing = Math.sin(turkey.runPhase) * 8;
    ctx.strokeStyle = '#f2a93b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 2, base - 4);
    ctx.lineTo(cx - 2 + swing, FIELD.groundY + 2);
    ctx.moveTo(cx + 12, base - 4);
    ctx.lineTo(cx + 12 - swing, FIELD.groundY + 2);
    ctx.stroke();
    // Head, beak, wattle.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(cx + 26, base - 44 * squash, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(cx + 36, base - 46 * squash);
    ctx.lineTo(cx + 50, base - 41 * squash);
    ctx.lineTo(cx + 36, base - 37 * squash);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ctx.fillRect(cx + 34, base - 34 * squash, 6, 11);
    ctx.fillStyle = '#241610';
    ctx.beginPath();
    ctx.arc(cx + 30, base - 48 * squash, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (turkey.shield) {
      ctx.strokeStyle = 'rgba(245, 240, 230, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + 6, base - 22, 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawField(state) {
    drawBackdrop(state);
    for (const item of state.items) {
      if (item.kind === KIND_OVEN) drawOven(item, state.elapsed);
      else if (item.kind === KIND_KNIFE_FALL) drawKnifeFall(item);
      else if (item.kind === KIND_KNIFE_SWING) drawKnifeSwing(item, state.elapsed);
      else if (item.kind === KIND_HAY) drawHay(item);
      else if (item.kind === KIND_CORN) drawCorn(item, state.elapsed);
      else if (item.kind === KIND_FEATHER) drawFeather(item, state.elapsed);
    }
    drawFarmer(state.farmer, state);
    drawTurkey(state.turkey, state);
    if (state.nearHay && !state.turkey.hidden) {
      text('Press H to HIDE in the haystack!', FIELD.width / 2, 84, 24, PALETTE.feather, 'center');
    }
  }

  function drawPanel(title, lines, prompt, titleColour) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    ctx.fillStyle = 'rgba(20, 12, 8, 0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(x, y, PANEL.width, height);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, PANEL.width, height);
    ctx.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, titleColour || PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 22, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 42, 24, PALETTE.corn, 'center');
  }

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('PARDON RUN', [
        'Thanksgiving dawn. The farmer is coming with his net.',
        'Run 3,000 m — farmyard, barn, kitchen — to the forest.',
        'Jump the ovens. Dodge the carving knives. Hide in the hay.',
        'Arrows / WASD to run, Space to jump twice,',
        'Down to slide, H to hide.',
        `Best score ${best}`,
      ], 'Press Space or click to start');
      return;
    }
    drawHud(ctx, state, text);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The farmer will wait for you. He is patient.'], 'Press P to keep running');
    } else if (screen === SCREEN_OVER) {
      drawPanel('CAUGHT FOR DINNER', [
        `Score ${state.score}   •   Best ${best}`,
        `The farmer caught you ${Math.floor(state.distance)} m from the farm.`,
      ], 'Press Space or click to run again', PALETTE.danger);
    } else if (screen === SCREEN_ESCAPED) {
      drawPanel('PARDONED!', [
        'You reached the forest — free, feathers and all.',
        `Final score ${state.score}   •   Best ${best}`,
        `3,000 m run, ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} to spare.`,
      ], 'Press Space or click to run again', PALETTE.safe);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
