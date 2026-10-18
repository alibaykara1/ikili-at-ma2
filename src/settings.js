// Oyuncunun ayarlar ekranından değiştirdiği değerler.
// Varsayılanlar config.js'ten gelir, değişiklikler tarayıcıda saklanır.
import { LIVES, BOMBS_PER_LIFE, PLAYERS } from './config.js';
import { MAP_IDS } from './maps.js';

const STORAGE_KEY = 'ikili-catisma-2-settings';

export const CRATE_RATES = [
  { id: 'az', label: 'AZ', ms: 8000 },
  { id: 'normal', label: 'NORMAL', ms: 5000 },
  { id: 'cok', label: 'ÇOK', ms: 2500 },
];

export const LIMITS = {
  lives: { min: 1, max: 10 },
  bombs: { min: 0, max: 5 },
  nameLength: 12,
};

// Özel maçta bir yuvanın alabileceği değerler
export const SLOT_TYPES = [
  { id: 'human', label: 'OYUNCU' },
  { id: 'easy', label: 'EASY AI' },
  { id: 'normal', label: 'NORMAL AI' },
  { id: 'hard', label: 'HARD AI' },
  { id: 'off', label: 'KAPALI' },
];

export const defaultKeys = () => PLAYERS.map((p) => ({ ...p.keys }));

const defaults = () => ({
  lives: LIVES,
  bombs: BOMBS_PER_LIFE,
  crateRate: 'normal',
  botLevel: 'normal',
  names: PLAYERS.map((p) => p.name),
  keys: defaultKeys(),
  slots: ['human', 'human', 'off', 'off'],
  mapId: MAP_IDS[0],
});

function load() {
  const s = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    Object.assign(s, saved);
  } catch {
    // Depolama yoksa varsayılanlarla devam
  }
  // Eski kayıtlarda eksik kalan oyuncu/tuşları varsayılanla doldur
  const d = defaults();
  s.names = d.names.map((n, i) => s.names?.[i] || n);
  s.keys = d.keys.map((k, i) => ({ ...k, ...(s.keys?.[i] || {}) }));
  s.slots = d.slots.map((v, i) => s.slots?.[i] || v);
  if (!MAP_IDS.includes(s.mapId)) s.mapId = d.mapId;
  return s;
}

export const settings = load();

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Kaydedilemezse bu oturumda yine geçerli
  }
}

// Tuşlar ayrı ekranda sıfırlandığı için burada korunur
export function resetSettings() {
  const { keys } = settings;
  Object.assign(settings, defaults(), { keys });
  saveSettings();
}

export const crateIntervalMs = () =>
  (CRATE_RATES.find((r) => r.id === settings.crateRate) || CRATE_RATES[1]).ms;
