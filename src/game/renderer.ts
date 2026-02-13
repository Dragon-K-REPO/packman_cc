import { GameState, TileType } from './types';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, COLOR } from './constants';

let frameCount = 0;

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  frameCount++;
  const w = MAP_COLS * TILE_SIZE;
  const h = MAP_ROWS * TILE_SIZE;

  ctx.fillStyle = COLOR.BG;
  ctx.fillRect(0, 0, w, h);

  renderMaze(ctx, state.tilemap);
  renderDots(ctx, state.tilemap);
  renderItems(ctx, state);
  renderPlayer(ctx, state);
  renderGhosts(ctx, state);
  renderDashTrail(ctx, state);
  renderScanlines(ctx, w, h);
  renderVignette(ctx, w, h);
}

function renderMaze(ctx: CanvasRenderingContext2D, tilemap: TileType[][]) {
  for (let y = 0; y < tilemap.length; y++) {
    for (let x = 0; x < tilemap[y].length; x++) {
      if (tilemap[y][x] === 1) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Dark wall fill
        ctx.fillStyle = COLOR.WALL;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Neon border glow — subtle outer glow + sharp inner border
        ctx.strokeStyle = COLOR.WALL_BORDER;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        ctx.globalAlpha = 1;
      }
    }
  }
}

function renderDots(ctx: CanvasRenderingContext2D, tilemap: TileType[][]) {
  const now = Date.now();

  for (let y = 0; y < tilemap.length; y++) {
    for (let x = 0; x < tilemap[y].length; x++) {
      const tile = tilemap[y][x];
      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const cy = y * TILE_SIZE + TILE_SIZE / 2;

      if (tile === 2) {
        // Small dot with subtle glow
        ctx.fillStyle = COLOR.DOT;
        ctx.shadowColor = COLOR.DOT;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (tile === 3) {
        // Power dot with pulsing size + glow
        const pulse = Math.sin(now / 200) * 0.3 + 1;
        const radius = 6 * pulse;
        const blur = 8 + Math.sin(now / 300) * 4;

        ctx.fillStyle = COLOR.POWER_DOT;
        ctx.shadowColor = COLOR.POWER_DOT;
        ctx.shadowBlur = blur;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

function renderItems(ctx: CanvasRenderingContext2D, state: GameState) {
  const now = Date.now();

  for (const item of state.items) {
    const cx = item.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = item.pos.y * TILE_SIZE + TILE_SIZE / 2;

    const colors: Record<string, string> = {
      neon_freeze: COLOR.CYAN,
      phase_dash: COLOR.LIME,
      combo_beacon: COLOR.MAGENTA,
    };
    const symbols: Record<string, string> = {
      neon_freeze: '❄',
      phase_dash: '⚡',
      combo_beacon: '★',
    };

    const color = colors[item.type] ?? COLOR.CYAN;
    const bob = Math.sin(now / 400) * 2;

    // Glow circle
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 + Math.sin(now / 250) * 4;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Item symbol
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(symbols[item.type] ?? '?', cx, cy + bob);
    ctx.shadowBlur = 0;
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const { pos, invincibleMs, direction, activeDash } = state.player;
  const cx = pos.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = pos.y * TILE_SIZE + TILE_SIZE / 2;

  // Blink during invincibility
  if (invincibleMs > 0 && Math.floor(invincibleMs / 100) % 2 === 0) return;

  const radius = TILE_SIZE / 2 - 4;

  // Mouth animation: open/close cycle
  const mouthCycle = Math.abs(Math.sin(frameCount * 0.15));
  const mouthOpen = mouthCycle * 0.5 + 0.05; // range: 0.05 to 0.55 radians

  const dirAngles: Record<string, number> = {
    right: 0,
    down: Math.PI / 2,
    left: Math.PI,
    up: -Math.PI / 2,
  };
  const baseAngle = dirAngles[direction] ?? 0;

  // Dash glow effect
  if (activeDash) {
    ctx.fillStyle = COLOR.PLAYER;
    ctx.shadowColor = COLOR.PLAYER;
    ctx.shadowBlur = 24;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = COLOR.PLAYER;
  ctx.shadowColor = COLOR.PLAYER;
  ctx.shadowBlur = activeDash ? 18 : 10;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, baseAngle + mouthOpen, baseAngle + Math.PI * 2 - mouthOpen);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function renderGhosts(ctx: CanvasRenderingContext2D, state: GameState) {
  const now = Date.now();

  for (const ghost of state.ghosts) {
    const cx = ghost.pos.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = ghost.pos.y * TILE_SIZE + TILE_SIZE / 2;
    const color = COLOR.GHOST[ghost.id % COLOR.GHOST.length];

    const frozenColor = '#6666ff';
    const bodyColor = ghost.frozen ? frozenColor : color;

    // Frozen shimmer
    const shimmer = ghost.frozen ? Math.sin(now / 150) * 0.15 : 0;

    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 1 - shimmer;

    // Ghost body
    const r = TILE_SIZE / 2 - 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r);

    // Animated wavy bottom
    const segments = 3;
    const segW = (r * 2) / segments;
    const waveOffset = Math.sin(now / 200 + ghost.id) * 2;
    for (let i = segments; i > 0; i--) {
      const sx = cx + r - (segments - i) * segW;
      const ex = sx - segW;
      const mid = (sx + ex) / 2;
      ctx.quadraticCurveTo(mid, cy + r - 4 + waveOffset, ex, cy + r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pupils — look toward player
    const dx = state.player.pos.x - ghost.pos.x;
    const dy = state.player.pos.y - ghost.pos.y;
    const pupilShift = Math.min(1.5, Math.sqrt(dx * dx + dy * dy) * 0.1);
    const angle = Math.atan2(dy, dx);
    const px = Math.cos(angle) * pupilShift;
    const py = Math.sin(angle) * pupilShift;

    ctx.fillStyle = ghost.frozen ? '#aaaaff' : '#000033';
    ctx.beginPath();
    ctx.arc(cx - 4 + px, cy - 4 + py, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 4 + px, cy - 4 + py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderDashTrail(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.player.activeDash) return;

  // Draw a subtle trail behind the player
  const { pos, direction } = state.player;
  const cx = pos.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = pos.y * TILE_SIZE + TILE_SIZE / 2;

  const trailDirs: Record<string, [number, number]> = {
    right: [-1, 0],
    left: [1, 0],
    up: [0, 1],
    down: [0, -1],
  };
  const [tdx, tdy] = trailDirs[direction] ?? [0, 0];

  for (let i = 1; i <= 3; i++) {
    ctx.fillStyle = COLOR.PLAYER;
    ctx.globalAlpha = 0.15 / i;
    ctx.beginPath();
    ctx.arc(cx + tdx * i * 12, cy + tdy * i * 12, 8 - i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function renderScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }
}

function renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}
