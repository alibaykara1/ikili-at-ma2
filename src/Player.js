import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, GROUND_ACCEL, AIR_ACCEL,
  JUMP_VELOCITY, MAX_JUMPS, JUMP_CUT, DROP_THROUGH_MS, MAX_FALL_SPEED,
  HIT_STUN_MS, BLAST_STUN_MS, KNOCKBACK_DECAY_GROUND, KNOCKBACK_DECAY_AIR, KNOCKBACK_LIFT, MAX_KNOCKBACK_SPEED,
  FALL_MARGIN, RESPAWN_DELAY_MS, RESPAWN_SHIELD_MS,
} from './config.js';
import { WEAPONS, STARTING_WEAPON } from './weapons.js';
import { KeyboardController, NO_INPUT } from './controllers.js';
import BotController from './Bot.js';
import { settings } from './settings.js';

const TEX_SIZE = 36;

// Silah dokusu: namlu + kabza (placeholder)
function makeGunTexture(scene, weapon) {
  const key = `gun-${weapon.id}`;
  if (scene.textures.exists(key)) return key;
  const { color, length, height } = weapon.gun;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(color, 1);
  g.fillRect(0, 0, length, height);
  g.fillRect(2, height - 1, 4, 5);
  g.fillStyle(0xffffff, 0.25);
  g.fillRect(0, 0, length, 1);
  g.generateTexture(key, length, height + 4);
  g.destroy();
  return key;
}

// Renkli, yuvarlak blob dokusunu bir kez üretir (placeholder görsel)
export function makeBlobTexture(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  const dark = Phaser.Display.Color.IntegerToColor(color).darken(30).color;
  const c = TEX_SIZE / 2;

  // Ayaklar
  g.fillStyle(dark, 1);
  g.fillEllipse(c - 7, TEX_SIZE - 3, 10, 6);
  g.fillEllipse(c + 7, TEX_SIZE - 3, 10, 6);
  // Gövde
  g.fillStyle(dark, 1);
  g.fillEllipse(c, c + 1, 30, 32);
  g.fillStyle(color, 1);
  g.fillEllipse(c, c, 26, 28);
  // Parlama
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(c - 6, c - 8, 8, 6);
  // Gözler (sağa bakıyor, flipX ile çevrilir)
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(c + 3, c - 3, 7, 9);
  g.fillEllipse(c + 10, c - 3, 6, 8);
  g.fillStyle(0x111111, 1);
  g.fillCircle(c + 5, c - 2, 2);
  g.fillCircle(c + 11, c - 2, 2);

  g.generateTexture(key, TEX_SIZE, TEX_SIZE);
  g.destroy();
}

export default class Player {
  constructor(scene, def, index) {
    this.scene = scene;
    this.def = def;
    this.index = index;
    this.name = def.name;
    this.jumpsLeft = MAX_JUMPS;
    this.dropUntil = 0;
    this.lives = settings.lives;
    this.state = 'alive'; // alive | dead (yeniden doğmayı bekliyor) | out (elendi)
    this.shieldUntil = 0;
    this.controlsEnabled = true;
    this.bombs = settings.bombs;

    const texKey = `blob-${def.color.toString(16)}`;
    this.texKey = texKey;
    makeBlobTexture(scene, texKey, def.color);

    this.sprite = scene.physics.add.sprite(def.spawn.x, def.spawn.y, texKey);
    this.sprite.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.sprite.body.setOffset((TEX_SIZE - PLAYER_WIDTH) / 2, TEX_SIZE - PLAYER_HEIGHT);
    this.sprite.body.setMaxVelocityY(MAX_FALL_SPEED);
    this.sprite.setFlipX(def.spawn.x > scene.scale.width / 2);

    const colorStr = `#${def.color.toString(16).padStart(6, '0')}`;
    this.nameText = scene.add.text(0, 0, this.name, {
      fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#ffffff',
      stroke: colorStr, strokeThickness: 4,
    }).setOrigin(0.5, 1);

    this.stunUntil = 0;
    this.moveVel = 0;  // yürüme hızı
    this.knockVel = 0; // savrulma hızı
    this.nextFireAt = 0;
    this.gun = scene.add.image(0, 0, '__DEFAULT');
    this.setWeapon(STARTING_WEAPON);

    // Yeniden doğunca çıkan mavi dokunulmazlık halkası
    this.shieldRing = scene.add.circle(0, 0, 24)
      .setStrokeStyle(3, 0x3fa9ff, 1)
      .setFillStyle(0x3fa9ff, 0.15)
      .setVisible(false)
      .setDepth(4);

    // Girdi kaynağı: klavye ya da bot
    this.controller = def.bot
      ? new BotController(scene, this, def.bot)
      : new KeyboardController(scene, def.keys);
  }

  get facing() {
    return this.sprite.flipX ? -1 : 1;
  }

  setWeapon(id) {
    this.weapon = WEAPONS[id];
    this.ammo = this.weapon.ammo;
    this.gun.setTexture(makeGunTexture(this.scene, this.weapon));
  }

  // Namlu ucunun dünya koordinatı
  get muzzle() {
    return {
      x: this.sprite.x + this.facing * (10 + this.weapon.gun.length),
      y: this.sprite.y + 4,
    };
  }

  get isShielded() {
    return this.scene.time.now < this.shieldUntil;
  }

  // Mermi isabeti: hasar yok, sadece savrulma. Kalkanlıyken etkilenmez.
  hit(dir, knockback, attacker) {
    if (this.isShielded) return false;
    const body = this.sprite.body;
    this.addKnockback(dir * knockback);
    body.setVelocityY(Math.min(body.velocity.y, -KNOCKBACK_LIFT));
    this.stunUntil = Math.max(this.stunUntil, this.scene.time.now + HIT_STUN_MS);
    this.rememberAttacker(attacker);

    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.sprite.clearTint());
    return true;
  }

  // Bomba patlaması: verilen hızla savrulma
  blast(vx, vy, attacker) {
    if (this.isShielded) return false;
    this.addKnockback(vx);
    this.sprite.body.setVelocityY(vy);
    this.stunUntil = Math.max(this.stunUntil, this.scene.time.now + BLAST_STUN_MS);
    this.rememberAttacker(attacker);
    return true;
  }

  // Savrulma hızı yürüme hızından ayrı tutulur; üst üste vuruşlar birikir
  addKnockback(vx) {
    this.knockVel = Phaser.Math.Clamp(this.knockVel + vx, -MAX_KNOCKBACK_SPEED, MAX_KNOCKBACK_SPEED);
  }

  // Düşerse öldüren olarak sayılacak son rakip (kendi bombası sayılmaz)
  rememberAttacker(attacker) {
    if (!attacker || attacker === this) return;
    this.lastHitBy = attacker;
    this.lastHitAt = this.scene.time.now;
  }

  // Tek yönlü masa: aşağıdan geçilir, sadece yukarıdan düşerken üstüne basılır
  canLandOn(platform) {
    if (this.scene.time.now < this.dropUntil) return false;
    const body = this.sprite.body;
    return body.velocity.y >= 0 && body.prev.y + body.height <= platform.body.top + 1;
  }

  get onGround() {
    const body = this.sprite.body;
    return body.blocked.down || body.touching.down;
  }

  update(time, delta) {
    if (this.state !== 'alive') return;

    // Boşluğa düştü
    if (this.sprite.y > GAME_HEIGHT + FALL_MARGIN) {
      this.fall();
      return;
    }

    const body = this.sprite.body;
    const dt = delta / 1000;
    const onGround = this.onGround;
    // Bu karenin girdisi (kontrol kapalıysa hiçbir şeye basılmamış sayılır)
    const inp = this.controlsEnabled ? this.controller.read(time) : NO_INPUT;

    if (onGround) this.jumpsLeft = MAX_JUMPS;

    // Yatay hız = yürüme + savrulma. Sersemken yön tuşları çalışmaz.
    const stunned = time < this.stunUntil;
    const dir = stunned ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const t = Math.min(1, (onGround ? GROUND_ACCEL : AIR_ACCEL) * dt);
    this.moveVel = Phaser.Math.Linear(this.moveVel, dir * PLAYER_SPEED, t);
    this.knockVel *= Math.exp(-(onGround ? KNOCKBACK_DECAY_GROUND : KNOCKBACK_DECAY_AIR) * dt);
    if (Math.abs(this.knockVel) < 5) this.knockVel = 0;
    body.setVelocityX(this.moveVel + this.knockVel);
    if (dir !== 0) this.sprite.setFlipX(dir < 0);
    else if (inp.face) this.sprite.setFlipX(inp.face < 0);

    // Zıplama (havada bir kez daha zıplanabilir)
    if (inp.jump && this.jumpsLeft > 0) {
      if (!onGround && this.jumpsLeft === MAX_JUMPS) this.jumpsLeft--; // kenardan düşerken ilk zıplama hakkı gider
      if (this.jumpsLeft > 0) {
        body.setVelocityY(-JUMP_VELOCITY);
        this.jumpsLeft--;
      }
    }
    // Tuş erken bırakılırsa daha alçak zıpla
    if (inp.jumpReleased && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * JUMP_CUT);
    }

    // Aşağı: bulunduğu masadan aşağı in
    if (inp.drop && onGround) {
      this.dropUntil = time + DROP_THROUGH_MS;
    }

    // Ateş (basılı tutunca silahın hızında seri atar)
    if (inp.fire && time >= this.nextFireAt && this.ammo > 0) {
      this.nextFireAt = time + this.weapon.fireRate;
      this.ammo--;
      this.scene.fireBullet(this);
      this.addKnockback(-this.facing * this.weapon.recoil);
      // Mermi bitince başlangıç silahına dön
      if (this.ammo <= 0) this.setWeapon(STARTING_WEAPON);
    }

    // Bomba
    if (inp.bomb && this.bombs > 0) {
      this.bombs--;
      this.scene.bombs.throw(this);
    }

    this.nameText.setPosition(this.sprite.x, this.sprite.y - TEX_SIZE / 2 - 2);
    this.gun
      .setPosition(this.sprite.x + this.facing * 8, this.sprite.y + 4)
      .setOrigin(this.sprite.flipX ? 1 : 0, 0.3)
      .setFlipX(this.sprite.flipX);

    // Kalkan halkası: biterken yanıp söner
    const shieldLeft = this.shieldUntil - time;
    this.shieldRing.setVisible(shieldLeft > 0 && (shieldLeft > 500 || Math.floor(time / 80) % 2 === 0));
    this.shieldRing.setPosition(this.sprite.x, this.sprite.y + 1);
  }

  // Boşluğa düşünce 1 can gider; can kalmadıysa elenir
  fall() {
    this.lives--;
    this.setVisible(false);
    this.sprite.body.enable = false;

    if (this.lives <= 0) {
      this.state = 'out';
    } else {
      this.state = 'dead';
      this.scene.time.delayedCall(RESPAWN_DELAY_MS, () => this.respawn());
    }
    this.scene.onPlayerFell(this);
  }

  respawn() {
    const points = this.scene.map.respawnPoints;
    const p = Phaser.Utils.Array.GetRandom(points);
    this.sprite.setPosition(p.x, p.y);
    this.sprite.body.enable = true;
    this.sprite.body.reset(p.x, p.y);
    this.stunUntil = 0;
    this.moveVel = 0;
    this.knockVel = 0;
    this.lastHitBy = null;
    this.jumpsLeft = MAX_JUMPS;
    this.setWeapon(STARTING_WEAPON);
    this.bombs = settings.bombs;
    this.shieldUntil = this.scene.time.now + RESPAWN_SHIELD_MS;
    this.state = 'alive';
    this.setVisible(true);
  }

  setVisible(v) {
    [this.sprite, this.gun, this.nameText].forEach((o) => o.setVisible(v));
    if (!v) this.shieldRing.setVisible(false);
  }
}
