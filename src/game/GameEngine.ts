import { GameState, Direction, TileType, Position } from './types';
import {
  PLAYER_BASE_SPEED,
  INITIAL_LIVES,
  DOT_SCORE,
  POWER_DOT_SCORE,
  INVINCIBLE_DURATION,
  GHOST_SPEED_SCALE,
  MAP_COLS,
} from './constants';
import { createTilemap, findPlayerSpawn, countDots, isWalkable } from './tilemap';
import { createGhosts, moveGhost } from './ghost';

export class GameEngine {
  state: GameState;
  private moveAccumulator = 0;
  /* package */ ghostMoveAccumulator = 0;
  /* package */ itemSpawnTimer = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const tilemap = createTilemap();
    const spawnPos = findPlayerSpawn(tilemap);
    tilemap[spawnPos.y][spawnPos.x] = 0; // clear spawn tile

    return {
      status: 'menu',
      round: 1,
      score: 0,
      highScore: this.loadHighScore(),
      lives: INITIAL_LIVES,
      player: {
        pos: { ...spawnPos },
        direction: 'left',
        nextDirection: null,
        speed: PLAYER_BASE_SPEED,
        invincibleMs: 0,
        activeDash: false,
        dashCooldown: 0,
      },
      ghosts: [],
      items: [],
      activeEffects: [],
      dotsRemaining: countDots(tilemap),
      comboMultiplier: 1,
      tilemap,
    };
  }

  startGame() {
    this.state = this.createInitialState();
    this.state.status = 'playing';
    this.state.ghosts = createGhosts(this.state.tilemap, 2, 1);
    this.moveAccumulator = 0;
    this.ghostMoveAccumulator = 0;
    this.itemSpawnTimer = 0;
  }

  update(dt: number) {
    if (this.state.status !== 'playing') return;

    this.updatePlayer(dt);
    this.collectDots();
    this.updateEffects(dt);
    this.updateGhosts(dt);
    this.checkGhostCollisions();
    this.checkRoundClear();
  }

  private updatePlayer(dt: number) {
    const { player, tilemap } = this.state;
    const seconds = dt / 1000;

    // Invincibility countdown
    if (player.invincibleMs > 0) {
      player.invincibleMs = Math.max(0, player.invincibleMs - dt);
    }

    // Dash cooldown
    if (player.dashCooldown > 0) {
      player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    }

    // Accumulate movement progress
    this.moveAccumulator += player.speed * seconds;

    // Move one tile at a time while we have enough accumulated
    while (this.moveAccumulator >= 1) {
      this.moveAccumulator -= 1;

      // Try nextDirection first (buffered input for cornering)
      if (player.nextDirection) {
        const next = this.getNextPos(player.pos, player.nextDirection);
        if (this.canMoveTo(next, tilemap)) {
          player.direction = player.nextDirection;
          player.nextDirection = null;
        }
      }

      // Move in current direction
      const target = this.getNextPos(player.pos, player.direction);
      if (this.canMoveTo(target, tilemap)) {
        player.pos = target;

        // Tunnel wrapping
        if (player.pos.x < 0) player.pos.x = MAP_COLS - 1;
        if (player.pos.x >= MAP_COLS) player.pos.x = 0;

        // Collect dot at new position immediately
        this.collectDots();
      } else {
        // Hit a wall — stop accumulating
        this.moveAccumulator = 0;
        break;
      }
    }
  }

  private canMoveTo(pos: Position, tilemap: TileType[][]): boolean {
    if (this.state.player.activeDash) return true; // phase dash ignores walls
    return isWalkable(tilemap, pos.x, pos.y);
  }

  private getNextPos(pos: Position, dir: Direction): Position {
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

  private collectDots() {
    const { player, tilemap } = this.state;
    const tile = tilemap[player.pos.y]?.[player.pos.x];

    if (tile === 2) {
      tilemap[player.pos.y][player.pos.x] = 0;
      this.state.score += DOT_SCORE * this.state.comboMultiplier;
      this.state.dotsRemaining--;
    } else if (tile === 3) {
      tilemap[player.pos.y][player.pos.x] = 0;
      this.state.score += POWER_DOT_SCORE * this.state.comboMultiplier;
      this.state.dotsRemaining--;
    }

    this.updateHighScore();
  }

  private updateEffects(dt: number) {
    this.state.activeEffects = this.state.activeEffects
      .map((e) => ({ ...e, remainingMs: e.remainingMs - dt }))
      .filter((e) => e.remainingMs > 0);

    // Reset combo if no beacon active
    const hasBeacon = this.state.activeEffects.some((e) => e.type === 'combo_beacon');
    if (!hasBeacon) this.state.comboMultiplier = 1;

    // Reset dash if no phase_dash active
    const hasDash = this.state.activeEffects.some((e) => e.type === 'phase_dash');
    if (!hasDash) this.state.player.activeDash = false;
  }

  updateGhosts(dt: number) {
    const seconds = dt / 1000;
    const { ghosts, player, tilemap } = this.state;

    for (const ghost of ghosts) {
      const effectiveSpeed = ghost.frozen ? ghost.speed * 0.5 : ghost.speed;
      this.ghostMoveAccumulator += effectiveSpeed * seconds;
    }

    // Move all ghosts once per accumulated tile
    while (this.ghostMoveAccumulator >= 1) {
      this.ghostMoveAccumulator -= 1;
      for (const ghost of ghosts) {
        moveGhost(ghost, player.pos, tilemap);
      }
    }
  }

  checkGhostCollisions() {
    const { player, ghosts } = this.state;
    if (player.invincibleMs > 0) return;

    for (const ghost of ghosts) {
      if (ghost.pos.x === player.pos.x && ghost.pos.y === player.pos.y) {
        this.state.lives--;
        if (this.state.lives <= 0) {
          this.state.status = 'gameOver';
        } else {
          // Respawn player at original spawn position
          const spawn = findPlayerSpawn(createTilemap());
          player.pos = { ...spawn };
          player.invincibleMs = INVINCIBLE_DURATION;
          this.moveAccumulator = 0;
        }
        return; // only one collision per frame
      }
    }
  }

  private checkRoundClear() {
    if (this.state.dotsRemaining <= 0) {
      this.state.status = 'roundClear';
    }
  }

  setDirection(dir: Direction) {
    this.state.player.nextDirection = dir;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useSkill(_key: string) {
    // Implemented in Task 6 (items)
  }

  nextRound() {
    const prevScore = this.state.score;
    const prevHighScore = this.state.highScore;
    const prevLives = this.state.lives;
    const nextRoundNum = this.state.round + 1;

    this.state = this.createInitialState();
    this.state.status = 'playing';
    this.state.score = prevScore;
    this.state.highScore = prevHighScore;
    this.state.lives = prevLives;
    this.state.round = nextRoundNum;

    // Scale ghosts: more ghosts, faster speed each round
    const ghostCount = Math.min(nextRoundNum + 1, 4);
    const speedMult = 1 + (nextRoundNum - 1) * GHOST_SPEED_SCALE;
    this.state.ghosts = createGhosts(this.state.tilemap, ghostCount, speedMult);

    this.moveAccumulator = 0;
    this.ghostMoveAccumulator = 0;
    this.itemSpawnTimer = 0;
  }

  private loadHighScore(): number {
    try {
      const data = localStorage.getItem('neon_maze_high_score');
      if (data) return JSON.parse(data).score ?? 0;
    } catch {
      /* corrupted */
    }
    return 0;
  }

  private updateHighScore() {
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      try {
        localStorage.setItem(
          'neon_maze_high_score',
          JSON.stringify({ score: this.state.highScore, timestamp: Date.now() }),
        );
      } catch {
        /* storage full */
      }
    }
  }

  getSnapshot(): Readonly<GameState> {
    return this.state;
  }
}
