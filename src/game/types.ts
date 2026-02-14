export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'menu' | 'playing' | 'paused' | 'roundClear' | 'gameOver';
export type TileType = 0 | 1 | 2 | 3 | 4 | 5;
// 0=path, 1=wall, 2=dot, 3=powerDot/itemSpawn, 4=ghostHouse, 5=playerSpawn

export type GhostBehavior = 'patrol' | 'chase';

export interface Position {
  x: number; // tile column
  y: number; // tile row
}

export interface PlayerState {
  pos: Position;
  direction: Direction;
  nextDirection: Direction | null;
  speed: number;
  invincibleMs: number;
  activeDash: boolean;
  dashCooldown: number;
  moveProgress: number;  // 0..1 sub-tile visual interpolation
}

export interface GhostState {
  id: number;
  pos: Position;
  direction: Direction;
  behavior: GhostBehavior;
  speed: number;
  frozen: boolean;
  moveProgress: number;  // 0..1 sub-tile visual interpolation
}

export interface ItemDrop {
  type: 'neon_freeze' | 'phase_dash' | 'combo_beacon';
  pos: Position;
}

export interface ActiveEffect {
  type: 'neon_freeze' | 'phase_dash' | 'combo_beacon';
  remainingMs: number;
}

export interface RoundConfig {
  round: number;
  ghostCount: number;
  ghostSpeed: number;
  itemSpawnChance: number;
}

export interface GameState {
  status: GameStatus;
  round: number;
  score: number;
  highScore: number;
  lives: number;
  player: PlayerState;
  ghosts: GhostState[];
  items: ItemDrop[];
  activeEffects: ActiveEffect[];
  dotsRemaining: number;
  comboMultiplier: number;
  tilemap: TileType[][];
}
