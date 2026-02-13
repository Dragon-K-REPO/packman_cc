import { Direction } from './types';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const SKILL_KEYS = new Set(['q', 'Q', 'e', 'E', ' ']);

export class InputHandler {
  private directionBuffer: Direction | null = null;
  private skillPressed: string | null = null;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown(e: KeyboardEvent) {
    const dir = KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      this.directionBuffer = dir;
    }
    if (SKILL_KEYS.has(e.key)) {
      e.preventDefault();
      this.skillPressed = e.key.toLowerCase();
    }
  }

  consumeDirection(): Direction | null {
    const dir = this.directionBuffer;
    this.directionBuffer = null;
    return dir;
  }

  consumeSkill(): string | null {
    const skill = this.skillPressed;
    this.skillPressed = null;
    return skill;
  }
}
