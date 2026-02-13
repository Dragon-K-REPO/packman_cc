export const TILE_SIZE = 32;
export const MAP_COLS = 21;
export const MAP_ROWS = 21;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 672
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 672

export const PLAYER_BASE_SPEED = 5; // tiles per second
export const GHOST_BASE_SPEED = 3; // tiles per second
export const GHOST_SPEED_SCALE = 0.15; // per round multiplier increase

export const INITIAL_LIVES = 3;
export const INVINCIBLE_DURATION = 2000; // ms
export const DOT_SCORE = 10;
export const POWER_DOT_SCORE = 50;

// Item durations (ms)
export const NEON_FREEZE_DURATION = 4000;
export const PHASE_DASH_DURATION = 1200;
export const PHASE_DASH_COOLDOWN = 10000;
export const COMBO_BEACON_DURATION = 6000;
export const COMBO_MAX_MULTIPLIER = 3;

// Item spawn
export const ITEM_SPAWN_INTERVAL = 5000; // ms between spawn attempts
export const ITEM_SPAWN_BASE_CHANCE = 0.3;

export const COLOR = {
  CYAN: '#00ffff',
  MAGENTA: '#ff00ff',
  LIME: '#00ff00',
  BG: '#0a0a0a',
  WALL: '#1a0a2e',
  WALL_BORDER: '#00ffff',
  DOT: '#00ffff',
  POWER_DOT: '#ff00ff',
  PLAYER: '#00ff00',
  GHOST: ['#ff00ff', '#ff6600', '#ff0066', '#ffff00'],
} as const;
