import { GhostState, Position, Direction, TileType, GhostBehavior } from './types';
import { GHOST_BASE_SPEED, MAP_COLS } from './constants';
import { isWalkable, findGhostHousePositions } from './tilemap';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function createGhosts(
  tilemap: TileType[][],
  count: number,
  speedMultiplier: number,
): GhostState[] {
  const positions = findGhostHousePositions(tilemap);
  return Array.from({ length: Math.min(count, positions.length) }, (_, i) => ({
    id: i,
    pos: { ...positions[i] },
    direction: 'up' as Direction,
    behavior: (i === 0 ? 'chase' : 'patrol') as GhostBehavior,
    speed: GHOST_BASE_SPEED * speedMultiplier,
    frozen: false,
  }));
}

export function moveGhost(ghost: GhostState, playerPos: Position, tilemap: TileType[][]): void {
  if (ghost.behavior === 'chase') {
    moveChase(ghost, playerPos, tilemap);
  } else {
    movePatrol(ghost, tilemap);
  }

  // Tunnel wrap
  if (ghost.pos.x < 0) ghost.pos.x = MAP_COLS - 1;
  if (ghost.pos.x >= MAP_COLS) ghost.pos.x = 0;
}

function moveChase(ghost: GhostState, target: Position, tilemap: TileType[][]) {
  const candidates = getValidDirections(ghost, tilemap);

  if (candidates.length === 0) {
    reverseIfPossible(ghost, tilemap);
    return;
  }

  // Pick direction that minimizes Manhattan distance to target
  candidates.sort((a, b) => {
    const posA = applyDir(ghost.pos, a);
    const posB = applyDir(ghost.pos, b);
    return distance(posA, target) - distance(posB, target);
  });

  ghost.direction = candidates[0];
  ghost.pos = applyDir(ghost.pos, ghost.direction);
}

function movePatrol(ghost: GhostState, tilemap: TileType[][]) {
  // Try to keep going straight; if blocked, pick a random valid direction
  const forward = applyDir(ghost.pos, ghost.direction);
  if (isValidGhostTile(forward, tilemap)) {
    ghost.pos = forward;
    return;
  }

  const candidates = getValidDirections(ghost, tilemap);
  if (candidates.length > 0) {
    ghost.direction = candidates[Math.floor(Math.random() * candidates.length)];
    ghost.pos = applyDir(ghost.pos, ghost.direction);
  } else {
    reverseIfPossible(ghost, tilemap);
  }
}

function getValidDirections(ghost: GhostState, tilemap: TileType[][]): Direction[] {
  return DIRECTIONS.filter((d) => {
    if (d === OPPOSITE[ghost.direction]) return false; // no 180
    const next = applyDir(ghost.pos, d);
    return isValidGhostTile(next, tilemap);
  });
}

function isValidGhostTile(pos: Position, tilemap: TileType[][]): boolean {
  if (!isWalkable(tilemap, pos.x, pos.y)) return false;
  // Don't re-enter ghost house
  if (pos.y >= 0 && pos.y < tilemap.length && pos.x >= 0 && pos.x < tilemap[0].length) {
    if (tilemap[pos.y][pos.x] === 4) return false;
  }
  return true;
}

function reverseIfPossible(ghost: GhostState, tilemap: TileType[][]) {
  const rev = applyDir(ghost.pos, OPPOSITE[ghost.direction]);
  if (isWalkable(tilemap, rev.x, rev.y)) {
    ghost.direction = OPPOSITE[ghost.direction];
    ghost.pos = rev;
  }
}

function applyDir(pos: Position, dir: Direction): Position {
  switch (dir) {
    case 'up':
      return { x: pos.x, y: pos.y - 1 };
    case 'down':
      return { x: pos.x, y: pos.y + 1 };
    case 'left':
      return { x: pos.x - 1, y: pos.y };
    case 'right':
      return { x: pos.x + 1, y: pos.y };
  }
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
