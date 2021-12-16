import * as faker from "faker";
import { cantorPairing } from "../helpers/helpers";
import { DeepSpace } from "../scenes/deep-space";

export class Outpost extends Phaser.GameObjects.Sprite {

  override scene!: DeepSpace;

  landed = false;

  objects!: Phaser.GameObjects.Group;
  colliders: Phaser.Physics.Arcade.Collider[] = [];

  constructor(scene: DeepSpace, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(100);
    this.objects = scene.add.group();
    const outpostWall = scene.add.rectangle(this.x + 63, this.y - 87, 100, 50);
    outpostWall.setStrokeStyle(1, 0xff0000);
    outpostWall.setVisible(false);
    outpostWall.setDepth(101);
    scene.physics.add.existing(outpostWall, true);
    this.objects.add(outpostWall);
    this.colliders.push(scene.physics.add.collider(scene.ship, outpostWall, () => scene.ship.health = 0));
    const outpostLandingPad = scene.add.rectangle(this.x + 58, this.y - 30, 100, 50);
    outpostLandingPad.setStrokeStyle(1, 0xff0000);
    outpostLandingPad.setVisible(false);
    outpostLandingPad.setDepth(101);
    scene.physics.add.existing(outpostLandingPad, true);
    this.objects.add(outpostLandingPad);
    this.colliders.push(scene.physics.add.overlap(scene.ship, outpostLandingPad, () => {
      if (scene.ship.body.speed === 0 && scene.ship.health > 0) {
        if (!this.landed) {
          scene.sound.play('land-sound');
          this.setTexture('outpost-landed');
        }
        this.landed = true;
        scene.ship.health = 100;
      } else {
        if (this.landed) {
          this.landed = false;
          this.setTexture('outpost');
        }
      }
    }));
    faker.seed(cantorPairing(x, y));
    this.name = faker.name.lastName() + ' Port';
    const label = scene.add.text(x + 10, y - 4, this.name, { color: '#ffbf00', fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold' });
    label.setDepth(101);
    this.objects.add(label);
  }

  render() {
    // do nothing
  }

  override destroy(fromScene?: boolean): void {
      this.objects.destroy(true, true);
      this.colliders.forEach(c => c.destroy());
      super.destroy(fromScene);
  }
}
