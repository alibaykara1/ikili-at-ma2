import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

const CARD_W = 190;
const CARD_H = 58;
const GAP = 14;
const FONT = 'Arial Black, Arial';

// Alt kenarda her oyuncu için bir kart: yüz, isim, LIVES, silah ve mermi
export default class HUD {
  constructor(scene, players) {
    this.scene = scene;
    const totalW = players.length * CARD_W + (players.length - 1) * GAP;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = GAME_HEIGHT - CARD_H - 6;

    this.cards = players.map((p, i) => this.makeCard(p, startX + i * (CARD_W + GAP), y));
  }

  makeCard(player, x, y) {
    const s = this.scene;
    const c = s.add.container(x, y).setDepth(20);

    const bg = s.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(3, 4, CARD_W, CARD_H, 6);
    bg.fillStyle(0xfdf8ee, 1);
    bg.lineStyle(3, 0x2b1a0c, 1);
    bg.fillRoundedRect(0, 0, CARD_W, CARD_H, 6);
    bg.strokeRoundedRect(0, 0, CARD_W, CARD_H, 6);
    // Yüz kutusu
    bg.fillStyle(player.def.color, 0.35);
    bg.fillRoundedRect(6, 6, 46, 46, 4);

    const face = s.add.image(29, 30, player.texKey).setScale(1.2);
    const name = s.add.text(58, 5, player.name, { fontFamily: FONT, fontSize: '13px', color: '#2b1a0c' });
    // Uzun isim bomba sayısına taşmasın: sığana kadar küçült
    const maxNameW = CARD_W - 58 - 62;
    if (name.width > maxNameW) name.setScale(maxNameW / name.width).setY(5 + (1 - maxNameW / name.width) * 7);
    const livesLabel = s.add.text(58, 24, 'LIVES:', { fontFamily: FONT, fontSize: '10px', color: '#2b1a0c' });
    const lives = s.add.text(60, 33, '', {
      fontFamily: FONT, fontSize: '20px', color: '#d8261b', stroke: '#2b1a0c', strokeThickness: 2,
    });
    const ammo = s.add.text(CARD_W - 8, 22, '', {
      fontFamily: FONT, fontSize: '13px', color: '#c46a00',
    }).setOrigin(1, 0);
    const weapon = s.add.text(CARD_W - 8, 40, '', {
      fontFamily: FONT, fontSize: '9px', color: '#2b1a0c',
    }).setOrigin(1, 0);

    // Bomba sayısı (küçük bomba simgesi + adet)
    const bombIcon = s.add.image(CARD_W - 36, 12, 'bomb').setScale(0.75);
    const bombs = s.add.text(CARD_W - 8, 5, '', { fontFamily: FONT, fontSize: '11px', color: '#2b1a0c' }).setOrigin(1, 0);

    c.add([bg, face, name, livesLabel, lives, ammo, weapon, bombIcon, bombs]);

    // Can 1 kalınca kartın üstünde çıkan yazı
    const lastLife = s.add.text(x + 4, y - 4, 'LAST LIFE', {
      fontFamily: FONT, fontSize: '18px', color: '#e8231a', stroke: '#2b1a0c', strokeThickness: 4,
    }).setOrigin(0, 1).setDepth(20).setVisible(false);

    return { player, container: c, lives, ammo, weapon, bombs, lastLife, shownLastLife: false };
  }

  update() {
    this.cards.forEach((card) => {
      const p = card.player;
      card.lives.setText(String(Math.max(0, p.lives)));
      card.weapon.setText(p.weapon.name.toUpperCase());
      card.ammo.setText(p.ammo === Infinity ? '∞' : String(p.ammo));
      card.bombs.setText(`x${p.bombs}`);

      if (p.lives === 1 && !card.shownLastLife) {
        card.shownLastLife = true;
        card.lastLife.setVisible(true).setScale(2).setAlpha(0);
        this.scene.tweens.add({ targets: card.lastLife, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });
      }
      if (p.state === 'out') {
        card.container.setAlpha(0.45);
        card.lastLife.setVisible(false);
      }
    });
  }
}
