import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, DEBUG_PHYSICS } from './config.js';
import MenuScene from './scenes/MenuScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import MatchScene from './scenes/MatchScene.js';
import ControlsScene from './scenes/ControlsScene.js';
import GameScene from './scenes/GameScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#f3c46b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: DEBUG_PHYSICS },
  },
  scene: [MenuScene, SettingsScene, MatchScene, ControlsScene, GameScene],
});

// Geliştirme sırasında konsoldan erişim için
if (import.meta.env.DEV) window.game = game;
