// Global rendering constants.

/** Square canvas size (px). All spec coordinates are authored against this. */
export const SIZE = 1500

/** Background color painted behind every export. */
export const BG = '#0e0e14'

/** Seconds for one full flow-dot cycle (also the GIF loop duration). */
export const FLOW_PERIOD = 2.6

/** Frames per GIF loop. One cycle spread across all frames loops seamlessly. */
export const GIF_FRAMES = 30

/**
 * GIF output resolution (px, square). Smaller than SIZE because GIF is capped
 * at 256 colors with weak (LZW) compression, so file size scales with pixel
 * count. PNG always exports at full SIZE; only the GIF is downscaled.
 * 800 is the social sweet spot — sharp, plays everywhere, well under upload caps.
 */
export const GIF_SIZE = 800

// --- MP4 (H.264) export ---------------------------------------------------
// The right format for LinkedIn and feeds: real video animates (LinkedIn
// flattens uploaded GIFs) and H.264 is ~10–30× smaller than GIF at equal
// quality. Encoded in-browser via WebCodecs; needs a Chromium-based browser.

/** MP4 resolution (px, square). 1080 is the standard square-video size. */
export const MP4_SIZE = 1080

/** MP4 frame rate. 30 fps reads as smooth motion. */
export const MP4_FPS = 30

/** Whole flow cycles encoded. ≥2 keeps the clip past the ~3s autoplay minimum. */
export const MP4_LOOPS = 2

/** Target bitrate (bps). Low-motion content stays well under this with VBR. */
export const MP4_BITRATE = 4_000_000

/** gif.js encoder quality (lower = better quality, slower encode). */
export const GIF_QUALITY = 8
