import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { MAPS } from './maps.js';

// Kamera sarsılınca kenarda boşluk görünmesin diye arka plan ekrandan biraz taşar
const PAD = 24;

// Haritanın temasına göre arka plan: gökyüzü, güneş/ay, yıldızlar, katmanlı tepeler, kaktüsler
export function drawDesertBackground(scene, theme = MAPS.desert.theme) {
  const g = scene.add.graphics();

  // Gökyüzü geçişi
  const [top, bottom] = theme.sky;
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(-PAD, -PAD, GAME_WIDTH + PAD * 2, GAME_HEIGHT + PAD * 2);

  // Yıldızlar (sabit tohumla, her açılışta aynı yerde)
  if (theme.stars) {
    const rnd = new Phaser.Math.RandomDataGenerator(['yildiz']);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0xffffff, rnd.realInRange(0.3, 0.9));
      g.fillCircle(rnd.between(0, GAME_WIDTH), rnd.between(0, 300), rnd.realInRange(0.6, 1.6));
    }
  }

  // Güneş / ay
  const { sun } = theme;
  g.fillStyle(sun.color, 0.25);
  g.fillCircle(sun.x, sun.y, sun.r * 1.35);
  g.fillStyle(sun.color, 0.9);
  g.fillCircle(sun.x, sun.y, sun.r);

  // Uzak, orta ve yakın tepeler
  drawHills(g, theme.hills[0], 300, 60, 0.004, 0);
  drawHills(g, theme.hills[1], 360, 50, 0.007, 2);
  drawHills(g, theme.hills[2], 430, 40, 0.011, 5);

  // Birkaç kaktüs silueti
  g.fillStyle(theme.cactus, 1);
  [[120, 445], [470, 470], [860, 440]].forEach(([x, y]) => drawCactus(g, x, y));
  return g;
}

function drawHills(g, color, baseY, amp, freq, phase) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(-PAD, GAME_HEIGHT + PAD);
  for (let x = -PAD; x <= GAME_WIDTH + PAD; x += 10) {
    const y = baseY - Math.sin(x * freq + phase) * amp - Math.sin(x * freq * 2.3 + phase) * amp * 0.3;
    g.lineTo(x, y);
  }
  g.lineTo(GAME_WIDTH + PAD, GAME_HEIGHT + PAD);
  g.closePath();
  g.fillPath();
}

function drawCactus(g, x, y) {
  g.fillRoundedRect(x - 5, y - 40, 10, 40, 4);
  g.fillRoundedRect(x - 16, y - 28, 8, 16, 3);
  g.fillRoundedRect(x - 16, y - 16, 14, 6, 2);
  g.fillRoundedRect(x + 8, y - 34, 8, 18, 3);
  g.fillRoundedRect(x + 2, y - 20, 14, 6, 2);
}
