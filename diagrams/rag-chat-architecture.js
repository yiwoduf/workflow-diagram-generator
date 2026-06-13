// Diagram spec: RAG Chat Architecture  (canvas 1500x1500)
// Second example — demonstrates a hub-less, two-zone layout with retrieval loop.
const ACCENT = '#ff6a1a' // request / data flow
const MUTED = '#7d7d8c'  // retrieval / embedding (dashed)

export default {
  meta: {
    slug: 'rag-chat-architecture',
    titleHl: 'RAG',
    titleRest: 'Chat Architecture',
    subtitle: 'Retrieval-augmented chat — Next.js streaming, pgvector search, grounded generation.',
    live: 'EDGE · SSE',
    legend: [
      { t: 'request flow', color: ACCENT, style: 'solid' },
      { t: 'embed · retrieve', color: MUTED, style: 'dashed' },
    ],
    footerName: 'Jaeyol (Peter) Lee',
    footerRole: 'Fullstack · AI product engineering',
    brand: 'leeable.dev',
  },

  zones: [
    { label: 'INGEST · EMBEDDINGS', color: '#4a90e2', x: 72, y: 320, w: 1356, h: 415 },
    { label: 'QUERY · GENERATION',  color: '#ff8c4d', x: 72, y: 800, w: 1356, h: 415 },
  ],

  nodes: [
    // ingest pipeline
    { step: '1', name: 'Next.js',  sub: 'Ingest API · chunking', icon: 'nextdotjs', color: '#ffffff', x: 442,  y: 405, w: 270, h: 300 },
    { step: '2', name: 'OpenAI',   sub: 'embedding-3-small',     icon: 'openai',    color: '#10A37F', x: 788,  y: 405, w: 270, h: 300 },
    { step: '3', name: 'Supabase', sub: 'pgvector · HNSW',       icon: 'supabase',  color: '#3FCF8E', x: 1134, y: 405, w: 270, h: 300 },
    // query pipeline
    { step: '4', name: 'Next.js',  sub: 'Chat API · route',      icon: 'nextdotjs', color: '#ffffff', x: 442,  y: 885, w: 270, h: 300 },
    { step: '5', name: 'OpenAI',   sub: 'GPT-4o · grounded',     icon: 'openai',    color: '#10A37F', x: 788,  y: 885, w: 270, h: 300 },
    { step: '6', name: 'Vercel',   sub: 'Edge streaming · SSE',  icon: 'vercel',    color: '#ffffff', x: 1134, y: 885, w: 270, h: 300 },
  ],

  chips: [
    { id: 'docs', t: 'raw docs · pdf / md', icon: 'notion',  x: 120, y: 525,  w: 270, h: 60 },
    { id: 'user', t: 'user message',        icon: 'profile', x: 120, y: 1005, w: 270, h: 60 },
  ],

  wires: [
    // ingest (dashed — offline pipeline)
    { id: 'g0', d: 'M390 555 L442 555',    dir: 'right', hx: 442,  hy: 555,  color: MUTED, dashed: true, dots: 1 },
    { id: 'g1', d: 'M712 555 L788 555',    dir: 'right', hx: 788,  hy: 555,  color: MUTED, dashed: true, dots: 1 },
    { id: 'g2', d: 'M1058 555 L1134 555',  dir: 'right', hx: 1134, hy: 555,  color: MUTED, dashed: true, dots: 1 },
    // query flow (solid)
    { id: 'q0', d: 'M390 1035 L442 1035',  dir: 'right', hx: 442,  hy: 1035, color: ACCENT, dots: 1 },
    { id: 'q1', d: 'M712 1035 L788 1035',  dir: 'right', hx: 788,  hy: 1035, color: ACCENT, dots: 1 },
    { id: 'q2', d: 'M1058 1035 L1134 1035', dir: 'right', hx: 1134, hy: 1035, color: ACCENT, dots: 1 },
    // retrieval: Chat API -> pgvector (dashed, routed through the inter-zone band)
    { id: 'rt', d: 'M577 885 L577 780 L1269 780 L1269 705', dir: 'up', hx: 1269, hy: 705, color: MUTED, dashed: true, dots: 2 },
  ],

  // narrow inter-card gaps can't host wide labels — keep only the two that
  // carry meaning, placed in the clear inter-zone band / above the query row.
  labels: [
    { t: 'top-k retrieval',  x: 923, y: 780, color: MUTED },
    { t: 'prompt + context', x: 750, y: 852, color: ACCENT },
  ],
}
