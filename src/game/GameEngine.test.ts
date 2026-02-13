import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import { GHOST_BASE_SPEED } from './constants';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('starts in menu status', () => {
    expect(engine.state.status).toBe('menu');
  });

  it('transitions to playing on startGame', () => {
    engine.startGame();
    expect(engine.state.status).toBe('playing');
    expect(engine.state.lives).toBe(3);
    expect(engine.state.score).toBe(0);
  });

  it('does not update when not playing', () => {
    const initialPos = { ...engine.state.player.pos };
    engine.update(100);
    expect(engine.state.player.pos).toEqual(initialPos);
  });

  it('moves player on update when playing', () => {
    engine.startGame();
    const startX = engine.state.player.pos.x;
    engine.setDirection('left');
    // With speed=5 tiles/sec, 300ms = 1.5 tiles
    engine.update(300);
    expect(engine.state.player.pos.x).toBeLessThan(startX);
  });

  it('collects dots and increases score', () => {
    engine.startGame();
    // Place a dot right next to player
    const px = engine.state.player.pos.x;
    const py = engine.state.player.pos.y;
    engine.state.tilemap[py][px - 1] = 2;
    engine.state.dotsRemaining++;
    engine.setDirection('left');
    engine.update(300);
    expect(engine.state.score).toBeGreaterThan(0);
  });

  it('detects round clear when all dots collected', () => {
    engine.startGame();
    // Clear all dots manually
    for (let y = 0; y < engine.state.tilemap.length; y++) {
      for (let x = 0; x < engine.state.tilemap[y].length; x++) {
        if (engine.state.tilemap[y][x] === 2 || engine.state.tilemap[y][x] === 3) {
          engine.state.tilemap[y][x] = 0;
        }
      }
    }
    engine.state.dotsRemaining = 0;
    engine.update(100);
    expect(engine.state.status).toBe('roundClear');
  });

  it('returns readonly snapshot', () => {
    const snap = engine.getSnapshot();
    expect(snap.status).toBe('menu');
  });

  it('buffers direction for cornering', () => {
    engine.startGame();
    engine.setDirection('up');
    expect(engine.state.player.nextDirection).toBe('up');
  });

  it('decrements invincibility timer', () => {
    engine.startGame();
    engine.state.player.invincibleMs = 1000;
    engine.update(500);
    expect(engine.state.player.invincibleMs).toBe(500);
  });

  describe('round progression', () => {
    it('advances to next round preserving score and lives', () => {
      engine.startGame();
      engine.state.score = 500;
      engine.state.lives = 2;
      engine.state.dotsRemaining = 0;
      engine.update(100);
      expect(engine.state.status).toBe('roundClear');

      engine.nextRound();
      expect(engine.state.round).toBe(2);
      expect(engine.state.status).toBe('playing');
      expect(engine.state.score).toBe(500);
      expect(engine.state.lives).toBe(2);
    });

    it('increases ghost count on new round', () => {
      engine.startGame();
      const r1Ghosts = engine.state.ghosts.length;
      engine.nextRound();
      expect(engine.state.ghosts.length).toBeGreaterThanOrEqual(r1Ghosts);
    });

    it('increases ghost speed on new round', () => {
      engine.startGame();
      engine.nextRound(); // round 2
      expect(engine.state.ghosts[0].speed).toBeGreaterThan(GHOST_BASE_SPEED);
    });

    it('resets dots on new round', () => {
      engine.startGame();
      engine.state.dotsRemaining = 0;
      engine.update(100);
      engine.nextRound();
      expect(engine.state.dotsRemaining).toBeGreaterThan(50);
    });

    it('triggers game over when lives reach 0', () => {
      engine.startGame();
      engine.state.lives = 1;
      // Place ghost on player position
      engine.state.ghosts = [
        {
          id: 0,
          pos: { ...engine.state.player.pos },
          direction: 'up',
          behavior: 'chase',
          speed: 3,
          frozen: false,
        },
      ];
      engine.checkGhostCollisions();
      expect(engine.state.status).toBe('gameOver');
    });
  });
});
