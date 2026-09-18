export class DrawingPad {
  constructor(canvas, { ink = () => '#292b29', onUpdate = () => {}, onActivate = () => {} } = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.strokes = []; this.redoStack = []; this.active = null; this.pointerId = null;
    this.ink = ink; this.onUpdate = onUpdate;
    this.events = new AbortController();
    const listen = (name, callback) => canvas.addEventListener(name, callback, { signal: this.events.signal });
    canvas.tabIndex = 0;
    listen('focus', onActivate);
    listen('pointerdown', event => {
      if (this.active || event.button !== 0) return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); onActivate();
      this.pointerId = event.pointerId; canvas.setPointerCapture(event.pointerId);
      this.active = { color: this.ink(), points: [this.point(event)] };
      this.redraw(); this.onUpdate(true);
    });
    listen('pointermove', event => {
      if (!this.active || event.pointerId !== this.pointerId) return;
      const coalesced = event.getCoalescedEvents?.();
      for (const sample of coalesced?.length ? coalesced : [event]) this.active.points.push(this.point(sample));
      this.redraw();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(name, event => {
      if (!this.active || event.pointerId !== this.pointerId) return;
      if (event.type === 'pointerup') this.active.points.push(this.point(event));
      this.strokes.push(this.active); this.active = null; this.pointerId = null; this.redoStack = [];
      this.redraw(); this.onUpdate(false);
    });
  }
  point(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(this.canvas.width, (event.clientX - bounds.left) / bounds.width * this.canvas.width)), y: Math.max(0, Math.min(this.canvas.height, (event.clientY - bounds.top) / bounds.height * this.canvas.height)) };
  }
  redraw() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const stroke of [...this.strokes, ...(this.active ? [this.active] : [])]) {
      ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); stroke.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      if (stroke.points.length === 1) { const p = stroke.points[0]; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  clear() {
    const pointer = this.pointerId;
    this.active = null; this.pointerId = null; this.strokes = []; this.redoStack = [];
    if (pointer !== null && this.canvas.hasPointerCapture(pointer)) this.canvas.releasePointerCapture(pointer);
    this.redraw(); this.onUpdate(true);
  }
  undo() { if (!this.active && this.strokes.length) { this.redoStack.push(this.strokes.pop()); this.redraw(); this.onUpdate(true); } }
  redo() { if (!this.active && this.redoStack.length) { this.strokes.push(this.redoStack.pop()); this.redraw(); this.onUpdate(true); } }
  destroy() { this.events.abort(); }
}
