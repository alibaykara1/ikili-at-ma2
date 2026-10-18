// Haritalar veri olarak tanımlanır.
// platforms: x, y = masanın sol üst köşesi, w = genişlik. Bacaklar otomatik hesaplanır.
// spawns: maç başında 1-4. oyuncunun doğduğu yerler
// respawnPoints: düşen savaşçının yeniden doğduğu noktalar (rastgele biri seçilir)
// theme: arka plan renkleri (background.js)

export const MAPS = {
  desert: {
    name: 'Çöl Masaları',
    platforms: [
      { x: 290, y: 170, w: 380 }, // üst kat
      { x: 50, y: 285, w: 300 },  // orta sol
      { x: 610, y: 285, w: 300 }, // orta sağ
      { x: 190, y: 395, w: 580 }, // alt kat
    ],
    spawns: [{ x: 380, y: 120 }, { x: 580, y: 120 }, { x: 180, y: 240 }, { x: 780, y: 240 }],
    respawnPoints: [{ x: 400, y: 60 }, { x: 560, y: 60 }],
    theme: {
      sky: [0xfbe3a0, 0xf0b552], sun: { color: 0xfff4c8, x: 780, y: 90, r: 46 },
      hills: [0xe2a248, 0xd18b33, 0xb8722a], cactus: 0x8a5a22, stars: false,
    },
  },

  canyon: {
    name: 'Kanyon Köprüsü',
    platforms: [
      { x: 370, y: 140, w: 220 }, // tepe
      { x: 60, y: 210, w: 220 },  // sol balkon
      { x: 680, y: 210, w: 220 }, // sağ balkon
      { x: 120, y: 330, w: 720 }, // uzun köprü
    ],
    spawns: [{ x: 300, y: 280 }, { x: 660, y: 280 }, { x: 170, y: 160 }, { x: 790, y: 160 }],
    respawnPoints: [{ x: 440, y: 50 }, { x: 520, y: 50 }],
    theme: {
      sky: [0xf7a35c, 0xc4513a], sun: { color: 0xffd27a, x: 480, y: 250, r: 70 },
      hills: [0xa8442f, 0x8a3526, 0x6b2a1f], cactus: 0x4a1c14, stars: false,
    },
  },

  towers: {
    name: 'Gece Kuleleri',
    platforms: [
      { x: 400, y: 150, w: 160 }, // tepe
      { x: 150, y: 230, w: 180 }, // sol üst
      { x: 630, y: 230, w: 180 }, // sağ üst
      { x: 360, y: 300, w: 240 }, // orta
      { x: 80, y: 380, w: 260 },  // sol alt
      { x: 620, y: 380, w: 260 }, // sağ alt
    ],
    spawns: [{ x: 210, y: 330 }, { x: 750, y: 330 }, { x: 240, y: 180 }, { x: 720, y: 180 }],
    respawnPoints: [{ x: 450, y: 70 }, { x: 510, y: 70 }],
    theme: {
      sky: [0x1d2340, 0x3b3f6b], sun: { color: 0xf2f0d8, x: 820, y: 80, r: 34 },
      hills: [0x2e3156, 0x262848, 0x1d1f3a], cactus: 0x15162b, stars: true,
    },
  },
};

export const MAP_IDS = Object.keys(MAPS);
