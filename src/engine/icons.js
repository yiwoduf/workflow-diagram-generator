// Icon registry.
//
// Three kinds of entries are supported:
//   { path }  — a single 24x24 path filled with currentColor (simple-icons format)
//   { inner } — arbitrary inner SVG markup using currentColor (custom monochrome)
//   { raw }   — full inner markup with its own fills/<defs> (multi-color brand logos)
//
// Gradient/clip ids inside `raw` entries are auto-scoped per use so the same
// logo can appear multiple times in one document without id collisions.
import {
  siN8n,
  siSupabase,
  siNotion,
  siDiscord,
  siNextdotjs,
  siVercel,
  siOpenai,
} from 'simple-icons'

const registry = {
  n8n: { path: siN8n.path },
  supabase: { path: siSupabase.path },
  notion: { path: siNotion.path },
  discord: { path: siDiscord.path },
  nextdotjs: { path: siNextdotjs.path },
  vercel: { path: siVercel.path },
  openai: { path: siOpenai.path },

  // Apify has no simple-icons entry — custom crawler mark.
  apify: {
    inner: `<circle cx="12" cy="12" r="3.3" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none">
        <path d="M12 8.7V3M12 15.3V21M8.7 12H3M15.3 12H21M9.6 9.6 6.1 6.1M14.4 9.6 17.9 6.1M9.6 14.4 6.1 17.9M14.4 14.4 17.9 17.9"/>
      </g>`,
  },

  // Generic person/profile glyph for candidate-style inputs.
  profile: {
    inner: `<path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-9 2-9 6v2h18v-2c0-4-5-6-9-6Z"/>`,
  },

  // OpenClaw — official brand logo (red lobster mark).
  openclaw: {
    raw: `<title>OpenClaw</title><path d="M12 2.568c-6.33 0-9.495 5.275-9.495 9.495 0 4.22 3.165 8.44 6.33 9.494v2.11h2.11v-2.11s1.055.422 2.11 0v2.11h2.11v-2.11c3.165-1.055 6.33-5.274 6.33-9.494S18.33 2.568 12 2.568z" fill="url(#oc-fill-0)"></path><path d="M3.56 9.953C.396 8.898-.66 11.008.396 13.118c1.055 2.11 3.164 1.055 4.22-1.055.632-1.477 0-2.11-1.056-2.11z" fill="url(#oc-fill-1)"></path><path d="M20.44 9.953c3.164-1.055 4.22 1.055 3.164 3.165-1.055 2.11-3.164 1.055-4.22-1.055-.632-1.477 0-2.11 1.056-2.11z" fill="url(#oc-fill-2)"></path><path d="M5.507 1.875c.476-.285 1.036-.233 1.615.037.577.27 1.223.774 1.937 1.488a.316.316 0 01-.447.447c-.693-.693-1.279-1.138-1.757-1.361-.475-.222-.795-.205-1.022-.069a.317.317 0 01-.326-.542zM16.877 1.913c.58-.27 1.14-.323 1.616-.038a.317.317 0 01-.326.542c-.227-.136-.547-.153-1.022.069-.478.223-1.064.668-1.756 1.361a.316.316 0 11-.448-.447c.714-.714 1.36-1.218 1.936-1.487z" fill="#FF4D4D"></path><path d="M8.835 9.109a1.266 1.266 0 100-2.532 1.266 1.266 0 000 2.532zM15.165 9.109a1.266 1.266 0 100-2.532 1.266 1.266 0 000 2.532z" fill="#050810"></path><path d="M9.046 8.16a.527.527 0 100-1.056.527.527 0 000 1.055zM15.376 8.16a.527.527 0 100-1.055.527.527 0 000 1.054z" fill="#00E5CC"></path><defs><linearGradient gradientUnits="userSpaceOnUse" id="oc-fill-0" x1="-.659" x2="27.023" y1=".458" y2="22.855"><stop stop-color="#FF4D4D"></stop><stop offset="1" stop-color="#991B1B"></stop></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="oc-fill-1" x1="0" x2="4.311" y1="9.672" y2="14.949"><stop stop-color="#FF4D4D"></stop><stop offset="1" stop-color="#991B1B"></stop></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="oc-fill-2" x1="19.385" x2="24.399" y1="9.953" y2="14.462"><stop stop-color="#FF4D4D"></stop><stop offset="1" stop-color="#991B1B"></stop></linearGradient></defs>`,
  },
}

let uid = 0

/** Render a registered icon as an inline SVG string. */
export function iconSVG(key, px) {
  const icon = registry[key]
  if (!icon) {
    console.warn(`[icons] unknown icon key "${key}"`)
    return ''
  }
  if (icon.raw) {
    // Scope every id="..."/url(#...) pair so repeated logos don't collide.
    const n = uid++
    const body = icon.raw
      .replace(/id="([\w-]+)"/g, `id="i${n}-$1"`)
      .replace(/url\(#([\w-]+)\)/g, `url(#i${n}-$1)`)
    return `<svg viewBox="0 0 24 24" width="${px}" height="${px}">${body}</svg>`
  }
  const body = icon.path ? `<path fill="currentColor" d="${icon.path}"/>` : icon.inner
  return `<svg viewBox="0 0 24 24" width="${px}" height="${px}">${body}</svg>`
}
