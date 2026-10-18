import { KILL_FEED_MS, KILL_FEED_MAX } from './config.js';

const FONT = 'Arial Black, Arial';
const ROW_H = 24;

const toCss = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Sol üstte "[Katil] KILLED [Ölen]" satırları
export default class KillFeed {
  constructor(scene) {
    this.scene = scene;
    this.rows = [];
  }

  add(killer, victim) {
    const s = this.scene;
    const row = s.add.container(10, 10).setDepth(26);
    const parts = [];

    const nameStyle = (p) => ({
      fontFamily: FONT, fontSize: '14px', color: '#ffffff', stroke: toCss(p.def.color), strokeThickness: 4,
    });

    if (killer) parts.push(s.add.text(0, 0, killer.name, nameStyle(killer)));

    // Ortadaki etiket: kırmızı kutuda KILLED (kendi düştüyse gri FELL)
    const label = s.add.text(0, 2, killer ? 'KILLED' : 'FELL', {
      fontFamily: FONT, fontSize: '11px', color: '#ffffff',
    });
    const labelBg = s.add.rectangle(0, 0, label.width + 10, 18, killer ? 0xc81d11 : 0x555555)
      .setOrigin(0, 0).setStrokeStyle(2, 0x2b1a0c);
    const victimText = s.add.text(0, 0, victim.name, nameStyle(victim));

    // Soldan sağa diz: "Katil KILLED Ölen" ya da "Ölen FELL"
    const order = killer ? [parts[0], labelBg, victimText] : [victimText, labelBg];
    let x = 0;
    order.forEach((o) => {
      o.setX(x);
      if (o === labelBg) label.setX(x + 5);
      x += o.width + 6;
    });
    row.add([...parts, labelBg, label, victimText]);

    this.rows.unshift(row);
    while (this.rows.length > KILL_FEED_MAX) this.rows.pop().destroy();
    this.layout();

    row.setAlpha(0).setX(-20);
    s.tweens.add({ targets: row, alpha: 1, x: 10, duration: 200, ease: 'Cubic.out' });
    s.time.delayedCall(KILL_FEED_MS, () => {
      if (!row.active) return;
      s.tweens.add({
        targets: row, alpha: 0, duration: 300,
        onComplete: () => {
          this.rows = this.rows.filter((r) => r !== row);
          row.destroy();
          this.layout();
        },
      });
    });
  }

  // En yeni satır en üstte
  layout() {
    this.rows.forEach((r, i) => r.setY(10 + i * ROW_H));
  }
}
