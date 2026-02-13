interface RoundClearScreenProps {
  score: number;
  round: number;
}

export function RoundClearScreen({ score, round }: RoundClearScreenProps) {
  return (
    <div className="overlay-screen round-clear-screen">
      <h2 className="neon-title">ROUND {round} CLEAR!</h2>
      <p className="neon-sub">Score: {score}</p>
      <p className="neon-sub blink">Press ENTER for Next Round</p>
    </div>
  );
}
