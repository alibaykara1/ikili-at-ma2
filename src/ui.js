// Menü ekranları için ortak, klavye + fare ile çalışan dikey seçenek listesi.
// item: { text: () => string, onSelect?, onLeft?, onRight? }
// Klavye: Yukarı/Aşağı (W/S) gez, Enter/Space seç, Sol/Sağ (A/D) değer değiştir.

export const FONT = 'Arial Black, Arial';

export class MenuList {
  constructor(scene, x, y, items, { spacing = 46, fontSize = 26 } = {}) {
    this.scene = scene;
    this.items = items;
    this.index = 0;
    this.locked = false; // true iken klavye olaylarını yok sayar (ör. isim yazarken)

    this.texts = items.map((item, i) => {
      const t = scene.add.text(x, y + i * spacing, '', {
        fontFamily: FONT, fontSize: `${fontSize}px`, color: '#ffffff', stroke: '#2b1a0c', strokeThickness: 6,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', (pointer) => {
        this.select(i);
        const arrow = this.arrowAt(t, pointer.x);
        if (arrow < 0 && item.onLeft) item.onLeft();
        else if (arrow > 0 && item.onRight) item.onRight();
        else if (item.onSelect) item.onSelect();
        // Sadece değer satırı: sol yarı = azalt, sağ yarı = artır
        else if (item.onLeft && pointer.x < t.x) item.onLeft();
        else if (item.onRight) item.onRight();
        this.refresh();
      });
      return t;
    });

    scene.input.keyboard.on('keydown', this.onKey, this);
    this.refresh();
  }

  onKey(e) {
    if (this.locked) return;
    const item = this.items[this.index];
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':
        this.select((this.index - 1 + this.items.length) % this.items.length); break;
      case 'ArrowDown': case 'KeyS':
        this.select((this.index + 1) % this.items.length); break;
      case 'ArrowLeft': case 'KeyA':
        if (item.onLeft) item.onLeft(); break;
      case 'ArrowRight': case 'KeyD':
        if (item.onRight) item.onRight(); break;
      case 'Enter': case 'Space': case 'NumpadEnter':
        if (item.onSelect) item.onSelect();
        else if (item.onRight) item.onRight();
        break;
      default: return;
    }
    this.refresh();
  }

  // Tıklanan nokta ‹ ya da › okunun üstünde mi? -1: sol ok, 1: sağ ok, 0: değil
  arrowAt(t, px) {
    const str = t.text;
    const left = t.x - t.displayWidth / 2;
    const charX = (idx) => {
      // Okun ortasının x'i: önündeki yazının genişliği + okun yarısı
      t.context.font = t.style._font;
      const before = t.context.measureText(str.slice(0, idx)).width;
      const self = t.context.measureText(str[idx]).width;
      return left + (before + self / 2 + t.padding.left + t.style.strokeThickness / 2) * t.scaleX;
    };
    const l = str.indexOf('‹');
    const r = str.indexOf('›');
    if (l >= 0 && Math.abs(px - charX(l)) < 30) return -1;
    if (r >= 0 && px > charX(r) - 30) return 1; // › yazının sonunda, sağına kadar hepsi sayılır
    return 0;
  }

  select(i) {
    this.index = i;
    this.refresh();
  }

  refresh() {
    this.texts.forEach((t, i) => {
      const selected = i === this.index;
      t.setText(this.items[i].text());
      t.setColor(selected ? '#ffd23a' : '#ffffff');
      t.setScale(selected ? 1.08 : 1);
    });
  }
}

// Phaser tuş adını ekranda okunur hale getirir (ör. LEFT -> ←, NUMPAD_FOUR -> Num 4)
const KEY_LABELS = {
  LEFT: '←', RIGHT: '→', UP: '↑', DOWN: '↓', SPACE: 'Space', ENTER: 'Enter', SHIFT: 'Shift',
  CTRL: 'Ctrl', ALT: 'Alt', TAB: 'Tab', BACKSPACE: 'Bksp', COMMA: ',', PERIOD: '.', FORWARD_SLASH: '/',
  SEMICOLON: ';', QUOTES: "'", OPEN_BRACKET: '[', CLOSED_BRACKET: ']', BACK_SLASH: '\\', MINUS: '-', PLUS: '+',
};
const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
export function keyLabel(name) {
  if (!name) return '-';
  if (KEY_LABELS[name]) return KEY_LABELS[name];
  if (name.startsWith('NUMPAD_')) {
    const d = DIGITS.indexOf(name.slice(7));
    return d >= 0 ? `Num ${d}` : `Num ${name.slice(7)}`;
  }
  const d = DIGITS.indexOf(name);
  return d >= 0 ? String(d) : name;
}

// Ekranı hafif karartan yarı saydam katman
export function dimOverlay(scene, alpha = 0.35) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(width / 2, height / 2, width, height, 0x2b1a0c, alpha);
}
