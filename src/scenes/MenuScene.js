import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYERS, BOT_LEVELS } from '../config.js';
import { settings, saveSettings } from '../settings.js';
import { drawDesertBackground } from '../background.js';
import { makeBlobTexture } from '../Player.js';
import { MenuList, dimOverlay, keyLabel, FONT } from '../ui.js';

const toCss = (c) => `#${c.toString(16).padStart(6, '0')}`;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    drawDesertBackground(this);
    dimOverlay(this, 0.3);

    // Başlık
    const title = this.add.text(GAME_WIDTH / 2, 80, 'İKİLİ ÇATIŞMA 2', {
      fontFamily: FONT, fontSize: '60px', color: '#ffb21a', stroke: '#2b1a0c', strokeThickness: 10,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.text(GAME_WIDTH / 2, 130, 'KLON', {
      fontFamily: FONT, fontSize: '16px', color: '#ffffff', stroke: '#2b1a0c', strokeThickness: 5,
    }).setOrigin(0.5);

    // Süs: iki savaşçı zıplayıp duruyor
    PLAYERS.slice(0, 2).forEach((def, i) => {
      const key = `blob-${def.color.toString(16)}`;
      makeBlobTexture(this, key, def.color);
      const x = i === 0 ? 150 : GAME_WIDTH - 150;
      const blob = this.add.image(x, 300, key).setScale(3).setFlipX(i === 1);
      this.tweens.add({ targets: blob, y: 270, duration: 450, yoyo: true, repeat: -1, ease: 'Quad.out', delay: i * 225 });
      this.add.text(x, 350, settings.names[i], {
        fontFamily: FONT, fontSize: '16px', color: '#ffffff', stroke: toCss(def.color), strokeThickness: 5,
      }).setOrigin(0.5);
    });

    // Bot zorluğu menüden de ‹ › ile değişir
    const levels = Object.keys(BOT_LEVELS);
    const cycleLevel = (d) => {
      const i = levels.indexOf(settings.botLevel);
      settings.botLevel = levels[(i + d + levels.length) % levels.length];
      saveSettings();
    };
    const play = (slots) => this.scene.start('GameScene', { slots, mapId: settings.mapId });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 180, [
      { text: () => '2 OYUNCU', onSelect: () => play(['human', 'human']) },
      {
        text: () => `BOTA KARŞI  ‹ ${BOT_LEVELS[settings.botLevel].label} ›`,
        onSelect: () => play(['human', settings.botLevel]),
        onLeft: () => cycleLevel(-1),
        onRight: () => cycleLevel(1),
      },
      { text: () => 'ÖZEL MAÇ (2-4 KİŞİ)', onSelect: () => this.scene.start('MatchScene') },
      { text: () => 'AYARLAR', onSelect: () => this.scene.start('SettingsScene') },
      { text: () => 'TUŞLAR', onSelect: () => this.scene.start('ControlsScene') },
    ], { spacing: 46, fontSize: 28 });

    this.drawControls();
  }

  // Alt kısımda 1. ve 2. oyuncunun tuş tablosu
  drawControls() {
    const y = GAME_HEIGHT - 104;
    const box = this.add.graphics();
    box.fillStyle(0xfdf8ee, 0.92);
    box.lineStyle(3, 0x2b1a0c, 1);
    box.fillRoundedRect(GAME_WIDTH / 2 - 270, y, 540, 92, 8);
    box.strokeRoundedRect(GAME_WIDTH / 2 - 270, y, 540, 92, 8);

    const k = settings.keys;
    const pair = (i, a, b) => `${keyLabel(k[i][a])} / ${keyLabel(k[i][b])}`;
    const rows = [
      ['', settings.names[0], settings.names[1]],
      ['Sola / Sağa', pair(0, 'left', 'right'), pair(1, 'left', 'right')],
      ['Zıpla / İn', pair(0, 'jump', 'down'), pair(1, 'jump', 'down')],
      ['Ateş / Bomba', pair(0, 'fire', 'bomb'), pair(1, 'fire', 'bomb')],
    ];
    const cols = [GAME_WIDTH / 2 - 175, GAME_WIDTH / 2 + 10, GAME_WIDTH / 2 + 170];
    rows.forEach((row, r) => {
      row.forEach((cell, c) => {
        this.add.text(cols[c], y + 12 + r * 19, cell, {
          fontFamily: r === 0 || c === 0 ? FONT : 'Arial', fontSize: '13px',
          color: r === 0 && c > 0 ? toCss(PLAYERS[c - 1].color) : '#2b1a0c',
        }).setOrigin(0.5, 0);
      });
    });
  }
}
