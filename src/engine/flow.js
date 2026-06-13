// Flow-dot animation: animated dots travelling along wire paths.
// The controller drives the live preview via requestAnimationFrame and can be
// sampled at any phase for deterministic GIF frame composition.
import { FLOW_PERIOD } from './constants.js'

export class FlowController {
  /**
   * @param {HTMLElement} frame — the diagram frame element (already rendered)
   * @param {Array} wires — spec wires; entries with `dots > 0` get flow dots
   */
  constructor(frame, wires) {
    this.layer = document.createElement('div')
    this.layer.className = 'dot-layer'
    frame.appendChild(this.layer)

    this.dots = []
    for (const w of wires) {
      if (!w.dots) continue
      const path = frame.querySelector(`#path-${w.id}`)
      if (!path) continue
      const pathLen = path.getTotalLength()
      for (let k = 0; k < w.dots; k++) {
        const el = document.createElement('div')
        el.className = 'dot'
        el.style.background = w.color
        el.style.boxShadow = `0 0 10px ${w.color}`
        this.layer.appendChild(el)
        this.dots.push({ el, path, pathLen, color: w.color, offset: k / w.dots })
      }
    }

    this.phase = 0
    this._last = null
    this._raf = null
    this._disposed = false
    this._position(0)
  }

  /** Dot positions at a given phase (0..1) — used for export composition. */
  sample(phase) {
    return this.dots.map((d) => {
      const t = (((phase + d.offset) % 1) + 1) % 1
      const p = d.path.getPointAtLength(t * d.pathLen)
      return { x: p.x, y: p.y, color: d.color }
    })
  }

  _position(phase) {
    for (const d of this.dots) {
      const t = (((phase + d.offset) % 1) + 1) % 1
      const p = d.path.getPointAtLength(t * d.pathLen)
      d.el.style.left = p.x - 6.5 + 'px'
      d.el.style.top = p.y - 6.5 + 'px'
    }
  }

  start() {
    if (this._disposed || this._raf) return
    this._last = null
    const tick = (ts) => {
      if (this._last !== null) this.phase = (this.phase + (ts - this._last) / 1000 / FLOW_PERIOD) % 1
      this._last = ts
      this._position(this.phase)
      this._raf = requestAnimationFrame(tick)
    }
    this._raf = requestAnimationFrame(tick)
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
  }

  /** Hide/show the live dot layer (hidden during base capture for export). */
  setVisible(visible) {
    this.layer.style.display = visible ? '' : 'none'
  }

  dispose() {
    this._disposed = true
    this.stop()
    this.layer.remove()
    this.dots = []
  }
}
