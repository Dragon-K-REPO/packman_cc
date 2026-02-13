import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { InputHandler } from './game/input';
import { renderGame } from './game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants';
import { GameStatus } from './game/types';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const inputRef = useRef<InputHandler>(new InputHandler());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');

  const handleStart = useCallback(() => {
    engineRef.current.startGame();
    setGameStatus('playing');
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current.startGame();
    setGameStatus('playing');
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    const input = inputRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    input.attach();

    // Global key handler for menu/pause/restart
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (engine.state.status === 'menu') {
          e.preventDefault();
          handleStart();
        } else if (engine.state.status === 'gameOver') {
          e.preventDefault();
          handleRestart();
        } else if (engine.state.status === 'roundClear') {
          e.preventDefault();
          if (typeof engine.nextRound === 'function') {
            engine.nextRound();
            setGameStatus('playing');
          }
        }
      }
      if (e.key === 'Escape') {
        if (engine.state.status === 'playing') {
          engine.state.status = 'paused';
          setGameStatus('paused');
        } else if (engine.state.status === 'paused') {
          engine.state.status = 'playing';
          setGameStatus('playing');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 100); // cap at 100ms
      lastTimeRef.current = timestamp;

      // Feed buffered input to engine
      const dir = input.consumeDirection();
      if (dir) engine.setDirection(dir);

      // Feed skill input
      const skill = input.consumeSkill();
      if (skill && typeof engine.useSkill === 'function') {
        engine.useSkill(skill);
      }

      engine.update(dt);

      // Sync React status for UI overlay changes
      if (engine.state.status !== gameStatus) {
        setGameStatus(engine.state.status);
      }

      renderGame(ctx, engine.state);
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      input.detach();
      window.removeEventListener('keydown', handleGlobalKeys);
    };
  }, [gameStatus, handleStart, handleRestart]);

  const engine = engineRef.current;
  const state = engine.getSnapshot();

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

      {gameStatus === 'menu' && (
        <div className="overlay-screen menu-screen">
          <h1 className="neon-title">NEON PACMAN</h1>
          <p className="neon-sub">Press ENTER to Start</p>
        </div>
      )}

      {gameStatus === 'playing' && (
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
      )}

      {gameStatus === 'paused' && (
        <div className="overlay-screen pause-screen">
          <h2 className="neon-title">PAUSED</h2>
          <p className="neon-sub">Press ESC to Resume</p>
        </div>
      )}

      {gameStatus === 'roundClear' && (
        <div className="overlay-screen round-clear-screen">
          <h2 className="neon-title">ROUND CLEAR!</h2>
          <p className="neon-sub">Score: {state.score}</p>
          <p className="neon-sub">Press ENTER for Next Round</p>
        </div>
      )}

      {gameStatus === 'gameOver' && (
        <div className="overlay-screen gameover-screen">
          <h2 className="neon-title">GAME OVER</h2>
          <p className="neon-sub">Score: {state.score}</p>
          <p className="neon-sub">High Score: {state.highScore}</p>
          <p className="neon-sub">Press ENTER to Restart</p>
        </div>
      )}
    </div>
  );
}

export default App;
