import { useRef, useEffect } from 'react';

const CANVAS_WIDTH = 672; // 21 tiles * 32px
const CANVAS_HEIGHT = 672;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#00ffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEON PACMAN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </div>
  );
}

export default App;
