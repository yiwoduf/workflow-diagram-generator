// Pure HTML/SVG string builders for every diagram primitive.
// All coordinates are absolute px on the SIZE x SIZE canvas.
import { SIZE } from './constants.js'
import { iconSVG } from './icons.js'

/** Pick a readable text color for a solid badge of the given hex background. */
function contrastText(hex) {
  let h = hex.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/(.)/g, '$1$1') // expand #abc -> #aabbcc
  const m = /^([0-9a-f]{6})$/i.exec(h)
  if (!m) return '#ffffff'
  const v = parseInt(m[1], 16)
  const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255
  // Perceived luminance (ITU-R BT.601)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#0e0e14' : '#ffffff'
}

export function zoneHTML(z) {
  const tint = z.color || '#8a8a99'
  return `<div class="zone" style="left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px;border-color:${tint}33">
    <div class="zone-label" style="color:${tint};border-color:${tint}55">${z.label}</div>
  </div>`
}

export function hubHTML(h) {
  return `<div class="hub" style="left:${h.x}px;top:${h.y}px;width:${h.w}px;height:${h.h}px;
      background:linear-gradient(135deg,${h.color}1f,${h.color}05);border-color:${h.color}55">
    <div class="hub-ico" style="color:${h.color};background:${h.color}24;border-color:${h.color}45">${iconSVG(h.icon, 58)}</div>
    <div class="hub-text">
      <div class="hub-name">${h.name}<span class="step-badge" style="background:${h.color};color:${contrastText(h.color)}">${h.step}</span></div>
      <div class="hub-sub">${h.sub}</div>
    </div>
    <div class="hub-tags">${(h.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
  </div>`
}

export function nodeHTML(n) {
  return `<div class="card" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">
    <div class="card-top" style="background:linear-gradient(90deg,${n.color},${n.color}00)"></div>
    <div class="step-badge card-badge" style="background:${n.color};color:${contrastText(n.color)}">${n.step}</div>
    <div class="card-ico" style="color:${n.color};background:${n.color}1a;border-color:${n.color}40">${iconSVG(n.icon, n.iconPx || 50)}</div>
    <div class="card-name">${n.name}</div>
    <div class="card-sub">${n.sub}</div>
  </div>`
}

export function chipHTML(c) {
  return `<div class="chip" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px">
    ${c.icon ? `<span class="chip-ico">${iconSVG(c.icon, 18)}</span>` : ''}
    <span class="chip-t">${c.t}</span>
  </div>`
}

/** Filled triangular arrowhead with its tip at (x, y), pointing toward `dir`. */
function arrowHead(x, y, dir, color) {
  const w = 8, l = 13
  let d
  if (dir === 'down') d = `M${x - w} ${y - l} L${x} ${y} L${x + w} ${y - l}`
  else if (dir === 'up') d = `M${x - w} ${y + l} L${x} ${y} L${x + w} ${y + l}`
  else if (dir === 'left') d = `M${x + l} ${y - w} L${x} ${y} L${x + l} ${y + w}`
  else d = `M${x - l} ${y - w} L${x} ${y} L${x - l} ${y + w}`
  return `<path d="${d} Z" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`
}

export function wiresSVG(wires) {
  const lines = wires
    .map(
      (w) =>
        `<path id="path-${w.id}" d="${w.d}" fill="none" stroke="${w.color}" stroke-width="${w.width || 2.6}" stroke-linejoin="round" stroke-linecap="round"${w.dashed ? ' stroke-dasharray="8 9"' : ''}/>`
    )
    .join('')
  const heads = wires
    .filter((w) => w.dir)
    .map((w) => arrowHead(w.hx, w.hy, w.dir, w.color))
    .join('')
  return `<svg class="wires" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${lines}${heads}</svg>`
}

export function labelsHTML(labels) {
  return (labels || [])
    .map((l) => {
      const c = l.color || '#8a8a99'
      return `<div class="wlabel ${l.cls || ''}" style="left:${l.x}px;top:${l.y}px;color:${c};border-color:${c}55">${l.t}</div>`
    })
    .join('')
}

export function legendHTML(legend) {
  if (!legend || !legend.length) return ''
  const items = legend
    .map((it) => {
      const dash = it.style === 'dashed' ? ' stroke-dasharray="6 6"' : ''
      return `<span class="legend-item">
        <svg width="34" height="10"><path d="M2 5 H32" stroke="${it.color}" stroke-width="2.6" stroke-linecap="round"${dash}/></svg>${it.t}
      </span>`
    })
    .join('')
  return `<div class="legend">${items}</div>`
}

/** Full inner markup of one diagram frame. */
export function frameHTML(spec) {
  const m = spec.meta
  return `
    <div class="bg-grid"></div>
    <div class="header">
      <div class="title-wrap">
        <div class="title-bar"></div>
        <div class="title"><span class="hl">${m.titleHl}</span><br>${m.titleRest}</div>
      </div>
      ${m.live ? `<div class="live-pill"><span class="live-dot"></span>${m.live}</div>` : ''}
    </div>
    <div class="subtitle">${m.subtitle}</div>

    ${(spec.zones || []).map(zoneHTML).join('')}
    ${spec.hub ? hubHTML(spec.hub) : ''}
    ${wiresSVG(spec.wires || [])}
    ${labelsHTML(spec.labels)}
    ${(spec.chips || []).map(chipHTML).join('')}
    ${(spec.nodes || []).map(nodeHTML).join('')}
    ${legendHTML(m.legend)}

    <div class="footer">
      <span class="fn-name">${m.footerName}</span><span class="fn-sep">·</span>${m.footerRole}<span class="fn-brand">${m.brand}</span>
    </div>`
}
