# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neon retro Pacman-like web game built with React + TypeScript + Canvas 2D. Single-stage maze game with tactical special items, ghost AI, round-based difficulty scaling, and a neon/CRT visual aesthetic. PRD is in `pacman_prd.md` (Korean).

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (src --ext .ts,.tsx)
npm run format     # Prettier (src)
```

Deployment: `vercel deploy -y` (preview only, not production).

## Architecture

### Separation of Concerns

- **GameEngine class** (`src/game/GameEngine.ts`) — owns all real-time game state, runs the update loop. Framework-agnostic pure TypeScript; no React imports.
- **React layer** (`src/ui/`) — menus, HUD, screen transitions. Consumes read-only engine state snapshots. Never mutates game state directly.
- **Canvas renderer** — draws the game world using a fixed virtual resolution that scales to the container.

Data flow is unidirectional: `User Input → GameEngine.update(dt) → state snapshot → React/Canvas render`.

### Key Types (`src/game/types.ts`)

`GameState`, `PlayerState`, `GhostState`, `ItemState`, `EffectState`, `RoundConfig`. The `gameStatus` field drives screen transitions: `'menu' | 'playing' | 'paused' | 'roundClear' | 'gameOver'`.

### Special Items

1. **Neon Freeze** — ghosts 50% speed for 4s
2. **Phase Dash** — wall-piercing dash for 1.2s (10s cooldown)
3. **Combo Beacon** — dot score multiplier up to 3x for 6s

### Ghost AI

Patrol (default) and chase (player in line of sight). Speed and spawn rate scale with round number.

### Storage

Single localStorage key: `neon_maze_high_score`.

### Testing Hooks

Two window-level APIs for Playwright E2E testing:
- `window.render_game_to_text()` — returns game state as text
- `window.advanceTime(ms)` — advances game clock by N milliseconds

## Conventions

- Game engine code in `src/game/` must have zero React dependencies
- Korean-first for user-facing text, README, and documentation
- Input handling uses a keyboard buffer (Arrow keys/WASD for movement, Q/E/Space for skills)
- Canvas uses a fixed internal resolution with CSS scaling for responsiveness
- Neon color palette: cyan `#00ffff`, magenta `#ff00ff`, lime `#00ff00`
