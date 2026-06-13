// PNG / GIF export pipeline.
//
// Performance note: html2canvas is the slow step (~0.5–1s per capture at
// 1500x1500). Instead of re-capturing the DOM for every GIF frame, the static
// diagram is captured ONCE (with the dot layer hidden) and each frame is then
// composed natively on a 2D canvas: base image + flow dots drawn at the
// sampled phase. This makes GIF recording ~30x faster and frame-perfect.
import GIF from 'gif.js'
import html2canvas from 'html2canvas'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import {
  SIZE,
  GIF_SIZE,
  BG,
  FLOW_PERIOD,
  GIF_FRAMES,
  GIF_QUALITY,
  MP4_SIZE,
  MP4_FPS,
  MP4_LOOPS,
  MP4_BITRATE,
} from './constants.js'

const MP4_CODEC = 'avc1.640028' // H.264 High @ 4.0 — broad playback support

/** Whether in-browser H.264 MP4 export is available (Chromium-based browsers). */
export function canExportMP4() {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

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

/**
 * Compose one frame at `outSize`: static base (downscaled if needed) + glowing
 * flow dots. Dot positions come in SIZE-space and are scaled to the output.
 */
function composeFrame(base, dotStates, outSize) {
  const s = outSize / SIZE
  const canvas = document.createElement('canvas')
  canvas.width = outSize
  canvas.height = outSize
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(base, 0, 0, outSize, outSize)
  for (const d of dotStates) {
    ctx.save()
    ctx.shadowColor = d.color
    ctx.shadowBlur = 10 * s
    ctx.fillStyle = d.color
    ctx.beginPath()
    ctx.arc(d.x * s, d.y * s, 6.5 * s, 0, Math.PI * 2)
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
  const canvas = composeFrame(base, flow.sample(flow.phase), SIZE)
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
      width: GIF_SIZE,
      height: GIF_SIZE,
      // Resolve against the deploy base so it works under a non-root base path.
      workerScript: import.meta.env.BASE_URL + 'gif.worker.js',
    })
    for (let i = 0; i < GIF_FRAMES; i++) {
      gif.addFrame(composeFrame(base, flow.sample(i / GIF_FRAMES), GIF_SIZE), { delay })
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

/**
 * Record a seamless-loop H.264 MP4 (MP4_LOOPS full cycles at MP4_FPS).
 * The best format for LinkedIn/social: it animates where GIFs are flattened,
 * at a fraction of the size. Requires WebCodecs (see canExportMP4).
 * @returns {Promise<void>} resolves once the download has been triggered.
 */
export async function recordMP4(frame, flow, slug, onStatus) {
  if (!canExportMP4()) throw new Error('MP4 export needs a Chromium-based browser')
  onStatus('capturing…')
  flow.stop()
  try {
    const base = await captureBase(frame, flow)
    const framesPerLoop = Math.round(FLOW_PERIOD * MP4_FPS)
    const total = framesPerLoop * MP4_LOOPS

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: MP4_SIZE, height: MP4_SIZE },
      fastStart: 'in-memory', // moov atom up front → streams/plays immediately
    })
    let encodeError = null
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { encodeError = e },
    })
    encoder.configure({
      codec: MP4_CODEC,
      width: MP4_SIZE,
      height: MP4_SIZE,
      bitrate: MP4_BITRATE,
      framerate: MP4_FPS,
    })

    const usPerFrame = 1e6 / MP4_FPS
    for (let i = 0; i < total; i++) {
      if (encodeError) throw encodeError
      const phase = (i % framesPerLoop) / framesPerLoop
      const canvas = composeFrame(base, flow.sample(phase), MP4_SIZE)
      const vframe = new VideoFrame(canvas, { timestamp: Math.round(i * usPerFrame), duration: Math.round(usPerFrame) })
      encoder.encode(vframe, { keyFrame: i % MP4_FPS === 0 })
      vframe.close()
      // Avoid unbounded encoder backpressure on slower machines.
      if (encoder.encodeQueueSize > MP4_FPS) await new Promise((r) => setTimeout(r, 0))
      onStatus(`encoding ${i + 1}/${total}…`)
    }

    await encoder.flush()
    encoder.close()
    if (encodeError) throw encodeError
    muxer.finalize()
    const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' })
    download(URL.createObjectURL(blob), `${slug}.mp4`)
    onStatus('MP4 saved ✓')
  } finally {
    flow.start()
  }
}
