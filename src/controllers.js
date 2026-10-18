import Phaser from 'phaser';

// Bir karede savaşçıya verilen girdi.
// left/right/fire: basılı mı | jump/drop/bomb: bu kare yeni basıldı mı
// jumpReleased: zıplama tuşu bu kare bırakıldı mı | face: hareket yokken bakılacak yön (-1/1)
export const NO_INPUT = Object.freeze({
  left: false, right: false, jump: false, jumpReleased: false, drop: false, fire: false, bomb: false, face: 0,
});

// İnsan oyuncu: config'teki tuşları okur
export class KeyboardController {
  constructor(scene, keyMap) {
    const kb = scene.input.keyboard;
    this.keys = {};
    Object.entries(keyMap).forEach(([action, code]) => {
      this.keys[action] = kb.addKey(Phaser.Input.Keyboard.KeyCodes[code]);
    });
  }

  read() {
    const k = this.keys;
    const { JustDown, JustUp } = Phaser.Input.Keyboard;
    return {
      left: k.left.isDown,
      right: k.right.isDown,
      jump: JustDown(k.jump),
      jumpReleased: JustUp(k.jump),
      drop: JustDown(k.down),
      fire: k.fire.isDown,
      bomb: JustDown(k.bomb),
      face: 0,
    };
  }
}
