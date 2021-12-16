import { Ship } from "../models/ship";
import { SpaceSector } from "../models/space-sector";

export class DeepSpace extends Phaser.Scene {

  ship!: Ship;
  spaceSectors: SpaceSector[] = [];

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

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
    this.load.audio('music', 'assets/intro-music.mp3');
  }

  create() {
    const ship = new Ship(this, 0, 0, 'ship');
    this.ship = ship;
    this.cameras.main.startFollow(ship);
    this.cursors = this.input.keyboard.createCursorKeys();
    const music = this.sound.add('music');
    music.play({ loop: true });
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
    this.ship.setAngle(0);
    this.ship.health = 100;
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
      if (!spaceSectors.some(s => s.x === x && s.y === y)) {
        this.spaceSectors.push(new SpaceSector(this, x, y));
      }
    })
    spaceSectors.forEach((sector) => {
      const { x, y } = sector;
      if (!sectorsToGenerate.some(s => s.x === x && s.y === y)) {
        sector.destroy();
      }
    });
    this.spaceSectors = spaceSectors.filter(({ x, y }) => sectorsToGenerate.some(s => s.x === x && s.y === y));
  }
}
