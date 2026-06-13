// Headless verification helper for the AI authoring loop.
//
//   npm run shot                    -> screenshots the default diagram
//   npm run shot -- <diagram-id>    -> screenshots a specific diagram
//
// Writes .shots/<id>.png (full frame at 1500x1500 scaled by the preview) and
// prints any console/page errors. Requires the dev server on :5173 and
// `npx playwright install chromium` once beforehand.
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const id = process.argv[2] || ''
const url = `http://localhost:5173/${id ? `?d=${id}` : ''}`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1700 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

try {
  await page.goto(url, { waitUntil: 'networkidle' })
} catch (e) {
  console.error(`Could not reach ${url} — is \`npm run dev\` running?`)
  process.exit(1)
}
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(800)

const frame = await page.$('#frame')
if (!frame) {
  console.error('No #frame rendered. Errors:', errors)
  process.exit(1)
}
mkdirSync('.shots', { recursive: true })
const name = await page.evaluate(() => document.getElementById('diagramSelect').value)
const out = `.shots/${name}.png`
await frame.screenshot({ path: out })
console.log(`saved ${out}`)
console.log('console errors:', errors.length ? errors : 'none')
await browser.close()
process.exit(errors.length ? 1 : 0)
