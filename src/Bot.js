import Phaser from 'phaser';
import { BOT_LEVELS, BOMB_RADIUS, JUMP_VELOCITY, GRAVITY } from './config.js';
import { STARTING_WEAPON } from './weapons.js';

const EDGE_PAD = 14;                                    // masa kenarına bu kadar içeriden yaklaş
const JUMP_HEIGHT = (JUMP_VELOCITY ** 2) / (2 * GRAVITY);
const MAX_CLIMB = JUMP_HEIGHT * 2 - 30;                 // çift zıplamayla çıkılabilecek yükseklik
const JUMP_COOLDOWN_MS = 180;

// --- Masa yardımcıları ---

// Ayağının altında duran masa (yerdeyken)
function platformAt(platforms, x, footY) {
  return platforms.find((p) => Math.abs(p.y - footY) <= 8 && x >= p.x - 4 && x <= p.x + p.w + 4) || null;
}

// Bu noktadan düşerse ilk değeceği masa
function platformBelow(platforms, x, footY) {
  let best = null;
  platforms.forEach((p) => {
    if (p.y >= footY - 6 && x >= p.x - 4 && x <= p.x + p.w + 4 && (!best || p.y < best.y)) best = p;
  });
  return best;
}

// Masalar arası geçiş grafiği: up (zıpla), drop (aşağı in), walk (kenardan yürü)
// minX..maxX: geçişe başlamak için durulması gereken aralık
function buildGraph(platforms) {
  return platforms.map((a) => {
    const edges = [];
    platforms.forEach((b, j) => {
      if (a === b) return;
      const lo = Math.max(a.x, b.x) + EDGE_PAD;
      const hi = Math.min(a.x + a.w, b.x + b.w) - EDGE_PAD;
      if (lo <= hi) {
        if (b.y < a.y && a.y - b.y <= MAX_CLIMB) edges.push({ to: j, type: 'up', minX: lo, maxX: hi });
        if (b.y > a.y) edges.push({ to: j, type: 'drop', minX: lo, maxX: hi });
      } else if (b.y > a.y) {
        if (b.x + b.w >= a.x - 60 && b.x <= a.x - 10) edges.push({ to: j, type: 'walk', minX: a.x - 40, maxX: a.x - 40 });
        if (b.x <= a.x + a.w + 60 && b.x + b.w >= a.x + a.w + 10) {
          edges.push({ to: j, type: 'walk', minX: a.x + a.w + 40, maxX: a.x + a.w + 40 });
        }
      }
    });
    return edges;
  });
}

// En kısa yolun ilk adımı
function firstStep(graph, from, to) {
  if (from === to) return null;
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    graph[cur].forEach((e) => {
      if (!prev.has(e.to)) {
        prev.set(e.to, { from: cur, edge: e });
        queue.push(e.to);
      }
    });
  }
  if (!prev.has(to)) return null;
  let step = prev.get(to);
  while (step.from !== from) step = prev.get(step.from);
  return step.edge;
}

// Bot: her kare savaşçıya klavye gibi girdi üretir
export default class BotController {
  constructor(scene, player, level) {
    this.scene = scene;
    this.me = player;
    this.lv = BOT_LEVELS[level] || BOT_LEVELS.normal;
    this.platforms = scene.map.platforms;
    this.graph = buildGraph(this.platforms);

    this.nextThinkAt = 0;
    this.jumpReadyAt = 0;
    this.goalX = null;
    this.action = null;      // up | drop | walk | null
    this.climbTo = null;     // çıkılmaya çalışılan masa
    this.target = null;
    this.wantFire = false;
    this.wantBomb = false;
    this.wantsCrateUntil = 0;
    this.nextBombAt = 0;
    this.recovering = false;
    this.recoverRoll = true;
  }

  read(time) {
    const me = this.me;
    const body = me.sprite.body;
    const footY = body.bottom;
    const onGround = me.onGround;
    const out = { left: false, right: false, jump: false, jumpReleased: false, drop: false, fire: false, bomb: false, face: 0 };

    // Yere indiği anda yeniden plan yap (eski "zıpla" planı tekrar tetiklenmesin)
    const landed = onGround && !this.wasOnGround;
    this.wasOnGround = onGround;
    if (landed || time >= this.nextThinkAt) {
      this.think(time);
      this.nextThinkAt = time + this.lv.reactionMs * Phaser.Math.FloatBetween(0.7, 1.3);
    }

    let dir = 0;
    const below = platformBelow(this.platforms, me.sprite.x, footY);

    if (!onGround && !below) {
      // --- Boşluğa düşüyor: en yakın masaya yönel, zıplama haklarını kullan ---
      if (!this.recovering) {
        this.recovering = true;
        this.recoverRoll = Math.random() < this.lv.recoverChance;
      }
      const safe = this.nearestPlatform(me.sprite.x, footY);
      if (safe && this.recoverRoll) {
        const tx = Phaser.Math.Clamp(me.sprite.x, safe.x + EDGE_PAD + 10, safe.x + safe.w - EDGE_PAD - 10);
        dir = Math.sign(tx - me.sprite.x);
        if (body.velocity.y > 40 && footY > safe.y - 40 && me.jumpsLeft > 0) out.jump = this.tryJump(time);
      }
    } else {
      if (onGround) this.recovering = false;
      dir = this.followGoal(time, out, onGround, footY);
    }

    // Bombadan kaç
    if (this.lv.dodge) {
      this.scene.bombs.group.getChildren().forEach((b) => {
        const dx = me.sprite.x - b.x;
        if (b.explodeAt - time < 900 && Math.abs(dx) < BOMB_RADIUS + 10 && Math.abs(me.sprite.y - b.y) < 80) {
          dir = Math.sign(dx) || 1;
        }
      });
    }

    // Yerdeyken istemeden kenardan düşme
    if (onGround && dir !== 0 && this.action !== 'walk') {
      const plat = platformAt(this.platforms, me.sprite.x, footY);
      if (plat) {
        const m = this.lv.edgeMargin;
        if ((dir < 0 && me.sprite.x < plat.x + m) || (dir > 0 && me.sprite.x > plat.x + plat.w - m)) dir = 0;
      }
    }

    out.left = dir < 0;
    out.right = dir > 0;

    // Nişan: hareket etmiyorsa rakibe dön, önündeyse ateş et
    const t = this.target;
    if (t && t.state === 'alive') {
      const toT = Math.sign(t.sprite.x - me.sprite.x) || 1;
      if (dir === 0) out.face = toT;
      const facing = dir === 0 ? toT : dir;
      const aligned = Math.abs(t.sprite.y - me.sprite.y) < this.lv.aimTol;
      out.fire = this.wantFire && aligned && facing === toT;
      if (this.wantBomb && facing === toT) {
        this.nextBombAt = time + this.lv.bombCooldownMs;
        out.bomb = true;
        this.wantBomb = false;
      }
    }
    return out;
  }

  // Hedef noktaya yürü, gerekirse zıpla / aşağı in
  followGoal(time, out, onGround, footY) {
    const me = this.me;
    const x = me.sprite.x;
    if (this.goalX === null) return 0;

    const dx = this.goalX - x;
    const there = Math.abs(dx) < 10;
    let dir = there ? 0 : Math.sign(dx);

    if (this.action === 'up') {
      if (onGround && there) out.jump = this.tryJump(time);
      // Havadayken tepe noktasına gelince ikinci zıplama
      if (!onGround && this.climbTo && me.sprite.body.velocity.y > -60 && footY > this.climbTo.y - 4 && me.jumpsLeft > 0) {
        out.jump = this.tryJump(time);
      }
      if (!onGround) dir = Math.sign(dx);
    } else if (this.action === 'drop') {
      if (onGround && there) out.drop = true;
    } else if (this.action === 'walk') {
      dir = Math.sign(dx);
    }
    return dir;
  }

  tryJump(time) {
    if (time < this.jumpReadyAt) return false;
    this.jumpReadyAt = time + JUMP_COOLDOWN_MS;
    return true;
  }

  nearestPlatform(x, footY) {
    let best = null;
    let bestScore = Infinity;
    this.platforms.forEach((p) => {
      const hd = x < p.x ? p.x - x : (x > p.x + p.w ? x - (p.x + p.w) : 0);
      const score = hd + Math.max(0, footY - p.y) * 0.5; // altında kaldığı masalar daha zor
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    });
    return best;
  }

  // Karar: hedef seç, nereye gideceğini ve ateş/bomba isteğini belirle
  think(time) {
    const me = this.me;
    const lv = this.lv;
    const footY = me.sprite.body.bottom;
    const x = me.sprite.x;

    const opponents = this.scene.players.filter((p) => p !== me && p.state === 'alive');
    if (!opponents.length) {
      this.target = null;
      this.goalX = null;
      this.wantFire = false;
      return;
    }
    this.target = opponents.reduce((a, b) =>
      (Phaser.Math.Distance.Between(x, me.sprite.y, a.sprite.x, a.sprite.y)
        <= Phaser.Math.Distance.Between(x, me.sprite.y, b.sprite.x, b.sprite.y) ? a : b));
    const t = this.target;

    const myPlat = me.onGround ? platformAt(this.platforms, x, footY) : null;
    if (!myPlat) return; // havadayken önceki planı sürdür

    // Silah kutusu: elinde başlangıç silahı varsa ara sıra kutuya git
    if (time > this.wantsCrateUntil) {
      this.wantsCrate = Math.random() < lv.crateChance;
      this.wantsCrateUntil = time + 2500;
    }
    let goal = { x: t.sprite.x, plat: platformBelow(this.platforms, t.sprite.x, t.sprite.body.bottom), isCrate: false };
    if (this.wantsCrate && me.weapon.id === STARTING_WEAPON) {
      const crate = this.scene.crates.group.getChildren()
        .filter((c) => c.body.blocked.down || c.body.touching.down)
        .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
      if (crate) goal = { x: crate.x, plat: platformBelow(this.platforms, crate.x, crate.body.bottom), isCrate: true };
    }

    this.action = null;
    this.climbTo = null;
    const lo = myPlat.x + lv.edgeMargin;
    const hi = myPlat.x + myPlat.w - lv.edgeMargin;

    if (!goal.plat) {
      // Hedef boşluğun üstünde: kendi masamızda ona en yakın yerde bekle
      this.goalX = Phaser.Math.Clamp(goal.x, lo, hi);
    } else if (goal.plat === myPlat) {
      if (goal.isCrate) {
        this.goalX = goal.x;
      } else {
        // Dövüş mesafesinde dur
        const side = Math.sign(x - goal.x) || 1;
        this.goalX = Phaser.Math.Clamp(goal.x + side * lv.fightDistance, lo, hi);
      }
    } else {
      const step = firstStep(this.graph, this.platforms.indexOf(myPlat), this.platforms.indexOf(goal.plat));
      if (step) {
        this.action = step.type;
        this.climbTo = this.platforms[step.to];
        this.goalX = Phaser.Math.Clamp(x, step.minX, step.maxX);
        if (step.type === 'walk') this.goalX = step.minX;
      } else {
        this.goalX = Phaser.Math.Clamp(goal.x, lo, hi);
      }
    }

    // Ateş / bomba isteği
    const dx = Math.abs(t.sprite.x - x);
    const skipShielded = lv !== BOT_LEVELS.easy && t.isShielded;
    this.wantFire = !skipShielded && dx < me.weapon.range && Math.random() < lv.fireChance;
    const sameLevel = Math.abs(t.sprite.y - me.sprite.y) < 30;
    this.wantBomb = !skipShielded && sameLevel && dx > 50 && dx < 170 && me.bombs > 0
      && time >= this.nextBombAt && Math.random() < lv.bombChance;
  }
}
