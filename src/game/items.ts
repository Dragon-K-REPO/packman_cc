import { ItemDrop, ActiveEffect, TileType, Position } from './types';
import {
  NEON_FREEZE_DURATION,
  PHASE_DASH_DURATION,
  COMBO_BEACON_DURATION,
  COMBO_MAX_MULTIPLIER,
} from './constants';

const ITEM_TYPES = ['neon_freeze', 'phase_dash', 'combo_beacon'] as const;

export function trySpawnItem(
  tilemap: TileType[][],
  existingItems: ItemDrop[],
  spawnChance: number,
): ItemDrop | null {
  if (Math.random() > spawnChance) return null;
  if (existingItems.length >= 2) return null;

  // Find empty path tiles (not walls, not dots, not ghost house)
  const candidates: Position[] = [];
  for (let y = 0; y < tilemap.length; y++) {
    for (let x = 0; x < tilemap[y].length; x++) {
      if (tilemap[y][x] === 0) {
        const occupied = existingItems.some((i) => i.pos.x === x && i.pos.y === y);
        if (!occupied) candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return null;

  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  return { type, pos };
}

export function activateItem(type: ItemDrop['type']): ActiveEffect {
  switch (type) {
    case 'neon_freeze':
      return { type: 'neon_freeze', remainingMs: NEON_FREEZE_DURATION };
    case 'phase_dash':
      return { type: 'phase_dash', remainingMs: PHASE_DASH_DURATION };
    case 'combo_beacon':
      return { type: 'combo_beacon', remainingMs: COMBO_BEACON_DURATION };
  }
}

export function applyEffects(
  effects: ActiveEffect[],
  context: {
    ghosts: { frozen: boolean }[];
    player: { activeDash: boolean; dashCooldown: number };
    comboMultiplier: number;
  },
): number {
  let combo = 1;

  for (const effect of effects) {
    switch (effect.type) {
      case 'neon_freeze':
        context.ghosts.forEach((g) => (g.frozen = true));
        break;
      case 'phase_dash':
        context.player.activeDash = true;
        break;
      case 'combo_beacon':
        combo = Math.min(combo + 0.5, COMBO_MAX_MULTIPLIER);
        break;
    }
  }

  // Unfreeze if no freeze effect active
  if (!effects.some((e) => e.type === 'neon_freeze')) {
    context.ghosts.forEach((g) => (g.frozen = false));
  }

  return combo;
}
