import { GameState, Direction, TileType, Position } from './types';
import {
  PLAYER_BASE_SPEED,
  INITIAL_LIVES,
  DOT_SCORE,
  POWER_DOT_SCORE,
  INVINCIBLE_DURATION,
  GHOST_SPEED_SCALE,
  PHASE_DASH_COOLDOWN,
  ITEM_SPAWN_INTERVAL,
  ITEM_SPAWN_BASE_CHANCE,
  MAP_COLS,
} from './constants';
import { createTilemap, findPlayerSpawn, countDots, isWalkable } from './tilemap';
import { createGhosts, moveGhost } from './ghost';
import { trySpawnItem, activateItem, applyEffects } from './items';

export class GameEngine {
  state: GameState;
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
        moveProgress: 0,
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
    this.itemSpawnTimer = 0;
  }

  update(dt: number) {
    if (this.state.status !== 'playing') return;

    this.updatePlayer(dt);
    this.collectDots();
    this.collectItems();
    this.updateEffects(dt);
    this.updateGhosts(dt);
    this.checkGhostCollisions();
    this.spawnItems(dt);
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

    // Process buffered direction change every frame
    // (must run BEFORE wall guard so player can turn while facing a wall)
    if (player.nextDirection) {
      const next = this.getNextPos(player.pos, player.nextDirection);
      if (this.canMoveTo(next, tilemap)) {
        player.direction = player.nextDirection;
        player.nextDirection = null;
        player.moveProgress = 0;
      }
    }

    // Accumulate movement progress on the player entity
    player.moveProgress += player.speed * seconds;

    // Move one tile at a time while we have enough accumulated
    while (player.moveProgress >= 1) {
      player.moveProgress -= 1;

      // Try nextDirection for cornering during multi-tile frames
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
        player.moveProgress = 0;
        break;
      }
    }

    // Wall proximity guard: if next tile ahead is a wall, clamp visual offset
    const ahead = this.getNextPos(player.pos, player.direction);
    if (!this.canMoveTo(ahead, tilemap)) {
      player.moveProgress = 0;
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

  private collectItems() {
    const { player, items } = this.state;
    const idx = items.findIndex((i) => i.pos.x === player.pos.x && i.pos.y === player.pos.y);
    if (idx !== -1) {
      const item = items[idx];
      this.state.items.splice(idx, 1);
      const effect = activateItem(item.type);
      this.state.activeEffects.push(effect);
    }
  }

  private spawnItems(dt: number) {
    this.itemSpawnTimer += dt;
    if (this.itemSpawnTimer >= ITEM_SPAWN_INTERVAL) {
      this.itemSpawnTimer = 0;
      const chance = ITEM_SPAWN_BASE_CHANCE * (1 + (this.state.round - 1) * 0.1);
      const item = trySpawnItem(this.state.tilemap, this.state.items, chance);
      if (item) this.state.items.push(item);
    }
  }

  private updateEffects(dt: number) {
    this.state.activeEffects = this.state.activeEffects
      .map((e) => ({ ...e, remainingMs: e.remainingMs - dt }))
      .filter((e) => e.remainingMs > 0);

    // Apply active effects
    this.state.comboMultiplier = applyEffects(this.state.activeEffects, {
      ghosts: this.state.ghosts,
      player: this.state.player,
      comboMultiplier: this.state.comboMultiplier,
    });
  }

  updateGhosts(dt: number) {
    const seconds = dt / 1000;
    const { ghosts, player, tilemap } = this.state;

    for (const ghost of ghosts) {
      const effectiveSpeed = ghost.frozen ? ghost.speed * 0.5 : ghost.speed;
      ghost.moveProgress += effectiveSpeed * seconds;

      while (ghost.moveProgress >= 1) {
        ghost.moveProgress -= 1;
        moveGhost(ghost, player.pos, tilemap);
      }

      // Ghost wall proximity guard: prevent visual wall penetration
      const nextGhostPos = this.getNextPos(ghost.pos, ghost.direction);
      if (!isWalkable(tilemap, nextGhostPos.x, nextGhostPos.y)) {
        ghost.moveProgress = 0;
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
          player.moveProgress = 0;
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

  useSkill(key: string) {
    // Q = Phase Dash (if not on cooldown and not already active)
    if ((key === 'q' || key === ' ') && !this.state.player.activeDash && this.state.player.dashCooldown <= 0) {
      const effect = activateItem('phase_dash');
      this.state.activeEffects.push(effect);
      this.state.player.activeDash = true;
      this.state.player.dashCooldown = PHASE_DASH_COOLDOWN;
    }
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
