import { compileDeclareDirectiveFromMetadata, ThisReceiver } from '@angular/compiler';
import { Component } from '@angular/core';
import * as Phaser from 'phaser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  game: Phaser.Game;

  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      scale: { mode: Phaser.Scale.RESIZE },
      scene: DeepSpace,
      physics: { default: 'arcade' },
      autoFocus: true,
      // pixelArt: true,
    });
  }
}

class DeepSpace extends Phaser.Scene {

  ship!: Ship;
  outpost!: Outpost;

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  spaceSectors: SpaceSector[] = [];

  crashed = false;
  landed = false;

  constructor() {
    super('DeepSpace');
  }

  preload() {
    this.load.image('ship', 'assets/boltimo.png');
    this.load.image('explosion', 'assets/explosion.png');
    this.load.image('outpost', 'assets/outpost.png');
    this.load.image('outpost-landed', 'assets/outpost-landed.png');
    this.load.audio('explosion-sound', 'assets/explosion.wav');
    this.load.audio('land-sound', 'assets/land.wav');
    // this.load.audio('music', 'assets/background-music.mp3');
  }

  create() {
    const ship = new Ship(this, 0, 0, 'ship');
    this.ship = ship;
    this.outpost = new Outpost(this, 800, 200, 'outpost');

    this.cameras.main.startFollow(ship);

    this.cursors = this.input.keyboard.createCursorKeys();

    // const music = this.sound.add('music');
    // music.play({ loop: true });
  }

  override update() {
    this.pilotShip();
    this.ship.render();
    this.outpost.render();
    this.renderStars();
  }

  reset() {
    this.crashed = false;
    this.landed = false;
    this.ship.setPosition(0, 0);
    this.ship.setVelocity(0);
  }

  pilotShip() {
    const { ship, cursors } = this;

    if (cursors.space.isDown) {
      this.reset();
    }

    if (this.crashed) {
      this.ship.setVelocity(0);
      this.ship.setAngularVelocity(0);
      return;
    }

    if (cursors.left.isDown) {
      ship.setAngularVelocity(-150);
    }
    else if (cursors.right.isDown) {
      ship.setAngularVelocity(150);
    }
    else {
      ship.setAngularVelocity(0);
    }
    if (cursors.up.isDown) {
        this.physics.velocityFromRotation(ship.rotation - Math.PI/2, 100, ship.body.acceleration);
    }
    else if (cursors.down.isDown) {
        this.physics.velocityFromRotation(ship.rotation - Math.PI/2, -100, ship.body.acceleration);
    }
    else {
      ship.setAcceleration(0);
      if (ship.body.speed < 10) {
        ship.setVelocity(0);
      }
    }
  }

  renderStars() {
    const { ship, spaceSectors } = this;
    const { SECTOR_SIZE } = SpaceSector;
    const sectorX = Math.floor(ship.x / SECTOR_SIZE);
    const sectorY = Math.floor(ship.y / SECTOR_SIZE);
    const sectorsToRender: { x: number, y: number }[] = [];
    [sectorX - 1, sectorX, sectorX + 1].forEach(x =>
      [sectorY - 1, sectorY, sectorY + 1].forEach(y => sectorsToRender.push({ x, y }))
    );
    sectorsToRender.forEach(({ x, y }) => {
      if (!spaceSectors.find(s => s.x === x && s.y === y)) {
        const generator = new SpaceProceduralGenerator(x + y);
        const stars = this.physics.add.group();
        for (let index = 0; index < 100; index++) {
          const star = this.add.star((x + generator.random()) * SECTOR_SIZE, (y + generator.random()) * SECTOR_SIZE, 4, 0, 5 * generator.random(), 0xffffff);
          stars.add(star);
        }
        const collider = this.physics.add.collider(ship, stars, function() {
          // do nothing
        });
        this.spaceSectors.push({ x, y, stars, collider });
      }
    })
    spaceSectors.forEach(({ x, y, stars, collider }) => {
      if (!sectorsToRender.find(s => s.x === x && s.y === y)) {
        stars.destroy(true, true);
        collider.destroy();
      }
    });
    this.spaceSectors = spaceSectors.filter(({ x, y }) => sectorsToRender.find(s => s.x === x && s.y === y));
  }
}

class SpaceSector {
  static SECTOR_SIZE = 2000;
  x!: number;
  y!: number
  stars!: Phaser.Physics.Arcade.Group;
  collider!: Phaser.Physics.Arcade.Collider;
}

class SpaceProceduralGenerator {
  constructor(public seed: number) { }
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

class Ship extends Phaser.Physics.Arcade.Sprite {

  override body!: Phaser.Physics.Arcade.Body;
  override scene!: DeepSpace;

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
          return 500;
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
    const { crashed } = this.scene;
    if (crashed) {
      this.setTexture('explosion');
    } else {
      this.setTexture('ship');
    }
  }

}

class Outpost extends Phaser.GameObjects.Sprite {

  override scene!: DeepSpace;

  constructor(scene: DeepSpace, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(100);
    const outpostWall = scene.add.rectangle(this.x + 63, this.y - 87, 100, 50);
    outpostWall.setStrokeStyle(1, 0xff0000);
    outpostWall.setVisible(false);
    outpostWall.setDepth(101);
    scene.physics.add.existing(outpostWall, true);
    scene.physics.add.collider(scene.ship, outpostWall, () => {
      if (!scene.crashed) {
        scene.sound.play('explosion-sound');
      }
      scene.crashed = true;
    });
    const outpostLandingPad = scene.add.rectangle(this.x + 58, this.y - 30, 100, 50);
    outpostLandingPad.setStrokeStyle(1, 0xff0000);
    outpostLandingPad.setVisible(false);
    outpostLandingPad.setDepth(101);
    scene.physics.add.existing(outpostLandingPad, true);
    scene.physics.add.overlap(scene.ship, outpostLandingPad, () => {
      if (scene.ship.body.speed === 0 && !scene.crashed) {
        if (!scene.landed) {
          scene.sound.play('land-sound');
        }
        scene.landed = true;
      } else {
        scene.landed = false;
      }
    });
  }

  render() {
    const { landed } = this.scene;
    if (landed) {
      this.setTexture('outpost-landed');
    } else {
      this.setTexture('outpost');
    }
  }

}
