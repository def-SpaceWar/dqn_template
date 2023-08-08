import { Rectangle } from '../render/rectangle';
import type { Vector } from '../util';

export class Platform {
  pos: Vector;
  dimensions: Vector;
  rect: Rectangle;

  constructor(
    x: number, y: number,
    w: number, h: number,
    color: string | CanvasGradient | CanvasPattern) {
    this.pos = [x, y];
    this.dimensions = [w, h];
    this.rect = new Rectangle(x, y, w, h, color);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.rect.draw(ctx);
  }
}
