import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import * as faker from 'faker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef;
  game!: Phaser.Game;

  ngOnInit() {
    this.game = new Phaser.Game({
      type: Phaser.WEBGL,
      scale: { mode: Phaser.Scale.RESIZE },
      scene: DeepSpace,
      physics: { default: 'arcade' },
      autoFocus: true,
      canvas: this.canvas.nativeElement,
      // pixelArt: true,
    });
  }

  get ship() {
    return (this.game.scene.getScene('DeepSpace') as DeepSpace)?.ship || { x: 0, y: 0};
  }
}

class DeepSpace extends Phaser.Scene {

  ship!: Ship;
  outpost!: Outpost;

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  spaceSectors: SpaceSector[] = [];

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
    this.cameras.main.startFollow(ship);
    this.cursors = this.input.keyboard.createCursorKeys();
    // const music = this.sound.add('music');
    // music.play({ loop: true });
  }

  override update() {
    this.pilotShip();
    this.ship.render();
    this.spaceSectors.forEach(sector => sector.render());
    this.updateSpaceSectors();
  }

  reset() {
    this.ship.setPosition(0, 0);
    this.ship.setVelocity(0);
    this.ship.health = 100;
    this.ship.crashed = false;
  }

  pilotShip() {
    const { ship, cursors } = this;

    if (cursors.space.isDown) {
      this.reset();
    }

    if (this.ship.health <= 0) {
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

  updateSpaceSectors() {
    const { ship, spaceSectors } = this;
    const { SECTOR_SIZE } = SpaceSector;
    const sectorX = Math.floor(ship.x / SECTOR_SIZE);
    const sectorY = Math.floor(ship.y / SECTOR_SIZE);
    const sectorsToGenerate: { x: number, y: number }[] = [];
    [sectorX - 1, sectorX, sectorX + 1].forEach(x =>
      [sectorY - 1, sectorY, sectorY + 1].forEach(y => sectorsToGenerate.push({ x, y }))
    );
    sectorsToGenerate.forEach(({ x, y }) => {
      if (!spaceSectors.find(s => s.x === x && s.y === y)) {
        this.spaceSectors.push(new SpaceSector(this, x, y));
      }
    })
    spaceSectors.forEach((sector) => {
      const { x, y } = sector;
      if (!sectorsToGenerate.find(s => s.x === x && s.y === y)) {
        sector.destroy();
      }
    });
    this.spaceSectors = spaceSectors.filter(({ x, y }) => sectorsToGenerate.find(s => s.x === x && s.y === y));
  }
}

class SpaceSector {
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
    this.stars.destroy(true, true);
    this.starsCollider.destroy();
  }
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
    const { crashed, health } = this;
    if (health === 0) {
      if (!crashed) {
        this.scene.sound.play('explosion-sound');
        this.crashed = true;
      }
      this.setTexture('explosion');
    } else {
      this.setTexture('ship');
    }
  }

}

class Outpost extends Phaser.GameObjects.Sprite {

  override scene!: DeepSpace;

  landed = false;

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
    scene.physics.add.collider(scene.ship, outpostWall, () => scene.ship.health = 0);
    const outpostLandingPad = scene.add.rectangle(this.x + 58, this.y - 30, 100, 50);
    outpostLandingPad.setStrokeStyle(1, 0xff0000);
    outpostLandingPad.setVisible(false);
    outpostLandingPad.setDepth(101);
    scene.physics.add.existing(outpostLandingPad, true);
    scene.physics.add.overlap(scene.ship, outpostLandingPad, () => {
      if (scene.ship.body.speed === 0 && scene.ship.health > 0) {
        if (!this.landed) {
          scene.sound.play('land-sound');
        }
        this.landed = true;
        scene.ship.health = 100;
      } else {
        this.landed = false;
      }
    });
    faker.seed(cantorPairing(x, y));
    this.name = faker.name.lastName() + ' Port';
    const label = scene.add.text(x + 10, y - 4, this.name, { color: '#ffbf00', fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold' });
    label.setDepth(101);
  }

  render() {
    const { landed } = this;
    if (landed) {
      this.setTexture('outpost-landed');
    } else {
      this.setTexture('outpost');
    }
  }

}

function cantorPairing(x: number, y: number): number {
  return 0.5 * (x + y) * (x + y + 1) + y;
}
