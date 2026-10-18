import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT,
  PLATFORM_THICKNESS, LEG_WIDTH, LEG_INSET, PLAYERS,
  COMBO_WINDOW_MS, KILL_CREDIT_MS, BOT_LEVELS,
} from '../config.js';
import { settings } from '../settings.js';
import { MAPS } from '../maps.js';
import Player from '../Player.js';
import HUD from '../HUD.js';
import Crates from '../Crates.js';
import Bombs from '../Bombs.js';
import KillFeed from '../KillFeed.js';
import { drawDesertBackground } from '../background.js';

const FONT = 'Arial Black, Arial';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // data.slots: her yuva için 'human' | 'easy' | 'normal' | 'hard' | 'off'
  // data.mapId: harita (yoksa ayarlardaki son seçilen)
  create(data) {
    this.startData = {
      slots: data?.slots || ['human', 'human'],
      mapId: data?.mapId || settings.mapId,
    };
    this.map = MAPS[this.startData.mapId] || MAPS.desert;

    drawDesertBackground(this, this.map.theme);
    this.platforms = this.buildPlatforms(this.map.platforms);

    // Oyuncular
    this.players = this.buildRoster().map((def, i) => new Player(this, def, i));
    this.players.forEach((p) => {
      this.physics.add.collider(p.sprite, this.platforms, null, (_s, plat) => p.canLandOn(plat));
    });

    // Mermiler masalardan geçer, sadece oyunculara çarpar
    this.bullets = this.physics.add.group({ allowGravity: false });
    this.players.forEach((p) => {
      this.physics.add.overlap(p.sprite, this.bullets, (_s, bullet) => this.onBulletHit(p, bullet));
    });

    // Vuruş kıvılcımları
    this.makeSparkTexture();
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 240 },
      lifespan: { min: 180, max: 380 },
      scale: { start: 1, end: 0 },
      tint: [0xc81d11, 0xff5a1f, 0xffb21a],
      gravityY: 700,
      emitting: false,
    }).setDepth(10);

    this.crates = new Crates(this, this.platforms, this.players);
    this.bombs = new Bombs(this, this.platforms, this.players);
    this.hud = new HUD(this, this.players);
    this.killFeed = new KillFeed(this);
    this.gameOver = false;

    // ESC: ana menüye dön
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

    // F1: fizik gövdelerini göster/gizle
    this.input.keyboard.on('keydown-F1', (e) => {
      e.preventDefault();
      this.toggleDebug();
    });
  }

  update(time, delta) {
    this.players.forEach((p) => p.update(time, delta));

    // Ekrandan çıkan ya da menzilini aşan mermileri temizle
    this.bullets.getChildren().slice().forEach((b) => {
      const outOfRange = Math.abs(b.x - b.startX) > b.range;
      if (outOfRange || b.x < -50 || b.x > GAME_WIDTH + 50 || b.y < -50 || b.y > GAME_HEIGHT + 50) {
        if (b.explosive && outOfRange) this.bombs.explodeAt(b.x, b.y, b.owner, b.explosive);
        b.destroy();
      }
    });

    this.crates.update(time);
    this.bombs.update(time);
    this.hud.update();
  }

  // --- Combo: aynı saldırganın art arda vuruşları ---
  registerHit(attacker, victim) {
    const now = this.time.now;
    if (now - (attacker.comboLastAt || 0) > COMBO_WINDOW_MS) attacker.comboCount = 0;
    attacker.comboCount = (attacker.comboCount || 0) + 1;
    attacker.comboLastAt = now;

    const n = attacker.comboCount;
    const msg = n === 1 ? 'HIT' : `${n} HITS`;
    const size = Math.min(26 + n * 3, 48);
    const x = victim.sprite.x + Phaser.Math.Between(-12, 12);
    const y = victim.sprite.y - 40;
    const t = this.add.text(x, y, msg, {
      fontFamily: FONT, fontSize: `${size}px`, color: '#ff9a1f', stroke: '#5a2a00', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(24).setAngle(Phaser.Math.Between(-10, 10)).setScale(1.8).setAlpha(0);
    this.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1, alpha: 1, duration: 140, ease: 'Back.out' },
        { y: y - 26, alpha: 0, delay: 450, duration: 400 },
      ],
      onComplete: () => t.destroy(),
    });
  }

  // Bir noktadan yukarı süzülüp kaybolan küçük yazı (silah adı vb.)
  popText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, {
      fontFamily: FONT, fontSize: '14px', color, stroke: '#2b1a0c', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(22);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 500, duration: 600, onComplete: () => t.destroy() });
  }

  // Bu maçtaki savaşçılar: her açık yuva insan ya da bot olur.
  // Aynı seviyeden birden fazla bot "Hard AI", "Hard AI 2" diye adlanır.
  buildRoster() {
    const botCount = {};
    const roster = [];
    this.startData.slots.forEach((slot, i) => {
      if (!slot || slot === 'off' || !PLAYERS[i]) return;
      const base = { ...PLAYERS[i], spawn: this.map.spawns[i] };
      if (slot === 'human') {
        roster.push({ ...base, name: settings.names[i] || base.name, keys: settings.keys[i] });
      } else {
        const lv = BOT_LEVELS[slot] || BOT_LEVELS.normal;
        botCount[slot] = (botCount[slot] || 0) + 1;
        const name = botCount[slot] > 1 ? `${lv.name} ${botCount[slot]}` : lv.name;
        roster.push({ ...base, keys: null, name, bot: slot });
      }
    });
    return roster;
  }

  // --- Can kaybı ve oyun sonu ---
  onPlayerFell(player) {
    // Yakın zamanda vuran rakip varsa öldüren o sayılır
    const recent = player.lastHitBy && this.time.now - player.lastHitAt < KILL_CREDIT_MS;
    this.killFeed.add(recent ? player.lastHitBy : null, player);

    if (player.lives === 1) this.flashText(`${player.name.toUpperCase()}\nLAST LIFE`, '#e8231a');
    if (player.state === 'out') this.flashText(`${player.name.toUpperCase()}\nELENDİ`, '#ffffff');

    const alive = this.players.filter((p) => p.state !== 'out');
    if (alive.length <= 1 && !this.gameOver) {
      // Aynı anda düşenleri de yakalamak için kısa bekle
      this.time.delayedCall(300, () => this.endGame());
    }
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.players.forEach((p) => { p.controlsEnabled = false; });

    const alive = this.players.filter((p) => p.state !== 'out');
    const title = alive.length === 1 ? `${alive[0].name.toUpperCase()} KAZANDI!` : 'BERABERE!';
    const color = alive.length === 1 ? `#${alive[0].def.color.toString(16).padStart(6, '0')}` : '#ffffff';

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setDepth(30);
    const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, title, {
      fontFamily: FONT, fontSize: '54px', color: '#ffffff', stroke: color, strokeThickness: 10,
    }).setOrigin(0.5).setDepth(31).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.out' });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'R: Tekrar oyna    ESC: Menü', {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(31);

    this.input.keyboard.once('keydown-R', () => this.scene.restart(this.startData));
  }

  // Ekranın ortasında kısa süre beliren büyük yazı
  flashText(msg, color) {
    const t = this.add.text(GAME_WIDTH / 2, 70, msg, {
      fontFamily: FONT, fontSize: '34px', color, stroke: '#2b1a0c', strokeThickness: 6, align: 'center',
    }).setOrigin(0.5).setDepth(25).setScale(1.6).setAlpha(0);
    this.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1, alpha: 1, duration: 250, ease: 'Back.out' },
        { alpha: 0, delay: 1100, duration: 300 },
      ],
      onComplete: () => t.destroy(),
    });
  }

  // --- Mermiler ---
  fireBullet(player) {
    const w = player.weapon;
    const { x, y } = player.muzzle;
    const texKey = `bullet-${w.id}`;
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(w.bulletColor, 1);
      g.fillRoundedRect(0, 0, w.bulletSize.w, w.bulletSize.h, w.bulletSize.h / 2);
      g.generateTexture(texKey, w.bulletSize.w, w.bulletSize.h);
      g.destroy();
    }

    this.shotCounter = (this.shotCounter || 0) + 1; // pompalı saçmaları tek vuruş sayılsın
    for (let i = 0; i < w.pellets; i++) {
      const bullet = this.bullets.create(x, y, texKey).setDepth(5);
      const angle = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-w.spread, w.spread));
      bullet.body.setVelocity(
        Math.cos(angle) * w.bulletSpeed * player.facing,
        Math.sin(angle) * w.bulletSpeed,
      );
      bullet.setRotation(angle * player.facing).setFlipX(player.facing < 0);
      bullet.owner = player;
      bullet.knockback = w.knockback;
      bullet.startX = x;
      bullet.range = w.range;
      bullet.shotId = this.shotCounter;
      bullet.explosive = w.explosive || null;
    }

    // Namlu parlaması
    const flash = this.add.circle(x, y, 6, 0xfff3b0).setDepth(6);
    this.tweens.add({ targets: flash, scale: 0.2, alpha: 0, duration: 80, onComplete: () => flash.destroy() });
  }

  onBulletHit(player, bullet) {
    if (bullet.owner === player || !bullet.active || player.state !== 'alive') return;
    // Roket: oyuncuya değince patlar (savurmayı patlama yapar)
    if (bullet.explosive) {
      this.bombs.explodeAt(bullet.x, bullet.y, bullet.owner, bullet.explosive);
      bullet.destroy();
      return;
    }
    const dir = Math.sign(bullet.body.velocity.x) || 1;
    if (!player.hit(dir, bullet.knockback, bullet.owner)) return; // kalkanlıysa mermi içinden geçer
    if (player.lastShotIdHit !== bullet.shotId) {
      player.lastShotIdHit = bullet.shotId;
      this.registerHit(bullet.owner, player);
    }
    this.sparks.explode(12, bullet.x, bullet.y);
    bullet.destroy();
  }

  makeSparkTexture() {
    if (this.textures.exists('spark')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('spark', 4, 4);
    g.destroy();
  }

  // --- Platformlar: ahşap masa görünümü + statik fizik gövdesi ---
  buildPlatforms(defs) {
    const group = this.physics.add.staticGroup();
    const legs = this.add.graphics();
    const tops = this.add.graphics();

    defs.forEach((p) => {
      // Bacaklar: altındaki ilk masaya kadar, yoksa ekran dışına iner
      [p.x + LEG_INSET, p.x + p.w - LEG_INSET - LEG_WIDTH].forEach((lx) => {
        const legTop = p.y + PLATFORM_THICKNESS;
        const legBottom = this.findSurfaceBelow(defs, lx + LEG_WIDTH / 2, legTop);
        legs.fillStyle(0x5b3517, 1);
        legs.fillRect(lx, legTop, LEG_WIDTH, legBottom - legTop);
        legs.fillStyle(0x7a4a22, 1);
        legs.fillRect(lx, legTop, 3, legBottom - legTop);
      });

      // Masa üstü
      tops.fillStyle(0x4a2a10, 1);
      tops.fillRect(p.x, p.y, p.w, PLATFORM_THICKNESS);
      tops.fillStyle(0x9a6430, 1);
      tops.fillRect(p.x, p.y, p.w, PLATFORM_THICKNESS - 4);
      tops.fillStyle(0xc28a4a, 1);
      tops.fillRect(p.x, p.y, p.w, 3);
      // Tahta çizgileri
      tops.fillStyle(0x7a4a22, 1);
      for (let x = p.x + 60; x < p.x + p.w - 20; x += 70) {
        tops.fillRect(x, p.y + 4, 2, PLATFORM_THICKNESS - 8);
      }

      // Görünmez fizik gövdesi (sadece masa üstü)
      const body = this.add.rectangle(
        p.x + p.w / 2, p.y + PLATFORM_THICKNESS / 2, p.w, PLATFORM_THICKNESS,
      );
      group.add(body);
    });

    return group;
  }

  findSurfaceBelow(defs, x, fromY) {
    let best = GAME_HEIGHT + 20;
    defs.forEach((o) => {
      if (o.y > fromY && o.y < best && x >= o.x && x <= o.x + o.w) best = o.y;
    });
    return best;
  }

  toggleDebug() {
    const world = this.physics.world;
    const wasOn = world.drawDebug;
    if (!world.debugGraphic) world.createDebugGraphic();
    world.drawDebug = !wasOn;
    world.debugGraphic.clear();
  }
}
