import { GameState } from './types';

export function renderGameToText(state: GameState): string {
  const lines: string[] = [];
  lines.push(
    `status:${state.status} round:${state.round} score:${state.score} lives:${state.lives}`,
  );
  lines.push(
    `player:(${state.player.pos.x},${state.player.pos.y}) dir:${state.player.direction}`,
  );
  lines.push(
    `ghosts:${state.ghosts.length} dots:${state.dotsRemaining} effects:${state.activeEffects.map((e) => e.type).join(',') || 'none'}`,
  );

  // ASCII map
  for (let y = 0; y < state.tilemap.length; y++) {
    let row = '';
    for (let x = 0; x < state.tilemap[y].length; x++) {
      if (state.player.pos.x === x && state.player.pos.y === y) {
        row += 'P';
        continue;
      }
      if (state.ghosts.some((g) => g.pos.x === x && g.pos.y === y)) {
        row += 'G';
        continue;
      }
      if (state.items.some((i) => i.pos.x === x && i.pos.y === y)) {
        row += 'I';
        continue;
      }
      const t = state.tilemap[y][x];
      row += t === 1 ? '#' : t === 2 ? '.' : t === 3 ? 'O' : t === 4 ? 'H' : ' ';
    }
    lines.push(row);
  }
  return lines.join('\n');
}
