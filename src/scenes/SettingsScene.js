import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BOT_LEVELS } from '../config.js';
import { settings, saveSettings, resetSettings, CRATE_RATES, LIMITS } from '../settings.js';
import { drawDesertBackground } from '../background.js';
import { MenuList, dimOverlay, FONT } from '../ui.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    drawDesertBackground(this);
    dimOverlay(this, 0.45);
    this.editingName = -1; // düzenlenen oyuncu adı (-1 = yok)

    this.add.text(GAME_WIDTH / 2, 52, 'AYARLAR', {
      fontFamily: FONT, fontSize: '44px', color: '#ffb21a', stroke: '#2b1a0c', strokeThickness: 8,
    }).setOrigin(0.5);

    const step = (key, d) => {
      const { min, max } = LIMITS[key];
      settings[key] = Phaser.Math.Clamp(settings[key] + d, min, max);
      saveSettings();
    };
    const cycleCrate = (d) => {
      const i = CRATE_RATES.findIndex((r) => r.id === settings.crateRate);
      settings.crateRate = CRATE_RATES[(i + d + CRATE_RATES.length) % CRATE_RATES.length].id;
      saveSettings();
    };
    const botLevels = Object.keys(BOT_LEVELS);
    const cycleBot = (d) => {
      const i = botLevels.indexOf(settings.botLevel);
      settings.botLevel = botLevels[(i + d + botLevels.length) % botLevels.length];
      saveSettings();
    };
    const crateLabel = () => (CRATE_RATES.find((r) => r.id === settings.crateRate) || CRATE_RATES[1]).label;
    const nameItem = (i) => ({
      text: () => {
        const editing = this.editingName === i;
        const caret = editing && Math.floor(this.time.now / 400) % 2 === 0 ? '_' : ' ';
        return `${i + 1}. OYUNCU:  ${settings.names[i]}${editing ? caret : ''}`;
      },
      onSelect: () => this.startEditing(i),
    });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 112, [
      { text: () => `CAN:  ‹ ${settings.lives} ›`, onLeft: () => step('lives', -1), onRight: () => step('lives', 1) },
      { text: () => `BOMBA (HER CANDA):  ‹ ${settings.bombs} ›`, onLeft: () => step('bombs', -1), onRight: () => step('bombs', 1) },
      { text: () => `SİLAH KUTUSU:  ‹ ${crateLabel()} ›`, onLeft: () => cycleCrate(-1), onRight: () => cycleCrate(1) },
      { text: () => `BOT ZORLUĞU:  ‹ ${BOT_LEVELS[settings.botLevel].label} ›`, onLeft: () => cycleBot(-1), onRight: () => cycleBot(1) },
      nameItem(0),
      nameItem(1),
      nameItem(2),
      nameItem(3),
      { text: () => 'VARSAYILANA DÖN', onSelect: () => resetSettings() },
      { text: () => 'GERİ', onSelect: () => this.scene.start('MenuScene') },
    ], { spacing: 36, fontSize: 21 });

    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', stroke: '#2b1a0c', strokeThickness: 4,
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown', this.onNameKey, this);
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.editingName < 0) this.scene.start('MenuScene');
    });
  }

  update() {
    this.hint.setText(this.editingName >= 0
      ? 'İsmi yaz  •  Enter: kaydet  •  Esc: vazgeç'
      : '↑ ↓ seç  •  ← → değiştir  •  Enter: isim düzenle  •  Esc: geri');
    if (this.editingName >= 0) this.menu.refresh(); // yanıp sönen imleç
  }

  startEditing(i) {
    this.editingName = i;
    this.nameBackup = settings.names[i];
    this.menu.locked = true;
    this.editStartedAt = performance.now(); // düzenlemeyi başlatan Enter'ı yok saymak için
  }

  stopEditing(save) {
    const i = this.editingName;
    if (!save) settings.names[i] = this.nameBackup;
    if (!settings.names[i].trim()) settings.names[i] = this.nameBackup || `Oyuncu ${i + 1}`;
    settings.names[i] = settings.names[i].trim();
    saveSettings();
    // Aynı Enter basışı menüyü tekrar tetiklemesin diye kilidi bir kare sonra aç
    this.time.delayedCall(0, () => { this.menu.locked = false; this.editingName = -1; this.menu.refresh(); });
  }

  onNameKey(e) {
    if (this.editingName < 0 || !this.menu.locked || e.timeStamp <= this.editStartedAt) return;
    const i = this.editingName;
    if (e.key === 'Enter') this.stopEditing(true);
    else if (e.key === 'Escape') this.stopEditing(false);
    else if (e.key === 'Backspace') settings.names[i] = settings.names[i].slice(0, -1);
    else if (e.key.length === 1 && settings.names[i].length < LIMITS.nameLength) settings.names[i] += e.key;
    this.menu.refresh();
  }
}
