export class Rectangle {
  constructor(
    public x: number, public y: number,
    public w: number, public h: number,
    public col: string | CanvasGradient | CanvasPattern) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.col;
    ctx.translate(this.x, this.y);
    ctx.scale(this.w, this.h);
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
  }
}
