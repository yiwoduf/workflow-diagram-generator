// Global rendering constants.

/** Square canvas size (px). All spec coordinates are authored against this. */
export const SIZE = 1500

/** Background color painted behind every export. */
export const BG = '#0e0e14'

/** Seconds for one full flow-dot cycle (also the GIF loop duration). */
export const FLOW_PERIOD = 2.6

/** Frames per GIF loop. One cycle spread across all frames loops seamlessly. */
export const GIF_FRAMES = 30

/** gif.js encoder quality (lower = better quality, slower encode). */
export const GIF_QUALITY = 8
