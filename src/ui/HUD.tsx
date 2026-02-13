import { GameState } from '../game/types';

interface HUDProps {
  state: GameState;
}

export function HUD({ state }: HUDProps) {
  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-score">SCORE: {state.score}</span>
        <span className="hud-high">HI: {state.highScore}</span>
      </div>
      <div className="hud-center">
        <span className="hud-round">ROUND {state.round}</span>
      </div>
      <div className="hud-right">
        <span className="hud-lives">
          {'♥'.repeat(state.lives)}
          {'♡'.repeat(Math.max(0, 3 - state.lives))}
        </span>
      </div>
      {state.activeEffects.length > 0 && (
        <div className="hud-effects">
          {state.activeEffects.map((e, i) => (
            <span key={i} className={`effect-badge effect-${e.type}`}>
              {e.type.replace(/_/g, ' ')} {Math.ceil(e.remainingMs / 1000)}s
            </span>
          ))}
        </div>
      )}
      {state.comboMultiplier > 1 && (
        <span className="hud-combo">x{state.comboMultiplier.toFixed(1)}</span>
      )}
    </div>
  );
}
