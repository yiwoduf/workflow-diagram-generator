# CLAUDE.md

This is an AI-driven diagram generator: the user describes a workflow or
architecture diagram in chat, the AI writes a declarative spec under
`diagrams/`, and the user previews it at `http://localhost:5173` and exports
PNG/GIF from the browser.

## The one rule

**Diagram content lives in `diagrams/*.js` specs. Engine code in `src/engine/`
is generic and rarely changes.** When asked for a new or modified diagram,
write a spec — don't special-case the engine. New brand icons are the only
common engine touch (register them in `src/engine/icons.js`).

## Read first

`diagrams/INSTRUCTIONS.md` — the complete authoring guide: spec format,
1500×1500 coordinate system, icon registry, color rules, layout/label rules,
and the verification loop.

## Commands

- `npm run dev` — dev server on :5173 (strict port)
- `npm run shot -- <diagram-id>` — headless screenshot to `.shots/`, fails on
  console errors (requires dev server + `npx playwright install chromium`)

## Verification loop

After writing or editing a spec: run `npm run shot -- <id>`, read the produced
image, and fix overlaps/clipping BEFORE reporting done. Archive replaced specs
in `diagrams/_archive/`.
