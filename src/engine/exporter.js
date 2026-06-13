// PNG / GIF export pipeline.
//
// Performance note: html2canvas is the slow step (~0.5–1s per capture at
// 1500x1500). Instead of re-capturing the DOM for every GIF frame, the static
// diagram is captured ONCE (with the dot layer hidden) and each frame is then
// composed natively on a 2D canvas: base image + flow dots drawn at the
// sampled phase. This makes GIF recording ~30x faster and frame-perfect.
import GIF from 'gif.js'
import html2canvas from 'html2canvas'
import { SIZE, BG, FLOW_PERIOD, GIF_FRAMES, GIF_QUALITY } from './constants.js'

/** Capture the static diagram (no flow dots) at full resolution. */
async function captureBase(frame, flow) {
  await document.fonts.ready
  flow.setVisible(false)
  try {
    return await html2canvas(frame, {
      width: SIZE,
      height: SIZE,
      windowWidth: SIZE,
      windowHeight: SIZE,
      scale: 1,
      backgroundColor: BG,
      useCORS: true,
      logging: false,
      onclone: (doc) => {
        // Neutralize the on-screen preview scaling so the export is 1:1.
        const f = doc.getElementById('frame')
        if (f) f.style.transform = 'none'
        const fw = doc.getElementById('frameWrap')
        if (fw) {
          fw.style.width = SIZE + 'px'
          fw.style.height = SIZE + 'px'
        }
      },
    })
  } finally {
    flow.setVisible(true)
  }
}

/** Compose one frame: static base + glowing flow dots at the given positions. */
function composeFrame(base, dotStates) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(base, 0, 0)
  for (const d of dotStates) {
    ctx.save()
    ctx.shadowColor = d.color
    ctx.shadowBlur = 10
    ctx.fillStyle = d.color
    ctx.beginPath()
    ctx.arc(d.x, d.y, 6.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  return canvas
}

function download(href, filename) {
  const a = document.createElement('a')
  a.download = filename
  a.href = href
  a.click()
}

/**
 * Export the current diagram as a PNG.
 * @returns {Promise<void>} resolves once the download has been triggered.
 */
export async function exportPNG(frame, flow, slug, onStatus) {
  onStatus('rendering…')
  const base = await captureBase(frame, flow)
  const canvas = composeFrame(base, flow.sample(flow.phase))
  download(canvas.toDataURL('image/png'), `${slug}.png`)
  onStatus('PNG saved ✓')
}

/**
 * Record a seamless-loop GIF (one full flow cycle across GIF_FRAMES frames).
 * @returns {Promise<void>} resolves once the download has been triggered.
 */
export async function recordGIF(frame, flow, slug, onStatus) {
  onStatus('capturing…')
  flow.stop()
  try {
    const base = await captureBase(frame, flow)
    const delay = Math.round((FLOW_PERIOD * 1000) / GIF_FRAMES)
    const workers = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1))
    const gif = new GIF({
      workers,
      quality: GIF_QUALITY,
      width: SIZE,
      height: SIZE,
      // Resolve against the deploy base so it works under a non-root base path.
      workerScript: import.meta.env.BASE_URL + 'gif.worker.js',
    })
    for (let i = 0; i < GIF_FRAMES; i++) {
      gif.addFrame(composeFrame(base, flow.sample(i / GIF_FRAMES)), { delay })
      onStatus(`composing ${i + 1}/${GIF_FRAMES}…`)
    }
    await new Promise((resolve, reject) => {
      // gif.js has no 'error' event; guard against a worker that never loads so
      // the UI recovers instead of hanging with the buttons stuck disabled.
      const timer = setTimeout(() => reject(new Error('GIF encoding timed out')), 60000)
      const settle = (fn) => (arg) => { clearTimeout(timer); fn(arg) }
      gif.on('progress', (p) => onStatus(`encoding ${Math.round(p * 100)}%…`))
      gif.on('finished', settle((blob) => {
        download(URL.createObjectURL(blob), `${slug}.gif`)
        onStatus('GIF saved ✓')
        resolve()
      }))
      gif.on('abort', settle(() => reject(new Error('GIF encoding aborted'))))
      gif.render()
    })
  } finally {
    flow.start()
  }
}
