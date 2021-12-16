import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { DeepSpace } from './scenes/deep-space';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef;
  game!: Phaser.Game;

  dialogVisible = true;

  ngOnInit() {
    this.game = new Phaser.Game({
      type: Phaser.WEBGL,
      scale: { mode: Phaser.Scale.RESIZE },
      scene: DeepSpace,
      physics: { default: 'arcade' },
      autoFocus: true,
      canvas: this.canvas.nativeElement,
    });
  }

  get ship() {
    return (this.game.scene.getScene('DeepSpace') as DeepSpace)?.ship;
  }
}
