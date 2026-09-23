import './ui/style.css';
import { createInitialState, tick } from './engine/engine';
import { loadGame, SAVE_KEY, saveGame } from './engine/save';
import type { GameState } from './engine/types';
import { GameView } from './ui/view';

const TICK_MS = 100;
const AUTOSAVE_MS = 10_000;
/** Offline progress is not in v1: a long pause (hidden tab, sleep) counts as at most this much. */
const MAX_CATCH_UP_SECONDS = 60;

let state: GameState = loadGame();
const root = document.getElementById('app')!;

const view = new GameView(root, state, {
  onChange: () => view.render(),
  onHardReset: () => {
    localStorage.removeItem(SAVE_KEY);
    state = createInitialState();
    view.setState(state);
    exposeForDebugging();
    view.render();
  },
});

function exposeForDebugging() {
  if (import.meta.env.DEV) (window as unknown as { game: GameState }).game = state;
}
exposeForDebugging();

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const seconds = Math.min((now - last) / 1000, MAX_CATCH_UP_SECONDS);
  last = now;
  tick(state, seconds);
  view.render();
}, TICK_MS);

setInterval(() => saveGame(state), AUTOSAVE_MS);
window.addEventListener('beforeunload', () => saveGame(state));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(state);
});

view.render();
