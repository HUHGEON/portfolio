import type { CanvasEdge, CanvasNode } from "@/components/canvas/workflow-canvas";

export type ProjectDetailCanvasDefinition = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};
