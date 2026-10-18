import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  CRATE_FIRST_MS, MAX_CRATES, CRATE_LIFETIME_MS, CRATE_SIZE,
} from './config.js';
import { WEAPONS, CRATE_WEAPONS } from './weapons.js';
import { crateIntervalMs } from './settings.js';

function makeCrateTexture(scene) {
  if (scene.textures.exists('crate')) return;
  const s = CRATE_SIZE;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x4a2a10, 1);
  g.fillRect(0, 0, s, s);
  g.fillStyle(0xb57a3a, 1);
  g.fillRect(2, 2, s - 4, s - 4);
  // Çapraz tahtalar
  g.lineStyle(3, 0x7a4a22, 1);
  g.lineBetween(3, 3, s - 3, s - 3);
  g.lineBetween(s - 3, 3, 3, s - 3);
  // Ortada sarı işaret
  g.fillStyle(0xffd23a, 1);
  g.fillCircle(s / 2, s / 2, 4);
  g.generateTexture('crate', s, s);
  g.destroy();
}

// Yukarıdan düşen, içinden rastgele silah çıkan kutular
export default class Crates {
  constructor(scene, platforms, players) {
    this.scene = scene;
    makeCrateTexture(scene);

    this.group = scene.physics.add.group();
    scene.physics.add.collider(this.group, platforms);
    players.forEach((p) => {
      scene.physics.add.overlap(p.sprite, this.group, (_s, crate) => this.pickUp(p, crate));
    });

    scene.time.delayedCall(CRATE_FIRST_MS, () => this.spawn());
    scene.time.addEvent({ delay: crateIntervalMs(), loop: true, callback: () => this.spawn() });
  }

  spawn() {
    if (this.scene.gameOver || this.group.countActive() >= MAX_CRATES) return;
    const plat = Phaser.Utils.Array.GetRandom(this.scene.map.platforms);
    const x = Phaser.Math.Between(plat.x + 20, plat.x + plat.w - 20);
    const crate = this.group.create(x, -CRATE_SIZE, 'crate').setDepth(3);
    crate.body.setMaxVelocityY(450);
    crate.spawnedAt = this.scene.time.now;
  }

  pickUp(player, crate) {
    if (player.state !== 'alive' || !crate.active) return;
    const id = Phaser.Utils.Array.GetRandom(CRATE_WEAPONS);
    player.setWeapon(id);
    this.scene.popText(player.sprite.x, player.sprite.y - 44, WEAPONS[id].name.toUpperCase(), '#ffd23a');
    crate.destroy();
  }

  update(time) {
    this.group.getChildren().slice().forEach((c) => {
      const age = time - c.spawnedAt;
      if (c.y > GAME_HEIGHT + 50 || age > CRATE_LIFETIME_MS) {
        c.destroy();
        return;
      }
      // Kaybolmadan önce son 2 sn yanıp söner
      c.setAlpha(age > CRATE_LIFETIME_MS - 2000 && Math.floor(time / 120) % 2 === 0 ? 0.3 : 1);
    });
  }
}
