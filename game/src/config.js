// Pardon Run tuning: every number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales
// it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** Fixed simulation step: 60 updates a second, whatever the display rate. */
export const STEP = 1 / 60;

export const GRAVITY = 2600;

export const TURKEY = {
  width: 64,
  height: 58,
  slideHeight: 30,
  runSpeed: 430,
  jumpSpeed: 980,
  maxJumps: 2,
};

export const LIVES = 3;

/** Farmer gap in metres: how far behind the turkey the farmer is. */
export const START_GAP = 26;
export const MAX_GAP = 40;

/** Reaching this distance means the turkey is free. */
export const WIN_DISTANCE = 3000;

export const STAGES = [
  { name: 'FARMYARD', from: 0, skyTop: '#f2a65e', skyLow: '#e07a3f', ground: '#8a5a2e', accent: '#d9a441' },
  { name: 'BARN', from: 1000, skyTop: '#c97e4a', skyLow: '#8a4f30', ground: '#6e4526', accent: '#c98a3d' },
  { name: 'KITCHEN', from: 2000, skyTop: '#5e3a2e', skyLow: '#3c241f', ground: '#4a2c22', accent: '#e07840' },
  { name: 'FOREST FREEDOM', from: 3000, skyTop: '#7fb069', skyLow: '#4a7c59', ground: '#3d6b35', accent: '#f2c94c' },
];

export function stageFor(distance) {
  let found = STAGES[0];
  for (const stage of STAGES) if (distance >= stage.from) found = stage;
  return found;
}

export const PALETTE = {
  backdrop: '#241610',
  sun: '#ffd166',
  turkeyBody: '#8a5230',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c'],
  turkeyHead: '#e8e0d0',
  wattle: '#e5534b',
  beak: '#f2a93b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#2e4a6b',
  farmerHat: '#d9b36c',
  farmerSkin: '#e8b98a',
  ovenBody: '#3a3a40',
  ovenFire: '#ff7b24',
  ovenGlow: '#ffb347',
  knifeBlade: '#d7dce3',
  knifeHandle: '#5b3a1e',
  hay: '#e8c15a',
  corn: '#f2c94c',
  feather: '#f5f0e6',
  panel: '#241a12',
  panelEdge: '#d9a441',
  text: '#fdf6e3',
  muted: '#d8c9a8',
  danger: '#ff5a4e',
  safe: '#7dd069',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'pardon-run.best';
