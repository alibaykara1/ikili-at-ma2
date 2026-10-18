import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYERS } from '../config.js';
import { MAPS, MAP_IDS } from '../maps.js';
import { settings, saveSettings, SLOT_TYPES } from '../settings.js';
import { drawDesertBackground } from '../background.js';
import { MenuList, dimOverlay, FONT } from '../ui.js';

// Özel maç: 4 yuvanın her biri oyuncu / bot / kapalı, harita seçimi
export default class MatchScene extends Phaser.Scene {
  constructor() {
    super('MatchScene');
  }

  create() {
    drawDesertBackground(this, MAPS[settings.mapId].theme);
    dimOverlay(this, 0.45);

    this.add.text(GAME_WIDTH / 2, 50, 'ÖZEL MAÇ', {
      fontFamily: FONT, fontSize: '42px', color: '#ffb21a', stroke: '#2b1a0c', strokeThickness: 8,
    }).setOrigin(0.5);

    const cycle = (list, current, d) => {
      const i = list.indexOf(current);
      return list[(i + d + list.length) % list.length];
    };
    const slotIds = SLOT_TYPES.map((s) => s.id);
    const slotLabel = (i) => SLOT_TYPES.find((s) => s.id === settings.slots[i]).label;
    const changeSlot = (i, d) => {
      settings.slots[i] = cycle(slotIds, settings.slots[i], d);
      saveSettings();
    };
    const changeMap = (d) => {
      settings.mapId = cycle(MAP_IDS, settings.mapId, d);
      saveSettings();
      this.scene.restart({ index: 4 }); // arka plan yeni haritanın temasına geçsin
    };

    const slotItem = (i) => ({
      text: () => `${i + 1}. YUVA:  ‹ ${slotLabel(i)} ›`,
      onLeft: () => changeSlot(i, -1),
      onRight: () => changeSlot(i, 1),
    });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 120, [
      slotItem(0), slotItem(1), slotItem(2), slotItem(3),
      {
        text: () => `HARİTA:  ‹ ${MAPS[settings.mapId].name.toUpperCase()} ›`,
        onLeft: () => changeMap(-1),
        onRight: () => changeMap(1),
      },
      { text: () => 'BAŞLA', onSelect: () => this.start() },
      { text: () => 'GERİ', onSelect: () => this.scene.start('MenuScene') },
    ], { spacing: 46, fontSize: 24 });
    if (this.scene.settings.data?.index) this.menu.select(this.scene.settings.data.index);

    // Her yuvanın solunda kendi rengi
    this.menu.texts.slice(0, 4).forEach((t, i) => {
      this.add.circle(GAME_WIDTH / 2 - 210, t.y, 10, PLAYERS[i].color).setStrokeStyle(3, 0x2b1a0c);
    });

    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', stroke: '#2b1a0c', strokeThickness: 4,
    }).setOrigin(0.5);
    this.showHint();

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  showHint(msg) {
    this.hint.setText(msg || '↑ ↓ seç  •  ← → değiştir  •  Esc: geri');
    this.hint.setColor(msg ? '#ffd23a' : '#ffffff');
  }

  start() {
    const active = settings.slots.filter((s) => s !== 'off').length;
    if (active < 2) {
      this.showHint('En az 2 yuva açık olmalı!');
      this.cameras.main.shake(120, 0.004);
      return;
    }
    this.scene.start('GameScene', { slots: [...settings.slots], mapId: settings.mapId });
  }
}

