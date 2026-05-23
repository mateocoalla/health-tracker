/**
 * WeightChart — encapsulates the canvas drawing for body weight history.
 * Stateless: pass weight values and it redraws.
 */
export class WeightChart {
  constructor(canvas) {
    this.canvas = canvas;
  }

  /**
   * @param {number[]} values — most recent N weights, oldest first.
   * @param {{ color?:string, fill?:string }} opts
   */
  render(values, { color = '#c8f55a', fill = 'rgba(200,245,90,0.08)' } = {}) {
    const canvas = this.canvas;
    if (!canvas || !values.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 300;
    const H = 100;
    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);
    const mn = Math.min(...values) - 1;
    const mx = Math.max(...values) + 1;
    const x = (i) => 16 + (W - 32) * (i / (values.length - 1 || 1));
    const y = (v) => H - 12 - (H - 24) * ((v - mn) / (mx - mn || 1));

    ctx.clearRect(0, 0, W, H);

    // Filled area beneath the line.
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    values.forEach((v, i) => { if (i > 0) ctx.lineTo(x(i), y(v)); });
    ctx.lineTo(x(values.length - 1), H);
    ctx.lineTo(x(0), H);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // Line.
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    values.forEach((v, i) => { if (i > 0) ctx.lineTo(x(i), y(v)); });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots.
    values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(x(i), y(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }
}
