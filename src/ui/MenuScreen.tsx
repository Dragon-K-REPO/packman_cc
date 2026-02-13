export function MenuScreen() {
  return (
    <div className="overlay-screen menu-screen">
      <h1 className="neon-title">NEON PACMAN</h1>
      <div className="menu-controls">
        <p className="neon-sub">Press ENTER to Start</p>
      </div>
      <div className="menu-info">
        <p className="menu-hint">WASD / Arrow Keys: Move</p>
        <p className="menu-hint">Q / Space: Phase Dash</p>
        <p className="menu-hint">ESC: Pause</p>
      </div>
    </div>
  );
}
