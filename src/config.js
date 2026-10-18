// Tüm ayarlanabilir sabitler burada (oynarken ince ayar yapılacak)

// Ekran
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Fizik
export const GRAVITY = 1200;
export const DEBUG_PHYSICS = false; // F1 ile oyun içinde de açılıp kapanır

// Platform görünümü
export const PLATFORM_THICKNESS = 14;
export const LEG_WIDTH = 8;
export const LEG_INSET = 18; // bacağın masa kenarından içeride durduğu mesafe

// Oyuncu hareketi
export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 30;
export const PLAYER_SPEED = 260;      // yatay en yüksek hız
export const GROUND_ACCEL = 14;       // yerde hıza ulaşma çevikliği (büyük = daha keskin)
export const AIR_ACCEL = 6;           // havada kontrol
export const JUMP_VELOCITY = 560;
export const MAX_JUMPS = 2;           // 2 = çift zıplama
export const JUMP_CUT = 0.45;         // tuş erken bırakılırsa yükselişi bu oranla kes
export const DROP_THROUGH_MS = 250;   // aşağı tuşuyla masadan geçme süresi
export const MAX_FALL_SPEED = 900;

// Oyuncu yuvaları (en fazla 4). Renk yuvaya aittir, yuvada insan ya da bot olabilir.
// Tuşlar varsayılandır, TUŞLAR ekranından değiştirilir. Doğma noktaları haritadan gelir.
export const PLAYERS = [
  {
    name: 'Oyuncu 1', color: 0x3a8dde,
    keys: { left: 'LEFT', right: 'RIGHT', down: 'DOWN', jump: 'UP', fire: 'Z', bomb: 'X' },
  },
  {
    name: 'Oyuncu 2', color: 0xe0483e,
    keys: { left: 'A', right: 'D', down: 'S', jump: 'W', fire: 'T', bomb: 'Y' },
  },
  {
    name: 'Oyuncu 3', color: 0x4caf50,
    keys: { left: 'J', right: 'L', down: 'K', jump: 'I', fire: 'U', bomb: 'O' },
  },
  {
    name: 'Oyuncu 4', color: 0xf2b51d,
    keys: {
      left: 'NUMPAD_FOUR', right: 'NUMPAD_SIX', down: 'NUMPAD_FIVE', jump: 'NUMPAD_EIGHT',
      fire: 'NUMPAD_SEVEN', bomb: 'NUMPAD_NINE',
    },
  },
];

// Vurulma / geri savrulma
// Savrulma yürümeden ayrı bir hızdır: ileri yürümek onu silemez, sadece sürtünmeyle azalır
export const HIT_STUN_MS = 220;          // mermi yiyince yön tuşlarının çalışmadığı süre (zıplama serbest)
export const BLAST_STUN_MS = 400;        // patlamada aynı süre
export const KNOCKBACK_DECAY_GROUND = 4; // yerdeyken savrulmanın sönme hızı (büyük = daha az kayar)
export const KNOCKBACK_DECAY_AIR = 1.6;  // havadayken (küçük = havada daha uzağa uçar)
export const KNOCKBACK_LIFT = 90;       // vurulunca hafif yukarı kalkma hızı
export const MAX_KNOCKBACK_SPEED = 900; // üst üste vuruşlarda yatay hız sınırı

// Can ve yeniden doğma
export const LIVES = 3;                 // varsayılan can (ayarlar ekranından değişir)
export const FALL_MARGIN = 60;          // ekranın bu kadar altına inen düşmüş sayılır
export const RESPAWN_DELAY_MS = 900;    // düştükten sonra yeniden doğma beklemesi
export const RESPAWN_SHIELD_MS = 2000;  // yeniden doğunca dokunulmazlık süresi

// Silah kutuları
export const CRATE_FIRST_MS = 2000;      // ilk kutunun düşme zamanı
export const MAX_CRATES = 2;             // sahnede aynı anda en fazla kutu
export const CRATE_LIFETIME_MS = 15000;  // alınmayan kutu bu sürede kaybolur
export const CRATE_SIZE = 22;

// Bomba
export const BOMBS_PER_LIFE = 2;   // varsayılan, her can başında yenilenir (ayarlardan değişir)
export const BOMB_THROW_X = 250;   // fırlatma yatay hızı
export const BOMB_THROW_Y = 340;   // fırlatma yukarı hızı
export const BOMB_BOUNCE = 0.35;
export const BOMB_FUSE_MS = 1500;  // atıldıktan sonra patlama süresi
export const BOMB_RADIUS = 110;    // patlama yarıçapı (px)
export const BOMB_FORCE = 650;     // merkezdeki yatay savurma hızı, kenara doğru azalır
export const BOMB_LIFT = 420;      // patlamanın yukarı kaldırma hızı

// Combo ve kill feed
export const COMBO_WINDOW_MS = 1200;  // bu süre içinde gelen vuruşlar combo'yu sürdürür
export const KILL_CREDIT_MS = 5000;   // düşmeden en fazla bu kadar önce vuran, öldüren sayılır
export const KILL_FEED_MS = 6000;     // kill feed satırının ekranda kalma süresi
export const KILL_FEED_MAX = 5;       // aynı anda en fazla satır

// Botlar: zorluk seviyelerine göre davranış ayarları
// reactionMs: karar verme aralığı | aimTol: ateş etmek için kabul edilen yükseklik farkı (büyük = daha çok ıska)
// fireChance / bombChance / crateChance: her kararda ateş / bomba / kutuya gitme olasılığı
// edgeMargin: kenara ne kadar yaklaşmaktan kaçınır | recoverChance: düşerken kurtulmayı deneme olasılığı
// dodge: bombadan kaçar mı | fightDistance: rakiple arasında tutmaya çalıştığı mesafe
// bombCooldownMs: iki bomba arasında en az bekleme
export const BOT_LEVELS = {
  easy: {
    label: 'EASY', name: 'Easy AI',
    reactionMs: 450, aimTol: 40, fireChance: 0.45, bombChance: 0.04, crateChance: 0.3,
    edgeMargin: 12, recoverChance: 0.55, dodge: false, fightDistance: 150, bombCooldownMs: 9000,
  },
  normal: {
    label: 'NORMAL', name: 'Normal AI',
    reactionMs: 240, aimTol: 26, fireChance: 0.8, bombChance: 0.12, crateChance: 0.7,
    edgeMargin: 24, recoverChance: 0.9, dodge: true, fightDistance: 120, bombCooldownMs: 6000,
  },
  hard: {
    label: 'HARD', name: 'Hard AI',
    reactionMs: 110, aimTol: 18, fireChance: 1, bombChance: 0.25, crateChance: 1,
    edgeMargin: 32, recoverChance: 1, dodge: true, fightDistance: 90, bombCooldownMs: 4000,
  },
};
