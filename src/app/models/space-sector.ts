import { cantorPairing, SpaceProceduralGenerator } from "../helpers/helpers";
import { DeepSpace } from "../scenes/deep-space";
import { Outpost } from "./outpost";

export class SpaceSector {
  static SECTOR_SIZE = 2000;
  x!: number;
  y!: number
  stars!: Phaser.Physics.Arcade.Group;
  starsCollider!: Phaser.Physics.Arcade.Collider;
  outpost: Outpost | null;

  constructor(scene: DeepSpace, x: number, y: number) {
    const { SECTOR_SIZE } = SpaceSector;
    this.x = x;
    this.y = y;
    const { ship } = scene;
    const generator = new SpaceProceduralGenerator(cantorPairing(x, y));
    const stars = scene.physics.add.group();
    for (let index = 0; index < 100; index++) {
      const star = scene.add.star((x + generator.random()) * SECTOR_SIZE, (y + generator.random()) * SECTOR_SIZE, 4, 0, 5 * generator.random(), 0xffffff);
      stars.add(star);
    }
    this.stars = stars;
    this.starsCollider = scene.physics.add.collider(ship, stars, function() {
      if (ship.health > 0) {
        ship.health--;
      }
    });
    const hasOutpost = generator.random() >= 0.5;
    this.outpost = hasOutpost ? new Outpost(scene, (x + generator.random()) * SECTOR_SIZE, (y + generator.random()) * SECTOR_SIZE, 'outpost') : null;
  }

  render() {
    this.outpost?.render();
  }

  destroy() {
    this.outpost?.destroy();
    this.stars.destroy(true, true);
    this.starsCollider.destroy();
  }
}
