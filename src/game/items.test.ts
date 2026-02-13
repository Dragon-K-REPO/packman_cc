import { describe, it, expect } from 'vitest';
import { activateItem, applyEffects } from './items';
import { NEON_FREEZE_DURATION, COMBO_MAX_MULTIPLIER } from './constants';

describe('items', () => {
  it('neon_freeze creates correct duration effect', () => {
    const effect = activateItem('neon_freeze');
    expect(effect.remainingMs).toBe(NEON_FREEZE_DURATION);
  });

  it('neon_freeze freezes all ghosts', () => {
    const ghosts = [{ frozen: false }, { frozen: false }];
    const player = { activeDash: false, dashCooldown: 0 };
    const effect = activateItem('neon_freeze');
    applyEffects([effect], { ghosts, player, comboMultiplier: 1 });
    expect(ghosts.every((g) => g.frozen)).toBe(true);
  });

  it('unfreezes ghosts when no freeze effect', () => {
    const ghosts = [{ frozen: true }, { frozen: true }];
    const player = { activeDash: false, dashCooldown: 0 };
    applyEffects([], { ghosts, player, comboMultiplier: 1 });
    expect(ghosts.every((g) => !g.frozen)).toBe(true);
  });

  it('phase_dash activates player dash', () => {
    const player = { activeDash: false, dashCooldown: 0 };
    const effect = activateItem('phase_dash');
    applyEffects([effect], { ghosts: [], player, comboMultiplier: 1 });
    expect(player.activeDash).toBe(true);
  });

  it('combo_beacon increases multiplier up to max', () => {
    const effect = activateItem('combo_beacon');
    const combo = applyEffects([effect], {
      ghosts: [],
      player: { activeDash: false, dashCooldown: 0 },
      comboMultiplier: 1,
    });
    expect(combo).toBeGreaterThan(1);
    expect(combo).toBeLessThanOrEqual(COMBO_MAX_MULTIPLIER);
  });
});
