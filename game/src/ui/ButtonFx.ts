import Phaser from 'phaser';

export function addButtonFx(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { setScale: Function; scaleX: number; scaleY: number }
): void {
  target.on('pointerover', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 100,
      ease: 'Power2',
    });
  });
  target.on('pointerout', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Power2',
    });
  });
  target.on('pointerdown', () => {
    scene.tweens.add({
      targets: target,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 60,
      ease: 'Power2',
      yoyo: true,
    });
  });
}
