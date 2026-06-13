# Diagram Authoring Guide (for AI assistants)

This project turns a **declarative spec** into a polished, square architecture
diagram that the user previews in the browser and downloads as **PNG** or an
animated **GIF**. When the user asks for a diagram, your job is to write or
modify a spec file under `diagrams/` — never hand-edit the engine for content.

## How it works

```
diagrams/
  <name>.js            ← a diagram spec (data only). THIS is what you write.
  INSTRUCTIONS.md      ← this file.
  _archive/            ← old versions / backups (excluded from the selector).
src/
  main.js              ← app shell: diagram selector + export buttons.
  engine/
    constants.js       ← canvas SIZE, GIF settings.
    icons.js           ← icon registry (simple-icons + custom SVG).
    markup.js          ← HTML/SVG builders for every primitive.
    flow.js            ← animated flow-dot controller.
    exporter.js        ← PNG/GIF capture pipeline.
    render.js          ← mounts a spec, returns an export/dispose handle.
scripts/screenshot.mjs ← headless verification (npm run shot).
```

**Every `diagrams/*.js` file is auto-discovered** and appears in the in-app
selector — no imports to edit. Files in subfolders (`_archive/`) are ignored.

**Git: personal diagrams stay local.** `diagrams/*.js` is gitignored except the
two bundled examples (`.gitignore` whitelists them). New specs you author work
locally but are NOT committed by default — that's intentional. To share one
publicly, add a `!diagrams/<name>.js` line to `.gitignore`.

### Workflow when the user requests a new or updated diagram

1. If replacing an existing diagram, copy the current spec into
   `diagrams/_archive/` so nothing is lost.
2. Write the spec as `diagrams/<kebab-name>.js` (`export default { ... }`).
3. Verify: with `npm run dev` running, `npm run shot -- <kebab-name>` writes
   `.shots/<name>.png` and fails on console errors. Read the image and check
   for overlaps/clipping before telling the user it is done.
4. The user picks the diagram in the dropdown and exports PNG/GIF.

## Canvas

- The frame is **1500 × 1500** (square). Origin is **top-left**, units = px.
- `SIZE` lives in `src/engine/constants.js`. If you ever change it, re-derive
  all spec coordinates.
- The on-screen preview auto-scales to the viewport; exports are always 1500².

## Spec shape

```js
export default {
  meta: {
    slug,                 // export filename base
    titleHl, titleRest,   // highlighted + plain title parts
    subtitle,
    live,                 // pill text (e.g. 'LIVE · 24/7'), or '' to hide
    legend: [             // optional wire-style legend (bottom-right)
      { t: 'data flow', color: '#ff6a1a', style: 'solid' },
      { t: 'control · loop', color: '#7d7d8c', style: 'dashed' },
    ],
    footerName, footerRole, brand,
  },
  zones:  [ { label, color?, x, y, w, h } ],        // section backdrops (behind everything)
  hub:    { icon, color, name, step, sub, tags: [], x, y, w, h },  // optional wide control bar
  nodes:  [ { step, name, sub, icon, color, x, y, w, h, iconPx? } ],
  chips:  [ { id, t, icon?, x, y, w, h } ],          // small side inputs / annotations
  wires:  [ { id, d, dir, hx, hy, color, dashed?, dots, width? } ],
  labels: [ { t, x, y, color?, cls? } ],             // (x,y) = chip CENTER; cls:'rot' = vertical
}
```

### Icons (`icon` fields)

Registry keys live in `src/engine/icons.js`: `n8n`, `supabase`, `notion`,
`discord`, `nextdotjs`, `vercel`, `openai`, `apify`, `profile`, `openclaw`.

To add a brand logo (use one not already registered):

- **Preferred:** import from `simple-icons`
  (`import { siStripe } from 'simple-icons'`) and register
  `stripe: { path: siStripe.path }`. Thousands of brands ship as a single
  24×24 path. Brand hex: `siStripe.hex`.
- **No simple-icon?** Register `{ inner: '<inner markup, viewBox 0 0 24>' }`
  using `currentColor` so it inherits the node color, or
  `{ raw: '<full inner incl. fills + <defs>>' }` for multi-color logos.
  Ids inside `raw` entries are auto-scoped per use, so duplicates are safe.

### Colors

- Primary data flow: `#ff6a1a` (orange). Secondary wires (loops, control,
  data reads): `#7d7d8c` (muted) + `dashed: true`.
- Node `color` should be the **real brand color** (simple-icons `.hex`).
  It drives the gradient top bar, the icon tile, and the numbered step badge.
  Badge text auto-switches dark/light based on luminance.
- Use white (`#ffffff`) for logos that are natively black (e.g. Notion).
- Zone `color` tints the zone border + label pill — pick one hue per phase.

### Wires

- `d` is a raw SVG path. Use straight H/V segments with right-angle elbows
  (`M x1 y1 L x2 y2 L x3 y3`). The engine draws a filled arrowhead for you.
- `dir` ∈ `up|down|left|right` = arrowhead direction; `(hx, hy)` = the tip,
  which must equal the path's end point.
- `dashed: true` for control/loop/data-read wires; solid for the main flow.
- `dots: N` puts N animated flow dots on the wire (this is what animates in
  the GIF). Use 1–2 per wire; 0 for static connectors.

## Layout rules (make it look like a real architecture diagram)

1. **Sections.** Group stages into `zones` with an uppercase label
   (`PHASE 01 · …`) and a distinct tint per phase.
2. **Numbered steps.** Use short sequential `step` values (`1`, `2`, …) so the
   reading order is obvious — they render as colored circular badges.
3. **Breathing room.** With 4 nodes across, ~270px wide nodes + ~76px gaps fit
   the 1356px content width (x 72→1428). Leave gaps wide enough for arrows AND
   labels.
4. **No clipping / no hidden labels.** `.card-sub` wraps, so long sub text is
   fine — but keep `name` short. Wire labels render above cards as opaque
   chips, so they can never be hidden — but still place them in clear space:
   - **Vertical** arrows crossing a zone edge → label in the band between the
     zone label and the node row (node-row top − ~30px), and ≥ ~45px from the
     zone's own corner label.
   - **Horizontal** arrows in a narrow gap → label just ABOVE the arrow, at an
     x where the chip overlaps card *padding* only, never card text
     (text area = card.x+26 … card.x+w−26).
   - Loop/feedback labels → the inter-zone band.
   Never sit a label directly on a short arrow (it hides the whole arrow).
5. **Route wires through gaps.** A vertical wire crossing a node row must pass
   through the GAP between two nodes (compute the gap center x).
   Perpendicular crossings are fine; overlapping a node is not.
6. **Flow reads left→right, top→bottom.** Use a control hub (e.g. n8n) when
   one service triggers multiple phases, and route loops back through it
   instead of drawing a misleading direct edge. Show "reads/uses" data
   dependencies as dashed inputs or chips, distinct from the trigger flow.
7. **Consistent sizing.** Same node size within a row; align rows on a grid.
8. **Fill the square.** Avoid large empty bands; scale node sizes and zone
   heights so content occupies the canvas.

## Verifying before handoff

- `npm run shot -- <name>` (dev server must be running), then READ the
  produced `.shots/<name>.png` and scan for overlaps, clipping, crossings.
- The script exits non-zero on any console error.
- Spot-check an actual PNG export if you changed the engine.

## Export behavior (already wired)

- **Download PNG** → `<slug>.png`, full 1500×1500.
- **Record GIF** → `<slug>.gif`, seamless 30-frame loop of the flow dots,
  downscaled to `GIF_SIZE` (default 900) to keep the file small. The GIF
  pipeline captures the static frame once and composes dots natively per frame
  — only `dots` wires animate. CSS animations do NOT appear in exports
  (html2canvas renders static styles), so anything that must move in the GIF
  needs a `dots` wire.
- GIF size knobs live in `src/engine/constants.js`: `GIF_SIZE` (resolution —
  the biggest lever, file size scales with its square), `GIF_FRAMES` (smoothness
  vs size), `GIF_QUALITY`. For extra-small output, post-process offline with
  `gifsicle -O3 --lossy` or export to WebM/MP4 instead.
