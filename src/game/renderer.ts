import { GameState, TileType } from './types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, COLOR } from './constants';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const w = MAP_COLS * TILE_SIZE;
  const h = MAP_ROWS * TILE_SIZE;

  ctx.fillStyle = COLOR.BG;
  ctx.fillRect(0, 0, w, h);

  renderMaze(ctx, state.tilemap);
  renderDots(ctx, state.tilemap);
  renderItems(ctx, state);
  renderPlayer(ctx, state);
  renderGhosts(ctx, state);
  renderScanlines(ctx, w, h);
}

function renderMaze(ctx: CanvasRenderingContext2D, tilemap: TileType[][]) {
  for (let y = 0; y < tilemap.length; y++) {
    for (let x = 0; x < tilemap[y].length; x++) {
      if (tilemap[y][x] === 1) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        ctx.fillStyle = COLOR.WALL;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = COLOR.WALL_BORDER;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        ctx.globalAlpha = 1;
      }
    }
  }
}

function renderDots(ctx: CanvasRenderingContext2D, tilemap: TileType[][]) {
  for (let y = 0; y < tilemap.length; y++) {
    for (let x = 0; x < tilemap[y].length; x++) {
      const tile = tilemap[y][x];
      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const cy = y * TILE_SIZE + TILE_SIZE / 2;

      if (tile === 2) {
        ctx.fillStyle = COLOR.DOT;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 3) {
        ctx.fillStyle = COLOR.POWER_DOT;
        ctx.shadowColor = COLOR.POWER_DOT;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

function renderItems(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const item of state.items) {
    const cx = item.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = item.pos.y * TILE_SIZE + TILE_SIZE / 2;

    const colors: Record<string, string> = {
      neon_freeze: COLOR.CYAN,
      phase_dash: COLOR.LIME,
      combo_beacon: COLOR.MAGENTA,
    };

    const color = colors[item.type] ?? COLOR.CYAN;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const { pos, invincibleMs, direction } = state.player;
  const cx = pos.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = pos.y * TILE_SIZE + TILE_SIZE / 2;

  // Blink during invincibility
  if (invincibleMs > 0 && Math.floor(invincibleMs / 100) % 2 === 0) return;

  const radius = TILE_SIZE / 2 - 4;

  // Mouth angle based on direction
  const dirAngles: Record<string, number> = {
    right: 0,
    down: Math.PI / 2,
    left: Math.PI,
    up: -Math.PI / 2,
  };
  const baseAngle = dirAngles[direction] ?? 0;
  const mouthOpen = 0.3; // radians

  ctx.fillStyle = COLOR.PLAYER;
  ctx.shadowColor = COLOR.PLAYER;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, baseAngle + mouthOpen, baseAngle + Math.PI * 2 - mouthOpen);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function renderGhosts(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const ghost of state.ghosts) {
    const cx = ghost.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = ghost.pos.y * TILE_SIZE + TILE_SIZE / 2;
    const color = COLOR.GHOST[ghost.id % COLOR.GHOST.length];

    ctx.fillStyle = ghost.frozen ? '#6666ff' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Ghost body
    const r = TILE_SIZE / 2 - 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r);
    // Wavy bottom
    const segments = 3;
    const segW = (r * 2) / segments;
    for (let i = segments; i > 0; i--) {
      const sx = cx + r - (segments - i) * segW;
      const ex = sx - segW;
      const mid = (sx + ex) / 2;
      ctx.quadraticCurveTo(mid, cy + r - 4, ex, cy + r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000033';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}
