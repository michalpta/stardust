import { DeepSpace } from "../scenes/deep-space";

export class Ship extends Phaser.Physics.Arcade.Sprite {

  override body!: Phaser.Physics.Arcade.Body;
  override scene!: DeepSpace;

  health = 100;
  crashed = false;

  constructor(scene: DeepSpace, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(1000);
    const particles = scene.add.particles('explosion').setDepth(999);
    const emitter = particles.createEmitter({
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      speed: {
        onEmit: () => {
          return this.body.speed;
        }
      },
      lifespan: {
        onEmit: () => {
          return Phaser.Math.Between(200, 500);
        }
      },
      alpha: {
        onEmit: () => {
          return this.body.speed ? 1 : 0;
        }
      },
      angle: {
        onEmit: () => {
          return this.angle + 90 + Phaser.Math.Between(-15, 15);
        }
      },
    });
    emitter.startFollow(this);
  }

  render() {
    const { crashed, health } = this;
    if (health === 0) {
      if (!crashed) {
        this.crashed = true;
        this.scene.sound.play('explosion-sound');
        this.setTexture('explosion');
      }
    } else {
      if (crashed) {
        this.crashed = false;
        this.setTexture('ship');
      }
    }
  }
}
