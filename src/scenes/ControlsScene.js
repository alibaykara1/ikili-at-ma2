import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYERS } from '../config.js';
import { settings, saveSettings, defaultKeys } from '../settings.js';
import { drawDesertBackground } from '../background.js';
import { MenuList, dimOverlay, keyLabel, FONT } from '../ui.js';

const ACTIONS = [
  { id: 'left', label: 'SOLA' },
  { id: 'right', label: 'SAĞA' },
  { id: 'jump', label: 'ZIPLA' },
  { id: 'down', label: 'İN' },
  { id: 'fire', label: 'ATEŞ' },
  { id: 'bomb', label: 'BOMBA' },
];

// Tarayıcı tuş kodu -> Phaser tuş adı (ör. 37 -> LEFT)
const CODE_TO_NAME = {};
Object.entries(Phaser.Input.Keyboard.KeyCodes).forEach(([name, code]) => {
  if (!(code in CODE_TO_NAME)) CODE_TO_NAME[code] = name;
});

const toCss = (c) => `#${c.toString(16).padStart(6, '0')}`;

// Her oyuncunun tuşlarını değiştirme ekranı
export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super('ControlsScene');
  }

  create() {
    drawDesertBackground(this);
    dimOverlay(this, 0.45);
    this.player = 0;
    this.waiting = null; // tuş beklenen eylem

    this.add.text(GAME_WIDTH / 2, 48, 'TUŞLAR', {
      fontFamily: FONT, fontSize: '40px', color: '#ffb21a', stroke: '#2b1a0c', strokeThickness: 8,
    }).setOrigin(0.5);

    const changePlayer = (d) => {
      this.player = (this.player + d + PLAYERS.length) % PLAYERS.length;
    };
    const actionItem = (a) => ({
      text: () => {
        const val = this.waiting === a.id ? '[ bir tuşa bas ]' : keyLabel(settings.keys[this.player][a.id]);
        return `${a.label}:  ${val}`;
      },
      onSelect: () => this.startWaiting(a.id),
    });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 110, [
      {
        text: () => `‹ ${settings.names[this.player].toUpperCase()} ›`,
        onLeft: () => changePlayer(-1),
        onRight: () => changePlayer(1),
      },
      ...ACTIONS.map(actionItem),
      { text: () => 'VARSAYILAN TUŞLAR', onSelect: () => this.resetPlayer() },
      { text: () => 'GERİ', onSelect: () => this.scene.start('MenuScene') },
    ], { spacing: 40, fontSize: 22 });

    // Seçili oyuncunun rengi
    this.colorDot = this.add.circle(GAME_WIDTH / 2 - 150, 110, 10, PLAYERS[0].color).setStrokeStyle(3, 0x2b1a0c);

    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', stroke: '#2b1a0c', strokeThickness: 4,
    }).setOrigin(0.5);
    this.showHint();

    this.input.keyboard.on('keydown', this.onBindKey, this);
    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.waiting) this.scene.start('MenuScene');
    });
  }

  update() {
    this.colorDot.setFillStyle(PLAYERS[this.player].color);
    this.menu.texts[0].setStroke(toCss(PLAYERS[this.player].color), 6);
  }

  showHint(msg, warn) {
    this.hint.setText(msg || '← → oyuncu seç  •  Enter: tuşu değiştir  •  Esc: geri');
    this.hint.setColor(warn ? '#ffd23a' : '#ffffff');
  }

  startWaiting(action) {
    this.waiting = action;
    this.menu.locked = true;
    this.waitStartedAt = performance.now(); // bu ekranı açan Enter'ı yok saymak için
    this.showHint('Yeni tuşa bas  •  Esc: vazgeç');
    this.menu.refresh();
  }

  stopWaiting() {
    this.waiting = null;
    // Aynı tuş menüyü tetiklemesin diye kilidi bir kare sonra aç
    this.time.delayedCall(0, () => { this.menu.locked = false; this.menu.refresh(); });
  }

  onBindKey(e) {
    if (!this.waiting || e.timeStamp <= this.waitStartedAt) return;
    if (e.key === 'Escape') {
      this.showHint();
      this.stopWaiting();
      return;
    }
    const name = CODE_TO_NAME[e.keyCode];
    if (!name) return;

    const mine = settings.keys[this.player];
    const old = mine[this.waiting];
    let msg = '';
    // Tuş başka bir yerde kullanılıyorsa iki tuş yer değiştirir
    settings.keys.forEach((keys, p) => {
      Object.entries(keys).forEach(([action, k]) => {
        if (k === name && !(p === this.player && action === this.waiting)) {
          keys[action] = old;
          const label = ACTIONS.find((a) => a.id === action).label;
          msg = `${keyLabel(name)} tuşu ${settings.names[p]} ${label} ile yer değiştirdi (${keyLabel(old)})`;
        }
      });
    });
    mine[this.waiting] = name;
    saveSettings();
    this.showHint(msg, !!msg);
    this.stopWaiting();
  }

  resetPlayer() {
    settings.keys[this.player] = defaultKeys()[this.player];
    // Varsayılana dönen tuşlar başka oyuncuyla çakışırsa o oyuncuyu da varsayılana al
    const used = new Set(Object.values(settings.keys[this.player]));
    settings.keys.forEach((keys, p) => {
      if (p !== this.player && Object.values(keys).some((k) => used.has(k))) settings.keys[p] = defaultKeys()[p];
    });
    saveSettings();
    this.showHint('Varsayılan tuşlar yüklendi');
  }
}
