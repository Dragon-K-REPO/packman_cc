interface GameOverScreenProps {
  score: number;
  highScore: number;
}

export function GameOverScreen({ score, highScore }: GameOverScreenProps) {
  return (
    <div className="overlay-screen gameover-screen">
      <h2 className="neon-title">GAME OVER</h2>
      <p className="neon-sub">Score: {score}</p>
      {score >= highScore && score > 0 && <p className="new-high">NEW HIGH SCORE!</p>}
      <p className="neon-sub">High Score: {highScore}</p>
      <p className="neon-sub blink">Press ENTER to Restart</p>
    </div>
  );
}
