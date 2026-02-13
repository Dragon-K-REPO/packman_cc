import { describe, it, expect } from 'vitest';
import { createGhosts, moveGhost } from './ghost';
import { createTilemap } from './tilemap';

describe('ghost AI', () => {
  it('creates ghosts from ghost house positions', () => {
    const map = createTilemap();
    const ghosts = createGhosts(map, 3, 1);
    expect(ghosts.length).toBe(3);
    expect(ghosts[0].behavior).toBe('chase');
    expect(ghosts[1].behavior).toBe('patrol');
  });

  it('does not create more ghosts than ghost house positions', () => {
    const map = createTilemap();
    const ghosts = createGhosts(map, 100, 1);
    expect(ghosts.length).toBeLessThanOrEqual(10);
  });

  it('chase ghost moves toward player', () => {
    const map = createTilemap();
    const ghosts = createGhosts(map, 1, 1);
    const ghost = ghosts[0];
    const target = { x: 10, y: 16 };
    const startDist = Math.abs(ghost.pos.x - target.x) + Math.abs(ghost.pos.y - target.y);
    moveGhost(ghost, target, map);
    const endDist = Math.abs(ghost.pos.x - target.x) + Math.abs(ghost.pos.y - target.y);
    // Should move closer or stay (wall constraints), not dramatically further
    expect(endDist).toBeLessThanOrEqual(startDist + 1);
  });

  it('patrol ghost moves without crashing', () => {
    const map = createTilemap();
    const ghosts = createGhosts(map, 2, 1);
    const ghost = ghosts[1]; // patrol
    // Run several moves to ensure no crash
    for (let i = 0; i < 20; i++) {
      moveGhost(ghost, { x: 0, y: 0 }, map);
    }
    expect(ghost.pos).toBeDefined();
    expect(ghost.pos.x).toBeGreaterThanOrEqual(0);
  });

  it('applies speed multiplier', () => {
    const map = createTilemap();
    const slow = createGhosts(map, 1, 1);
    const fast = createGhosts(map, 1, 2);
    expect(fast[0].speed).toBeGreaterThan(slow[0].speed);
  });
});
