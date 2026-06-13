// Diagram renderer: mounts a spec into a container and returns a handle for
// exporting and disposal. Only one diagram is live at a time.
import { SIZE } from './constants.js'
import { frameHTML } from './markup.js'
import { FlowController } from './flow.js'
import { exportPNG, recordGIF } from './exporter.js'

/**
 * Render a diagram spec.
 * @param {object} spec — see diagrams/INSTRUCTIONS.md for the format
 * @param {HTMLElement} mount — container that receives the frame
 * @returns {{ exportPNG(onStatus): Promise<void>,
 *             recordGIF(onStatus): Promise<void>,
 *             dispose(): void }}
 */
export function renderDiagram(spec, mount) {
  mount.innerHTML = `
    <div class="frame-wrap" id="frameWrap">
      <div class="frame" id="frame">${frameHTML(spec)}</div>
    </div>`

  const frame = mount.querySelector('#frame')
  const frameWrap = mount.querySelector('#frameWrap')

  // Scale the on-screen preview to the viewport while the frame itself stays
  // a true SIZE x SIZE element (exports always render at full resolution).
  function fitPreview() {
    const avail = Math.min(window.innerWidth - 56, SIZE)
    const scale = Math.min(1, avail / SIZE)
    frame.style.transform = `scale(${scale})`
    frame.style.transformOrigin = 'top left'
    frameWrap.style.width = SIZE * scale + 'px'
    frameWrap.style.height = SIZE * scale + 'px'
  }
  fitPreview()
  window.addEventListener('resize', fitPreview)

  const flow = new FlowController(frame, spec.wires || [])
  flow.start()

  const slug = spec.meta.slug || 'diagram'
  return {
    exportPNG: (onStatus) => exportPNG(frame, flow, slug, onStatus),
    recordGIF: (onStatus) => recordGIF(frame, flow, slug, onStatus),
    dispose() {
      window.removeEventListener('resize', fitPreview)
      flow.dispose()
      mount.innerHTML = ''
    },
  }
}
