// Per-browser preferences. Storage can be unavailable (private mode), so
// every access is guarded and defaults always work.

const KEY = 'itt.settings';

const DEFAULTS = {
  name: '',
  sensitivity: 1,
  invertY: false,
  volume: 0.8,
  music: 0.6,
  quality: 'high',
  autoQuality: true,
  hints: true,
};

export function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(KEY) || '{}') || {};
  } catch {
    saved = {};
  }
  return { ...DEFAULTS, ...saved };
}

export function saveSettings(s) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
