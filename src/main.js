import './style.css'
import { renderDiagram } from './engine/render.js'

// Every spec in /diagrams is auto-discovered — drop a file there and it shows
// up in the selector. (Subfolders like _archive/ are intentionally excluded.)
const modules = import.meta.glob('../diagrams/*.js')

const diagrams = Object.entries(modules)
  .map(([path, loader]) => ({ id: path.match(/([^/]+)\.js$/)[1], loader }))
  .sort((a, b) => a.id.localeCompare(b.id))

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="page">
    <div class="toolbar">
      <label class="toolbar-label" for="diagramSelect">diagram</label>
      <select id="diagramSelect" ${diagrams.length === 0 ? 'disabled' : ''}>
        ${diagrams.map((d) => `<option value="${d.id}">${d.id}</option>`).join('')}
      </select>
      <span class="toolbar-spacer"></span>
      <button id="gifBtn">● Record GIF</button>
      <button id="pngBtn">⬇ Download PNG</button>
      <span id="status" role="status"></span>
    </div>
    <div id="stage"></div>
  </div>`

const select = document.getElementById('diagramSelect')
const stage = document.getElementById('stage')
const statusEl = document.getElementById('status')
const pngBtn = document.getElementById('pngBtn')
const gifBtn = document.getElementById('gifBtn')

const setStatus = (t) => { statusEl.textContent = t }

let active = null
let exporting = false

async function load(id) {
  const entry = diagrams.find((d) => d.id === id) || diagrams[0]
  if (!entry) {
    setStatus('no diagrams found in /diagrams')
    return
  }
  setStatus('loading…')
  try {
    const mod = await entry.loader()
    if (active) active.dispose()
    active = renderDiagram(mod.default, stage)
    select.value = entry.id
    localStorage.setItem('diagram', entry.id)
    const url = new URL(window.location)
    url.searchParams.set('d', entry.id)
    window.history.replaceState(null, '', url)
    setStatus('')
  } catch (e) {
    setStatus(`failed to load "${entry.id}": ${e.message}`)
    console.error(e)
  }
}

async function runExport(kind) {
  if (!active || exporting) return
  exporting = true
  pngBtn.disabled = gifBtn.disabled = select.disabled = true
  try {
    await (kind === 'png' ? active.exportPNG(setStatus) : active.recordGIF(setStatus))
  } catch (e) {
    setStatus('error: ' + e.message)
    console.error(e)
  } finally {
    exporting = false
    pngBtn.disabled = gifBtn.disabled = select.disabled = false
  }
}

select.onchange = () => load(select.value)
pngBtn.onclick = () => runExport('png')
gifBtn.onclick = () => runExport('gif')

const initial =
  new URLSearchParams(window.location.search).get('d') ||
  localStorage.getItem('diagram') ||
  (diagrams[0] && diagrams[0].id)
load(initial)
