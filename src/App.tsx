import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { InputHandler } from './game/input';
import { renderGame } from './game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants';
import { GameStatus } from './game/types';
import { HUD } from './ui/HUD';
import { MenuScreen } from './ui/MenuScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { RoundClearScreen } from './ui/RoundClearScreen';
import { PauseOverlay } from './ui/PauseOverlay';
import { renderGameToText } from './game/testHooks';
import './ui/ui.css';

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

    // Testing hooks for Playwright E2E
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).render_game_to_text = () => renderGameToText(engine.getSnapshot());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).advanceTime = (ms: number) => engine.update(ms);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).setDirection = (dir: string) => engine.setDirection(dir as any);

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
          engine.nextRound();
          setGameStatus('playing');
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
      const dt = Math.min(timestamp - lastTimeRef.current, 100);
      lastTimeRef.current = timestamp;

      const dir = input.consumeDirection();
      if (dir) engine.setDirection(dir);

      const skill = input.consumeSkill();
      if (skill) engine.useSkill(skill);

      engine.update(dt);

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

  const state = engineRef.current.getSnapshot();

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

      {gameStatus === 'menu' && <MenuScreen />}
      {gameStatus === 'playing' && <HUD state={state} />}
      {gameStatus === 'paused' && <PauseOverlay />}
      {gameStatus === 'roundClear' && (
        <RoundClearScreen score={state.score} round={state.round} />
      )}
      {gameStatus === 'gameOver' && (
        <GameOverScreen score={state.score} highScore={state.highScore} />
      )}
    </div>
  );
}

export default App;
