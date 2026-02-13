import { describe, it, expect } from 'vitest';
import {
  createTilemap,
  findPlayerSpawn,
  countDots,
  isWalkable,
  findGhostHousePositions,
} from './tilemap';

describe('tilemap', () => {
  it('creates a 21x21 map', () => {
    const map = createTilemap();
    expect(map.length).toBe(21);
    expect(map[0].length).toBe(21);
  });

  it('returns a fresh copy each call', () => {
    const a = createTilemap();
    const b = createTilemap();
    a[1][1] = 0;
    expect(b[1][1]).toBe(2);
  });

  it('finds player spawn position', () => {
    const map = createTilemap();
    const spawn = findPlayerSpawn(map);
    expect(map[spawn.y][spawn.x]).toBe(5);
  });

  it('counts dots correctly', () => {
    const map = createTilemap();
    const dots = countDots(map);
    expect(dots).toBeGreaterThan(50);
  });

  it('identifies walls as not walkable', () => {
    const map = createTilemap();
    expect(isWalkable(map, 0, 0)).toBe(false);
  });

  it('identifies paths as walkable', () => {
    const map = createTilemap();
    const spawn = findPlayerSpawn(map);
    expect(isWalkable(map, spawn.x, spawn.y)).toBe(true);
  });

  it('allows tunnel wrapping at row 10', () => {
    const map = createTilemap();
    expect(isWalkable(map, -1, 10)).toBe(true);
    expect(isWalkable(map, 21, 10)).toBe(true);
  });

  it('rejects tunnel at non-tunnel rows', () => {
    const map = createTilemap();
    expect(isWalkable(map, -1, 5)).toBe(false);
  });

  it('finds ghost house positions', () => {
    const map = createTilemap();
    const ghosts = findGhostHousePositions(map);
    expect(ghosts.length).toBeGreaterThanOrEqual(3);
  });
});
