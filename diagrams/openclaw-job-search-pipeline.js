// Diagram spec: Autonomous Job-Search Pipeline  (canvas 1500x1500)
// See diagrams/INSTRUCTIONS.md for the authoring guide.
const ACCENT = '#ff6a1a' // primary data flow
const CLAW = '#FF4D4D'   // OpenClaw brand red
const MUTED = '#7d7d8c'  // control / loop / data-read wires

export default {
  meta: {
    slug: 'openclaw-job-search-pipeline',
    titleHl: 'OpenClaw',
    titleRest: 'Job-Search Pipeline',
    subtitle: 'Autonomous multi-agent pipeline — n8n-orchestrated, OpenClaw-powered, zero human in the loop.',
    live: 'LIVE · 24/7',
    legend: [
      { t: 'data flow', color: ACCENT, style: 'solid' },
      { t: 'control · loop', color: MUTED, style: 'dashed' },
    ],
    footerName: 'Jaeyol (Peter) Lee',
    footerRole: 'System design · Agent orchestration · Harness engineering',
    brand: 'leeable.dev',
  },

  zones: [
    { label: 'PHASE 01 · INGEST & EVALUATE', color: '#00C2A8', x: 72, y: 445, w: 1356, h: 400 },
    { label: 'PHASE 02 · ANALYZE & REPORT',  color: '#a78bfa', x: 72, y: 885, w: 1356, h: 400 },
  ],

  // n8n orchestrator (control plane — triggers both phases)
  hub: {
    icon: 'n8n', color: '#EA4B71', name: 'n8n', step: '1',
    sub: 'Orchestrator — 7 AM cron trigger · webhook loop rules',
    tags: ['cron', 'webhook', 'loop'],
    x: 72, y: 240, w: 1356, h: 140,
  },

  nodes: [
    // phase 1 — ingest & evaluate
    { step: '2', name: 'Apify',    sub: 'Crawl job postings',      icon: 'apify',    color: '#00C2A8', x: 96,   y: 515, w: 270, h: 280 },
    { step: '3', name: 'Supabase', sub: 'Store + dedupe',          icon: 'supabase', color: '#3FCF8E', x: 442,  y: 515, w: 270, h: 280 },
    { step: '4', name: 'OpenClaw', sub: 'LLM eval · MCP',          icon: 'openclaw', color: CLAW,      x: 788,  y: 515, w: 270, h: 280 },
    { step: '5', name: 'Notion',   sub: 'Pipeline board',          icon: 'notion',   color: '#ffffff', x: 1134, y: 515, w: 270, h: 280 },
    // phase 2 — analyze & report
    { step: '6', name: 'OpenClaw', sub: 'position-analyst',        icon: 'openclaw', color: CLAW,      x: 600,  y: 955, w: 300, h: 280 },
    { step: '7', name: 'Discord',  sub: 'Report + digest',         icon: 'discord',  color: '#5865F2', x: 1134, y: 955, w: 270, h: 280 },
  ],

  // data sources the position-analyst reads (inputs, NOT the trigger flow)
  chips: [
    { id: 'cp1', t: 'Notion entries · MCP', icon: 'notion',  x: 120, y: 1005, w: 290, h: 60 },
    { id: 'cp2', t: 'candidate profile',    icon: 'profile', x: 120, y: 1115, w: 290, h: 60 },
  ],

  wires: [
    // phase-1 flow (solid)
    { id: 'c0', d: 'M231 380 L231 515',    dir: 'down',  hx: 231,  hy: 515,  color: ACCENT, dots: 2 },
    { id: 'c1', d: 'M366 655 L442 655',    dir: 'right', hx: 442,  hy: 655,  color: ACCENT, dots: 1 },
    { id: 'c2', d: 'M712 655 L788 655',    dir: 'right', hx: 788,  hy: 655,  color: ACCENT, dots: 1 },
    { id: 'c3', d: 'M1058 655 L1134 655',  dir: 'right', hx: 1134, hy: 655,  color: ACCENT, dots: 1 },
    // feedback loop THROUGH n8n (dashed): Notion -> webhook -> n8n -> loop workflow -> analyst
    { id: 'wh', d: 'M1269 515 L1269 380',  dir: 'up',    hx: 1269, hy: 380,  color: MUTED, dashed: true, dots: 2 },
    // routed down the clear left margin so it never crosses a data arrow
    { id: 'lp', d: 'M84 380 L84 910 L750 910 L750 955', dir: 'down', hx: 750, hy: 955, color: MUTED, dashed: true, dots: 3 },
    // phase-2 output (solid)
    { id: 'rp', d: 'M900 1095 L1134 1095', dir: 'right', hx: 1134, hy: 1095, color: ACCENT, dots: 1 },
    // analyst data reads (dashed inputs)
    { id: 'i1', d: 'M410 1035 L600 1035',  dir: 'right', hx: 600,  hy: 1035, color: MUTED, dashed: true, dots: 1 },
    { id: 'i2', d: 'M410 1145 L600 1145',  dir: 'right', hx: 600,  hy: 1145, color: MUTED, dashed: true, dots: 1 },
  ],

  // labels sit in the clear band BELOW each zone label and ABOVE the node row,
  // or in the inter-zone band — never on top of card text.
  labels: [
    { t: 'trigger',       x: 231,  y: 486,  color: ACCENT },
    { t: 'webhook',       x: 1269, y: 486,  color: MUTED },
    { t: 'worthwhile',    x: 1096, y: 486,  color: ACCENT },
    { t: 'loop workflow', x: 417,  y: 910,  color: MUTED },
    { t: 'report',        x: 1017, y: 1072, color: ACCENT },
  ],
}
