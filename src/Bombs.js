import {
  GAME_HEIGHT,
  BOMB_THROW_X, BOMB_THROW_Y, BOMB_BOUNCE, BOMB_FUSE_MS,
  BOMB_RADIUS, BOMB_FORCE, BOMB_LIFT,
} from './config.js';

function makeBombTexture(scene) {
  if (scene.textures.exists('bomb')) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x1b1b1b, 1);
  g.fillCircle(8, 10, 7);
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(5, 7, 2);
  g.fillStyle(0x6b4a2a, 1);
  g.fillRect(7, 0, 3, 4); // fitil
  g.generateTexture('bomb', 16, 17);
  g.destroy();
}

// Atılan, sekip kısa süre sonra patlayan ve alandaki herkesi savuran bombalar
export default class Bombs {
  constructor(scene, platforms, players) {
    this.scene = scene;
    this.players = players;
    makeBombTexture(scene);

    this.group = scene.physics.add.group();
    // Tek yönlü masa: bomba da aşağıdan geçer, üstüne düşerken çarpar
    scene.physics.add.collider(this.group, platforms, null, (bomb, plat) => {
      const b = bomb.body;
      return b.velocity.y >= 0 && b.prev.y + b.height <= plat.body.top + 1;
    });
  }

  throw(player) {
    const { x, y } = player.muzzle;
    const bomb = this.group.create(x, y - 6, 'bomb').setDepth(5);
    bomb.body.setCircle(7, 1, 3);
    bomb.body.setBounce(BOMB_BOUNCE);
    bomb.body.setVelocity(
      player.facing * BOMB_THROW_X + player.sprite.body.velocity.x * 0.5,
      -BOMB_THROW_Y,
    );
    bomb.body.setAngularVelocity(player.facing * 360);
    bomb.owner = player;
    bomb.explodeAt = this.scene.time.now + BOMB_FUSE_MS;
  }

  update(time) {
    this.group.getChildren().slice().forEach((b) => {
      if (b.y > GAME_HEIGHT + 50) {
        b.destroy();
        return;
      }
      // Yerde sürtünme
      if (b.body.blocked.down || b.body.touching.down) {
        b.body.setVelocityX(b.body.velocity.x * 0.85);
        b.body.setAngularVelocity(b.body.angularVelocity * 0.9);
      }
      // Fitil bitmeye yaklaştıkça hızlanan kırmızı yanıp sönme
      const left = b.explodeAt - time;
      const period = left < 500 ? 60 : 160;
      if (Math.floor(time / period) % 2 === 0) b.setTintFill(0xff3a1a);
      else b.clearTint();

      if (left <= 0) this.explode(b);
    });
  }

  explode(bomb) {
    const { x, y, owner } = bomb;
    bomb.destroy();
    this.explodeAt(x, y, owner);
  }

  // Patlama: bomba ve roketler kullanır
  explodeAt(x, y, owner, { radius = BOMB_RADIUS, force = BOMB_FORCE, lift = BOMB_LIFT } = {}) {
    const s = this.scene;

    // Alandaki oyuncuları merkezden dışarı savur (atan dahil)
    this.players.forEach((p) => {
      if (p.state !== 'alive') return;
      const dx = p.sprite.x - x;
      const dy = p.sprite.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) return;
      const falloff = 1 - (dist / radius) * 0.5; // kenarda yarı güç
      // Her zaman yana savurur (tam üstteyse rastgele yön) + hafif yukarı kaldırır
      const dirX = Math.abs(dx) > 2 ? Math.sign(dx) : (Math.random() < 0.5 ? -1 : 1);
      if (p.blast(dirX * force * falloff, -lift * falloff, owner) && owner !== p) {
        s.registerHit(owner, p);
      }
    });

    // Görsel: büyüyen halka + parçacık + sarsıntı
    const ring = s.add.circle(x, y, radius, 0xffa21a, 0.5).setDepth(9).setScale(0.1);
    ring.setStrokeStyle(4, 0xfff0a0, 1);
    s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 280, ease: 'Cubic.out', onComplete: () => ring.destroy() });
    const core = s.add.circle(x, y, 26, 0xfff6c8, 1).setDepth(9);
    s.tweens.add({ targets: core, scale: 1.8, alpha: 0, duration: 180, onComplete: () => core.destroy() });
    s.sparks.explode(30, x, y);
    s.cameras.main.shake(160, 0.008);
  }
}
