// ─── Singleton app state ──────────────────────────────────────────────────────

export const state = {
  currentData: null,
  pathLocked: false,
  lockedCell: null,
  mode: 'normal',         // 'normal' | 'diff'
  diffLeft: null,
  diffRight: null,
  theme: localStorage.getItem('theme') ?? 'dark',
};

export function setCurrentData(data) {
  state.currentData = data;
}

export function setMode(mode) {
  state.mode = mode;
}

export function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('theme', theme);
}

export function lockPath(cell) {
  if (state.lockedCell && state.lockedCell !== cell) {
    state.lockedCell.classList.remove('cell-locked');
  }
  state.lockedCell = cell;
  state.pathLocked = true;
  cell.classList.add('cell-locked');
}

export function unlockPath() {
  if (state.lockedCell) {
    state.lockedCell.classList.remove('cell-locked');
  }
  state.lockedCell = null;
  state.pathLocked = false;
}

export function resetPathState() {
  unlockPath();
}
