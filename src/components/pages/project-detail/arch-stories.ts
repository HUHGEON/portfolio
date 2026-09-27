// Step-by-step playback of each diagram, one entry per line of the project's
// "동작 흐름" (HEO_PROJECT_DETAILS[slug].architecture.steps), in the same order.
// `nodes` are ArchitectureDiagram node keys (`zone` or `zone/itemIndex`), `edges`
// are indexes into ARCH_SPECS[key].edges that flow forward in this step, and
// `reverse` are edges whose data travels back against the arrow (responses).

export type ArchStoryStep = { nodes: string[]; edges?: number[]; reverse?: number[] };

export const ARCH_STORIES: Record<string, ArchStoryStep[]> = {
  "coupon-yaho": [
    { nodes: ["user", "gateway/0"], edges: [0] },
    { nodes: ["coupon/0", "coupon/1", "coupon/2"], edges: [1, 2] },
    { nodes: ["mysql/0"], edges: [3] },
    { nodes: ["kafka/0"], edges: [4] },
    { nodes: ["batch", "prometheus"], edges: [5] },
  ],
  "live-chat": [
    { nodes: ["viewer", "server/1"], edges: [0] },
    { nodes: ["server/0", "server/2"] },
    { nodes: ["server/3", "mongo/0", "server/2", "redis/0"], edges: [1, 2] },
    { nodes: ["redis/0", "pod/0"], edges: [3] },
    { nodes: ["server/3", "mongo/0", "redis"], edges: [1] },
  ],
  "voice-kiosk": [
    { nodes: ["user", "client/0", "client/1", "nlp/0"], edges: [0, 1] },
    { nodes: ["nlp/0", "openai/0"], edges: [2] },
    { nodes: ["nlp/1", "api/0"], edges: [3] },
    { nodes: ["api/0", "api/1", "api/2"] },
    { nodes: ["api/1", "data/0", "nlp/1", "client/0"], edges: [4], reverse: [3, 1] },
  ],
  haeyaji: [
    { nodes: ["user", "client", "backend/1", "ai/0"], edges: [0, 1, 7] },
    { nodes: ["ai/0"] },
    { nodes: ["backend/1", "backend/4", "data/1"], edges: [3, 4, 6] },
    { nodes: ["ai/0", "ai/1"] },
    { nodes: ["backend/2", "client"], reverse: [7, 1] },
  ],
  "blog-platform": [
    { nodes: ["client", "server/0"], edges: [0] },
    { nodes: ["server/1"] },
    { nodes: ["server/2"] },
    { nodes: ["server/3"] },
    { nodes: ["mongo/0", "mongo/1"], edges: [1] },
  ],
  zogakzip: [
    { nodes: ["client", "server/0"], edges: [0] },
    { nodes: ["server/1"] },
    { nodes: ["mongo/1"], edges: [1] },
    { nodes: ["server/2"] },
    { nodes: ["badge/0"], edges: [2] },
  ],
};
