/**
 * Zoombarer/schwenkbarer Viewer für das Plan-Foto auf einem Canvas.
 * Meldet Klicks in Bildpixel-Koordinaten und zeichnet nummerierte Marker.
 */
class PlanViewer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{onPointClick: (x:number, y:number) => void}} opts
   */
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onPointClick = opts.onPointClick;
    this.img = null;
    this.markers = [];   // [{x, y, color, label}]
    this.pending = null; // [x, y] | null
    this.view = { scale: 1, tx: 0, ty: 0 };
    this._drag = null;

    canvas.addEventListener('pointerdown', e => this._down(e));
    canvas.addEventListener('pointermove', e => this._move(e));
    canvas.addEventListener('pointerup', e => this._up(e));
    canvas.addEventListener('pointercancel', () => { this._drag = null; });
    canvas.addEventListener('wheel', e => this._wheel(e), { passive: false });

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    this._resize();
  }

  setImage(img) {
    this.img = img;
    this.fit();
  }

  setMarkers(markers) { this.markers = markers; this.draw(); }
  setPending(pt) { this.pending = pt; this.draw(); }

  fit() {
    if (!this.img) { this.draw(); return; }
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    const s = Math.min(cw / this.img.width, ch / this.img.height) * 0.96;
    this.view.scale = s;
    this.view.tx = (cw - this.img.width * s) / 2;
    this.view.ty = (ch - this.img.height * s) / 2;
    this.draw();
  }

  toImage(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const { scale, tx, ty } = this.view;
    return [(clientX - r.left - tx) / scale, (clientY - r.top - ty) / scale];
  }

  _down(e) {
    this.canvas.setPointerCapture(e.pointerId);
    this._drag = { x: e.clientX, y: e.clientY, moved: false };
  }

  _move(e) {
    if (!this._drag) return;
    const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y;
    if (!this._drag.moved && Math.hypot(dx, dy) < 4) return;
    this._drag.moved = true;
    this.view.tx += dx; this.view.ty += dy;
    this._drag.x = e.clientX; this._drag.y = e.clientY;
    this.draw();
  }

  _up(e) {
    const wasClick = this._drag && !this._drag.moved;
    this._drag = null;
    if (!wasClick || !this.img) return;
    const [x, y] = this.toImage(e.clientX, e.clientY);
    if (x >= 0 && y >= 0 && x <= this.img.width && y <= this.img.height) {
      this.onPointClick(x, y);
    }
  }

  _wheel(e) {
    if (!this.img) return;
    e.preventDefault();
    const factor = Math.pow(2, -e.deltaY * 0.0022);
    const r = this.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const v = this.view;
    const ns = Math.min(Math.max(v.scale * factor, 0.02), 40);
    v.tx = mx - (mx - v.tx) * (ns / v.scale);
    v.ty = my - (my - v.ty) * (ns / v.scale);
    v.scale = ns;
    this.draw();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, this.canvas.clientWidth * dpr);
    this.canvas.height = Math.max(1, this.canvas.clientHeight * dpr);
    this.draw();
  }

  _toScreen(x, y) {
    const { scale, tx, ty } = this.view;
    return [x * scale + tx, y * scale + ty];
  }

  draw() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (!this.img) return;

    const { scale, tx, ty } = this.view;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, tx, ty, this.img.width * scale, this.img.height * scale);

    for (const m of this.markers) {
      const [sx, sy] = this._toScreen(m.x, m.y);
      this._drawBadge(sx, sy, m.color, m.label);
    }
    if (this.pending) {
      const [sx, sy] = this._toScreen(this.pending[0], this.pending[1]);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3.5;
      this._cross(sx, sy, 11);
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 1.6;
      this._cross(sx, sy, 11);
    }
  }

  _cross(x, y, r) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x - r, y); c.lineTo(x + r, y);
    c.moveTo(x, y - r); c.lineTo(x, y + r);
    c.stroke();
  }

  _drawBadge(x, y, color, label) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, 9, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = '#fff';
    c.stroke();
    c.fillStyle = '#fff';
    c.font = '700 10px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, x, y + 0.5);
  }
}
