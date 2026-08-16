"use client";

import { GithubIcon } from "@/components/icons/github-icon";
import { VelogIcon } from "@/components/icons/velog-icon";
import {
  ArchitectureDiagram,
  ARCH_SPECS,
} from "@/components/pages/project-detail/ArchitectureDiagram";
import { usePortfolioViewport } from "@/components/shell/viewport-context";
import { Tooltip } from "@/components/ui/tooltip";
import {
  BookOpenText,
  Braces,
  Building2,
  CalendarDays,
  Code2,
  Globe,
  GraduationCap,
  Mail,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type TransitionEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CanvasPoint = {
  x: number;
  y: number;
};

type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasNodeKind = "note" | "code" | "mermaid" | "mention";

export type CanvasNode = {
  id: string;
  kind: CanvasNodeKind;
  title?: string;
  titleHref?: string;
  titleTooltip?: string;
  appearance?: "default" | "transparent" | "section" | "technology" | "feature";
  icon?: {
    src: string;
    alt: string;
  };
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    frame?: "card" | "outline" | "plain" | "soft";
    frameHeight?: number;
    fit?: "cover" | "contain";
  };
  embed?: {
    src: string;
    title: string;
    height: number;
  };
  markdown: string;
  diagramKey?: string;
  equalHeightGroup?: string;
  excludeFromSequence?: boolean;
  layer?: "background" | "foreground";
  order?: number;
  height?: number;
  x: number;
  y: number;
  width: number;
};

export type CanvasNodeSide = "top" | "right" | "bottom" | "left";

type CanvasEdgeEndpoint = {
  nodeId: string;
  side: CanvasNodeSide;
};

type CanvasNodeHeights = Record<string, number>;

export type CanvasEdge = {
  id: string;
  from: CanvasEdgeEndpoint;
  to: CanvasEdgeEndpoint;
  directed?: boolean;
  bidirectional?: boolean;
};

export type CanvasShell = {
  border: string;
  panel: string;
  editor: string;
  accent: string;
  accentBg: string;
  muted: string;
  strong: string;
};

export type WorkflowCanvasLabels = {
  previousNode: string;
  nextNode: string;
  focusPreviousNode: string;
  focusNextNode: string;
  moveViewport: string;
  focusNode: string;
  zoomIn: string;
  zoomOut: string;
};

type WorkflowCanvasProps = {
  label: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  shell: CanvasShell;
  labels?: WorkflowCanvasLabels;
  occludedLeft?: number;
};

const BASE_CANVAS_SIZE = {
  width: 2000,
  height: 1400,
};
const CANVAS_EXPANSION_PADDING = 160;
const NODE_REVEAL_STEP_MS = 40;
const EDGE_REVEAL_STEP_MS = 16;
const EDGE_REVEAL_OFFSET_MS = 80;
const DEFAULT_ZOOM = 0.85;
const DISPLAY_ZOOM_BASE = DEFAULT_ZOOM;
const MIN_DISPLAY_ZOOM = 0.5;
const MAX_DISPLAY_ZOOM = 1.5;
const MIN_ZOOM = DEFAULT_ZOOM * MIN_DISPLAY_ZOOM;
const MAX_ZOOM = DEFAULT_ZOOM * MAX_DISPLAY_ZOOM;
const ZOOM_STEP = DEFAULT_ZOOM * 0.1;
const INITIAL_CONTENT_GAP = 32;
const INITIAL_CONTENT_TOP = 24;
const publicAssetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const defaultCanvasLabels: WorkflowCanvasLabels = {
  previousNode: "Previous node",
  nextNode: "Next node",
  focusPreviousNode: "Focus previous node",
  focusNextNode: "Focus next node",
  moveViewport: "Move canvas viewport",
  focusNode: "Focus {node} node",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
};

function resolvePublicAssetPath(src: string) {
  if (
    !publicAssetBasePath ||
    !src.startsWith("/") ||
    src.startsWith("//") ||
    src.startsWith(`${publicAssetBasePath}/`)
  ) {
    return src;
  }

  return `${publicAssetBasePath}${src}`;
}

export function WorkflowCanvas({
  label,
  nodes,
  edges,
  shell,
  labels = defaultCanvasLabels,
  occludedLeft,
}: WorkflowCanvasProps) {
  const portfolioViewport = usePortfolioViewport();
  const effectiveOccludedLeft = occludedLeft ?? portfolioViewport.occludedLeft;
  const isOcclusionReady = occludedLeft !== undefined || portfolioViewport.ready;
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasInitializedViewportRef = useRef(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isPanAnimated, setIsPanAnimated] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeHeights, setNodeHeights] = useState<CanvasNodeHeights>({});
  const contentSize = useMemo(
    () => getCanvasContentSize(nodes, nodeHeights),
    [nodes, nodeHeights],
  );
  const boundedPan = clampPan(
    pan,
    canvasSize,
    effectiveOccludedLeft,
    contentSize,
    zoom,
  );
  const nodeAnimationOrder = getCanvasRenderOrder(nodes);
  const equalHeightGroups = getEqualHeightGroups(nodes, nodeHeights);
  const orderedNodes = getCanvasOrderedNodes(nodes);

  const updateZoom = useCallback(
    (nextZoom: number, anchor?: CanvasPoint) => {
      const boundedNextZoom = normalizeZoom(nextZoom);

      if (boundedNextZoom === zoom) {
        return;
      }

      const zoomAnchor = anchor ?? getViewportCenter(canvasSize, effectiveOccludedLeft);
      const nextPan = {
        x: zoomAnchor.x - ((zoomAnchor.x - boundedPan.x) / zoom) * boundedNextZoom,
        y: zoomAnchor.y - ((zoomAnchor.y - boundedPan.y) / zoom) * boundedNextZoom,
      };
      const boundedNextPan = clampPan(
        nextPan,
        canvasSize,
        effectiveOccludedLeft,
        contentSize,
        boundedNextZoom,
      );

      setIsPanAnimated(false);
      setZoom(boundedNextZoom);
      setPan(boundedNextPan);
      setSelectedNodeId(
        getViewportFocusedNodeId(
          nodes,
          boundedNextPan,
          canvasSize,
          effectiveOccludedLeft,
          nodeHeights,
          boundedNextZoom,
        ),
      );
    },
    [
      boundedPan,
      canvasSize,
      contentSize,
      nodeHeights,
      nodes,
      effectiveOccludedLeft,
      zoom,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !isEditableTarget(event.target)) {
        const isZoomIn =
          event.key === "+" || event.key === "=" || event.code === "NumpadAdd";
        const isZoomOut = event.key === "-" || event.code === "NumpadSubtract";

        if (isZoomIn || isZoomOut) {
          event.preventDefault();
          updateZoom(zoom + (isZoomIn ? ZOOM_STEP : -ZOOM_STEP));
          return;
        }
      }

      if (event.code === "Space" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
        dragStartRef.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [updateZoom, zoom]);

  const handleNodeResize = useCallback((nodeId: string, height: number) => {
    setNodeHeights((current) =>
      current[nodeId] === height ? current : { ...current, [nodeId]: height },
    );
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setCanvasSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      });
    });

    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      hasInitializedViewportRef.current ||
      !isOcclusionReady ||
      canvasSize.width <= 1 ||
      canvasSize.height <= 1 ||
      nodes.some((node) => nodeHeights[node.id] === undefined)
    ) {
      return;
    }

    const initialPan = getInitialViewportPan(
      nodes,
      nodeHeights,
      canvasSize,
      effectiveOccludedLeft,
      contentSize,
    );

    hasInitializedViewportRef.current = true;
    setPan(initialPan);
  }, [
    canvasSize,
    contentSize,
    effectiveOccludedLeft,
    isOcclusionReady,
    nodeHeights,
    nodes,
  ]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isSpacePressed) {
      return;
    }

    event.preventDefault();
    setIsPanAnimated(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: boundedPan.x,
      panY: boundedPan.y,
    };
    setIsPanning(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) {
      return;
    }

    event.preventDefault();
    const nextPan = clampPan(
      {
        x: dragStartRef.current.panX + event.clientX - dragStartRef.current.pointerX,
        y: dragStartRef.current.panY + event.clientY - dragStartRef.current.pointerY,
      },
      canvasSize,
      effectiveOccludedLeft,
      contentSize,
      zoom,
    );

    setPan(nextPan);
    setSelectedNodeId(
      getViewportFocusedNodeId(
        nodes,
        nextPan,
        canvasSize,
        effectiveOccludedLeft,
        nodeHeights,
        zoom,
      ),
    );
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    setIsPanning(false);
  };

  // React's onWheel is registered as a passive listener, so its
  // event.preventDefault() is ignored and the browser zooms the whole page on
  // trackpad pinch (ctrl/⌘ + wheel). Attach a native non-passive listener that
  // blocks the browser default; the React onWheel below still does pan/zoom.
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) {
      return;
    }

    const blockNativeWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
    };

    element.addEventListener("wheel", blockNativeWheel, { passive: false });
    return () => element.removeEventListener("wheel", blockNativeWheel);
  }, []);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const rect = event.currentTarget.getBoundingClientRect();

      updateZoom(zoom - event.deltaY * 0.001, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      return;
    }

    setIsPanAnimated(false);
    setPan((current) => {
      const nextPan = clampPan(
        {
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        },
        canvasSize,
        effectiveOccludedLeft,
        contentSize,
        zoom,
      );

      setSelectedNodeId(
        getViewportFocusedNodeId(
          nodes,
          nextPan,
          canvasSize,
          effectiveOccludedLeft,
          nodeHeights,
          zoom,
        ),
      );

      return nextPan;
    });
  };
  const handleMiniMapNavigate = (point: CanvasPoint) => {
    setIsPanAnimated(false);
    const effectiveLeft = Math.min(effectiveOccludedLeft, canvasSize.width);
    const effectiveWidth = Math.max(1, canvasSize.width - effectiveLeft);
    const nextPan = {
      x: effectiveLeft - point.x * contentSize.width * zoom + effectiveWidth / 2,
      y: -point.y * contentSize.height * zoom + canvasSize.height / 2,
    };

    const boundedNextPan = clampPan(
      nextPan,
      canvasSize,
      effectiveOccludedLeft,
      contentSize,
      zoom,
    );

    setPan(boundedNextPan);
    setSelectedNodeId(
      getViewportFocusedNodeId(
        nodes,
        boundedNextPan,
        canvasSize,
        effectiveOccludedLeft,
        nodeHeights,
        zoom,
      ),
    );
  };
  const handleNodeFocus = (node: CanvasNode) => {
    if (isSpacePressed || isPanning) {
      return;
    }

    const nodeBox = getNodeBox(node, nodeHeights);
    const nodeCenter = {
      x: nodeBox.x + nodeBox.width / 2,
      y: nodeBox.y + nodeBox.height / 2,
    };
    const viewportCenter = getViewportCenter(canvasSize, effectiveOccludedLeft);
    const nextPan = {
      x: viewportCenter.x - nodeCenter.x * zoom,
      y: viewportCenter.y - nodeCenter.y * zoom,
    };

    setIsPanAnimated(true);
    setSelectedNodeId(node.id);
    setPan(clampPan(nextPan, canvasSize, effectiveOccludedLeft, contentSize, zoom));
  };
  const handlePanTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target && event.propertyName === "transform") {
      setIsPanAnimated(false);
    }
  };
  const handleStepFocus = (direction: "previous" | "next") => {
    const currentNodeId =
      selectedNodeId ??
      getViewportFocusedNodeId(
        nodes,
        boundedPan,
        canvasSize,
        effectiveOccludedLeft,
        nodeHeights,
        zoom,
      ) ??
      orderedNodes[0]?.id;
    const currentIndex = orderedNodes.findIndex((node) => node.id === currentNodeId);
    const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      direction === "previous"
        ? Math.max(0, fallbackIndex - 1)
        : Math.min(orderedNodes.length - 1, fallbackIndex + 1);
    const nextNode = orderedNodes[nextIndex];

    if (nextNode) {
      handleNodeFocus(nextNode);
    }
  };

  return (
    <div
      ref={canvasRef}
      id="profile-canvas"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={handleWheel}
      className={[
        `workflow-canvas relative overflow-hidden border-0 ${shell.border} ${shell.editor}`,
        isSpacePressed || isPanning ? "cursor-grab active:cursor-grabbing" : "",
      ].join(" ")}
      style={{
        backgroundColor: "var(--bg)",
        // blog-style: soft accent glow at the top + faint dot grid that pans
        backgroundImage:
          "var(--glow), radial-gradient(circle, var(--line) 1.1px, transparent 1.5px)",
        backgroundRepeat: "no-repeat, repeat",
        backgroundPosition: `50% 0%, ${boundedPan.x}px ${boundedPan.y}px`,
        backgroundSize: `cover, ${28 * zoom}px ${28 * zoom}px`,
        transition: isPanAnimated
          ? "background-position 500ms cubic-bezier(0.22, 1, 0.36, 1), background-size 500ms cubic-bezier(0.22, 1, 0.36, 1)"
          : "none",
      }}
    >
      <div
        className={[
          "absolute left-0 top-0",
          isPanAnimated
            ? "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            : "",
        ].join(" ")}
        onTransitionEnd={handlePanTransitionEnd}
        style={{
          width: contentSize.width,
          height: contentSize.height,
          transform: `translate3d(${boundedPan.x}px, ${boundedPan.y}px, 0) scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        <CanvasEdges
          edges={edges}
          nodes={nodes}
          nodeHeights={nodeHeights}
          canvasSize={contentSize}
          nodeAnimationOrder={nodeAnimationOrder}
        />

        <div className="relative h-full w-full space-y-4 p-4 md:block md:space-y-0 md:p-0">
          {nodes.map((node) => (
            <MarkdownNode
              key={node.id}
              node={node}
              shell={shell}
              animationOrder={nodeAnimationOrder.get(node.id)}
              minHeight={
                node.equalHeightGroup
                  ? equalHeightGroups.get(node.equalHeightGroup)
                  : undefined
              }
              selected={selectedNodeId === node.id}
              onFocus={() => handleNodeFocus(node)}
              onResize={handleNodeResize}
              labels={labels}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-end gap-2">
        <CanvasZoomControls
          zoom={zoom}
          onZoomIn={() => updateZoom(zoom + ZOOM_STEP)}
          onZoomOut={() => updateZoom(zoom - ZOOM_STEP)}
          labels={labels}
        />
        <CanvasMiniMap
          nodes={nodes}
          nodeHeights={nodeHeights}
          pan={boundedPan}
          zoom={zoom}
          viewportSize={canvasSize}
          canvasSize={contentSize}
          occludedLeft={effectiveOccludedLeft}
          onNavigate={handleMiniMapNavigate}
          labels={labels}
        />
      </div>
      <CanvasStepControls
        currentIndex={Math.max(
          0,
          orderedNodes.findIndex((node) => node.id === selectedNodeId),
        )}
        total={orderedNodes.length}
        onPrevious={() => handleStepFocus("previous")}
        onNext={() => handleStepFocus("next")}
        labels={labels}
      />
    </div>
  );
}

type CanvasZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  labels: WorkflowCanvasLabels;
};

function CanvasZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  labels,
}: CanvasZoomControlsProps) {
  const buttonClass =
    "flex h-9 w-9 items-center justify-center text-lg font-medium transition";
  const enabledClass =
    "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]";
  const disabledClass = "cursor-default text-[var(--faint)]";
  const isZoomInDisabled = zoom >= MAX_ZOOM;
  const isZoomOutDisabled = zoom <= MIN_ZOOM;
  const displayZoom = getDisplayZoom(zoom);

  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur">
      <Tooltip content={labels.zoomIn} placement="left">
        <button
          type="button"
          aria-label={labels.zoomIn}
          disabled={isZoomInDisabled}
          onClick={onZoomIn}
          className={`${buttonClass} ${isZoomInDisabled ? disabledClass : enabledClass}`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </Tooltip>
      <div
        aria-live="polite"
        className="border-y border-[var(--border)] px-1 py-1 text-center text-[10px] font-medium text-[var(--dim)]"
      >
        {Math.round(displayZoom * 100)}%
      </div>
      <Tooltip content={labels.zoomOut} placement="left">
        <button
          type="button"
          aria-label={labels.zoomOut}
          disabled={isZoomOutDisabled}
          onClick={onZoomOut}
          className={`${buttonClass} ${isZoomOutDisabled ? disabledClass : enabledClass}`}
        >
          <span aria-hidden="true">−</span>
        </button>
      </Tooltip>
    </div>
  );
}

type CanvasStepControlsProps = {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  labels: WorkflowCanvasLabels;
};

function CanvasStepControls({
  currentIndex,
  total,
  onPrevious,
  onNext,
  labels,
}: CanvasStepControlsProps) {
  const isPreviousDisabled = currentIndex <= 0;
  const isNextDisabled = currentIndex >= total - 1;
  const buttonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full transition";
  const enabledClass =
    "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]";
  const disabledClass = "cursor-default text-[var(--faint)] hover:bg-transparent";

  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 shadow-[var(--shadow)] backdrop-blur">
      <Tooltip content={labels.previousNode} placement="top">
        <button
          type="button"
          aria-label={labels.focusPreviousNode}
          aria-disabled={isPreviousDisabled}
          onClick={() => {
            if (!isPreviousDisabled) {
              onPrevious();
            }
          }}
          className={`${buttonClass} ${isPreviousDisabled ? disabledClass : enabledClass}`}
        >
          <span aria-hidden="true">←</span>
        </button>
      </Tooltip>
      <span className="min-w-12 text-center text-xs font-medium text-[var(--dim)]">
        {currentIndex + 1}/{total}
      </span>
      <Tooltip content={labels.nextNode} placement="top">
        <button
          type="button"
          aria-label={labels.focusNextNode}
          aria-disabled={isNextDisabled}
          onClick={() => {
            if (!isNextDisabled) {
              onNext();
            }
          }}
          className={`${buttonClass} ${isNextDisabled ? disabledClass : enabledClass}`}
        >
          <span aria-hidden="true">→</span>
        </button>
      </Tooltip>
    </div>
  );
}

type CanvasMiniMapProps = {
  nodes: CanvasNode[];
  nodeHeights: CanvasNodeHeights;
  pan: CanvasPoint;
  zoom: number;
  viewportSize: {
    width: number;
    height: number;
  };
  canvasSize: {
    width: number;
    height: number;
  };
  occludedLeft: number;
  onNavigate: (point: CanvasPoint) => void;
  labels: WorkflowCanvasLabels;
};

function CanvasMiniMap({
  nodes,
  nodeHeights,
  pan,
  zoom,
  viewportSize,
  canvasSize,
  occludedLeft,
  onNavigate,
  labels,
}: CanvasMiniMapProps) {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const effectiveLeft = Math.min(occludedLeft, viewportSize.width);
  const effectiveWidth = Math.max(1, viewportSize.width - effectiveLeft);
  const viewportWidth = clamp(
    (effectiveWidth / (canvasSize.width * zoom)) * 100,
    8,
    100,
  );
  const viewportHeight = clamp(
    (viewportSize.height / (canvasSize.height * zoom)) * 100,
    8,
    100,
  );
  const viewport = {
    x: clamp(
      ((-pan.x + effectiveLeft) / (canvasSize.width * zoom)) * 100,
      0,
      100 - viewportWidth,
    ),
    y: clamp((-pan.y / (canvasSize.height * zoom)) * 100, 0, 100 - viewportHeight),
    width: viewportWidth,
    height: viewportHeight,
  };

  const navigate = (clientX: number, clientY: number) => {
    if (!miniMapRef.current) {
      return;
    }

    const rect = miniMapRef.current.getBoundingClientRect();
    onNavigate({
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1),
    });
  };

  return (
    <div
      ref={miniMapRef}
      role="button"
      tabIndex={0}
      aria-label={labels.moveViewport}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        navigate(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) {
          navigate(event.clientX, event.clientY);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate({ x: 0.5, y: 0.5 });
        }
      }}
      className="h-28 w-40 cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)] backdrop-blur transition hover:border-[var(--faint)]"
    >
      <svg
        aria-hidden="true"
        className="h-full w-full text-[var(--accent)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="3"
          className="fill-[var(--card-2)] stroke-[var(--border)]"
          vectorEffect="non-scaling-stroke"
        />
        {nodes.map((node) => {
          const box = getNodeBox(node, nodeHeights);

          return (
            <rect
              key={node.id}
              x={(box.x / canvasSize.width) * 100}
              y={(box.y / canvasSize.height) * 100}
              width={(box.width / canvasSize.width) * 100}
              height={(box.height / canvasSize.height) * 100}
              rx="2"
              className={
                node.kind === "mention"
                  ? "fill-[var(--accent-soft)] stroke-[var(--accent)]"
                  : "fill-[var(--dim)] stroke-[var(--faint)]"
              }
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <rect
          x={viewport.x}
          y={viewport.y}
          width={viewport.width}
          height={viewport.height}
          rx="2"
          className="fill-[var(--accent-soft)] stroke-[var(--accent)]"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

type CanvasEdgesProps = {
  edges: CanvasEdge[];
  nodes: CanvasNode[];
  nodeHeights: CanvasNodeHeights;
  canvasSize: CanvasSize;
  nodeAnimationOrder: Map<string, number>;
};

function CanvasEdges({
  edges,
  nodes,
  nodeHeights,
  canvasSize,
  nodeAnimationOrder,
}: CanvasEdgesProps) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full text-[var(--accent)] md:block"
      viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
    >
      <defs>
        <marker
          id="canvas-arrow"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          orient="auto"
          refX="9"
          refY="5"
        >
          <path d="M0,0 L10,5 L0,10 Z" className="fill-current" />
        </marker>
        <marker
          id="canvas-arrow-start"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          orient="auto"
          refX="1"
          refY="5"
        >
          <path d="M10,0 L0,5 L10,10 Z" className="fill-current" />
        </marker>
      </defs>
      {edges.map((edge, index) => {
        const fromNode = nodes.find((node) => node.id === edge.from.nodeId);
        const toNode = nodes.find((node) => node.id === edge.to.nodeId);

        if (!fromNode || !toNode) {
          return null;
        }

        const edgeAnimationOrder = Math.max(
          nodeAnimationOrder.get(fromNode.id) ?? 0,
          nodeAnimationOrder.get(toNode.id) ?? 0,
        );
        const path = getEdgePath(
          fromNode,
          edge.from.side,
          toNode,
          edge.to.side,
          nodeHeights,
        );

        return (
          <path
            key={edge.id}
            d={path}
            className={[
              "workflow-edge fill-none",
              edge.directed || edge.bidirectional
                ? "workflow-edge-directed"
                : "workflow-edge-undirected",
            ].join(" ")}
            markerEnd={
              edge.directed || edge.bidirectional ? "url(#canvas-arrow)" : undefined
            }
            markerStart={edge.bidirectional ? "url(#canvas-arrow-start)" : undefined}
            stroke="currentColor"
            pathLength={1}
            strokeLinecap="round"
            strokeWidth="2"
            style={{
              animationDelay: `${
                edgeAnimationOrder * NODE_REVEAL_STEP_MS +
                EDGE_REVEAL_OFFSET_MS +
                index * EDGE_REVEAL_STEP_MS
              }ms`,
            }}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function getEdgePath(
  fromNode: CanvasNode,
  fromSide: CanvasNodeSide,
  toNode: CanvasNode,
  toSide: CanvasNodeSide,
  nodeHeights: CanvasNodeHeights,
) {
  const fromBox = getNodeBox(fromNode, nodeHeights);
  const toBox = getNodeBox(toNode, nodeHeights);
  const start = getNodeAnchor(fromBox, fromSide);
  const end = getNodeAnchor(toBox, toSide);
  const controlDistance = Math.max(
    80,
    Math.hypot(end.x - start.x, end.y - start.y) * 0.35,
  );
  const fromDirection = getSideDirection(fromSide);
  const toDirection = getSideDirection(toSide);
  const firstControl = {
    x: start.x + fromDirection.x * controlDistance,
    y: start.y + fromDirection.y * controlDistance,
  };
  const secondControl = {
    x: end.x + toDirection.x * controlDistance,
    y: end.y + toDirection.y * controlDistance,
  };

  return [
    `M ${start.x} ${start.y}`,
    `C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}`,
  ].join(" ");
}

function getNodeAnchor(
  box: ReturnType<typeof getNodeBox>,
  side: CanvasNodeSide,
): CanvasPoint {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  return {
    top: { x: centerX, y: box.y },
    right: { x: box.x + box.width, y: centerY },
    bottom: { x: centerX, y: box.y + box.height },
    left: { x: box.x, y: centerY },
  }[side];
}

function getSideDirection(side: CanvasNodeSide): CanvasPoint {
  return {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }[side];
}

function getNodeBox(node: CanvasNode, nodeHeights: CanvasNodeHeights = {}) {
  return {
    x: (node.x / 100) * BASE_CANVAS_SIZE.width,
    y: (node.y / 100) * BASE_CANVAS_SIZE.height,
    width: (node.width / 100) * BASE_CANVAS_SIZE.width,
    height: nodeHeights[node.id] ?? getNodeHeight(node),
  };
}

function getCanvasContentSize(
  nodes: CanvasNode[],
  nodeHeights: CanvasNodeHeights,
): CanvasSize {
  return nodes.reduce<CanvasSize>((size, node) => {
    const box = getNodeBox(node, nodeHeights);

    return {
      width: Math.max(
        size.width,
        Math.ceil(box.x + box.width + CANVAS_EXPANSION_PADDING),
      ),
      height: Math.max(
        size.height,
        Math.ceil(box.y + box.height + CANVAS_EXPANSION_PADDING),
      ),
    };
  }, BASE_CANVAS_SIZE);
}

function getNodeHeight(node: CanvasNode) {
  if (node.height) {
    return node.height;
  }

  if (node.kind === "code") {
    return 250;
  }

  if (node.kind === "mermaid") {
    return 230;
  }

  if (node.kind === "mention") {
    return 180;
  }

  return node.id === "intro" ? 230 : 185;
}

type MarkdownNodeProps = {
  node: CanvasNode;
  shell: CanvasShell;
  animationOrder?: number;
  minHeight?: number;
  selected: boolean;
  onFocus: () => void;
  onResize: (nodeId: string, height: number) => void;
  labels: WorkflowCanvasLabels;
};

function MarkdownNode({
  node,
  shell,
  animationOrder,
  minHeight,
  selected,
  onFocus,
  onResize,
  labels,
}: MarkdownNodeProps) {
  const nodeRef = useRef<HTMLElement>(null);
  const variant = {
    note: "border-l-[3px] border-l-[var(--accent)] bg-[var(--card)]",
    code: "border-l-[3px] border-l-[var(--border)] bg-[var(--card-2)] text-[var(--text)]",
    mermaid: "border-l-[3px] border-l-[var(--c-tag)] bg-[var(--card-2)]",
    mention: "border-l-[3px] border-l-[var(--accent)] bg-[var(--accent-soft)]",
  }[node.kind];
  const appearance = {
    default: `rounded-[var(--radius)] border border-[var(--border)] p-4 shadow-[var(--shadow-sm)] ${variant}`,
    transparent: "border-transparent bg-transparent p-0 shadow-none backdrop-blur-0",
    feature: "border-transparent bg-transparent p-0 shadow-none backdrop-blur-0",
    section:
      "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-2)] p-5 shadow-[var(--shadow-sm)]",
    technology:
      "rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-3 shadow-none",
  }[node.appearance ?? "default"];
  const isSection = node.appearance === "section";
  const isTechnology = node.appearance === "technology";
  const imageFrameStyle = node.image?.frameHeight
    ? ({ height: node.image.frameHeight } as CSSProperties)
    : undefined;
  const isSnugOutlineImage =
    node.image?.frame === "outline" && node.image.fit === "contain";
  const imageClassName = node.image?.frameHeight
    ? isSnugOutlineImage
      ? "h-auto w-auto max-h-full max-w-full rounded-2xl border border-[var(--border)] object-contain"
      : `h-full w-full ${node.image.fit === "cover" ? "object-cover" : "object-contain"}`
    : "h-auto w-full";
  const nodeLayer = isSection || node.layer === "background" ? "z-0" : "z-20";
  const inlineIconSize = isTechnology ? 36 : isSection ? 22 : 28;

  useEffect(() => {
    const element = nodeRef.current;

    if (!element) {
      return;
    }

    const reportHeight = () => onResize(node.id, element.offsetHeight);
    const observer = new ResizeObserver(reportHeight);

    reportHeight();
    observer.observe(element);

    return () => observer.disconnect();
  }, [node.id, onResize]);

  const nodeStyle = {
    left: (node.x / 100) * BASE_CANVAS_SIZE.width,
    top: (node.y / 100) * BASE_CANVAS_SIZE.height,
    width: (node.width / 100) * BASE_CANVAS_SIZE.width,
    minHeight: node.height ?? minHeight,
    animationDelay:
      animationOrder === undefined
        ? undefined
        : `${animationOrder * NODE_REVEAL_STEP_MS}ms`,
  } as CSSProperties;
  const nodeClassName = `workflow-node relative ${
    isSection ? "pointer-events-none" : ""
  } ${nodeLayer} ${appearance}`;
  const diagramSpec = node.diagramKey ? ARCH_SPECS[node.diagramKey] : undefined;
  const nodeContent = diagramSpec ? (
    <ArchitectureDiagram spec={diagramSpec} />
  ) : (
    <div
      className={
        node.icon && !node.title
          ? isTechnology
            ? "flex items-center gap-3"
            : isSection
              ? "flex items-center gap-2.5"
              : "flex items-start gap-3"
          : undefined
      }
    >
      {node.title && node.appearance !== "transparent" ? (
        <div className="absolute -top-14 left-0 flex items-center gap-2 text-xl font-semibold leading-8 tracking-tight text-[var(--text)] md:text-2xl">
          {node.icon ? (
            <span className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card-2)] shadow-sm">
              <Image
                src={resolvePublicAssetPath(node.icon.src)}
                alt={node.icon.alt}
                width={30}
                height={30}
                unoptimized
                className="h-[30px] w-[30px]"
              />
            </span>
          ) : null}
          <span className="pointer-events-none">{node.title}</span>
          {node.titleHref ? (
            <Tooltip
              content={node.titleTooltip ?? node.title}
              placement="right"
              className="pointer-events-auto"
              disableCollision
            >
              <Link
                href={node.titleHref}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex h-7 items-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 text-xs font-semibold text-[var(--accent)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)]"
              >
                Project Details →
              </Link>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      {node.icon && !node.title ? (
        <div
          className={
            isTechnology
              ? "flex h-12 w-12 shrink-0 items-center justify-center"
              : isSection
                ? "flex h-7 w-7 shrink-0 items-center justify-center"
                : "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card-2)]"
          }
        >
          <Image
            src={resolvePublicAssetPath(node.icon.src)}
            alt={node.icon.alt}
            width={inlineIconSize}
            height={inlineIconSize}
            unoptimized
            className={
              isTechnology ? "h-9 w-9" : isSection ? "h-[22px] w-[22px]" : "h-7 w-7"
            }
          />
        </div>
      ) : null}
      {node.image ? (
        <div
          style={imageFrameStyle}
          className={
            isSnugOutlineImage
              ? "flex items-center justify-center overflow-hidden bg-transparent"
              : node.image.frame === "outline"
                ? "flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-transparent"
                : node.image.frame === "soft"
                  ? "overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow)]"
                  : node.image.frame === "plain" || node.appearance === "transparent"
                    ? "overflow-hidden"
                    : "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-2)] shadow-[var(--shadow-sm)]"
          }
        >
          <Image
            src={resolvePublicAssetPath(node.image.src)}
            alt={node.image.alt}
            width={node.image.width}
            height={node.image.height}
            unoptimized
            className={imageClassName}
          />
        </div>
      ) : null}
      {node.embed ? (
        <div
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]"
          style={{ height: node.embed.height }}
          onClick={(event) => event.stopPropagation()}
        >
          <iframe
            src={node.embed.src}
            title={node.embed.title}
            loading="lazy"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            className="h-full w-full border-0 bg-white"
          />
        </div>
      ) : null}
      {node.markdown.trim() ? (
        <MarkdownBody
          markdown={node.markdown}
          kind={node.kind}
          shell={shell}
          appearance={node.appearance ?? "default"}
        />
      ) : null}
    </div>
  );

  return (
    <article
      ref={nodeRef}
      role={isSection ? "presentation" : "button"}
      tabIndex={isSection ? -1 : 0}
      aria-label={isSection ? undefined : labels.focusNode.replace("{node}", node.id)}
      data-appearance={node.appearance ?? "default"}
      data-selected={selected}
      onClick={isSection ? undefined : onFocus}
      onKeyDown={(event) => {
        if (isSection) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFocus();
        }
      }}
      className={nodeClassName}
      style={nodeStyle}
    >
      {nodeContent}
    </article>
  );
}

type MarkdownBodyProps = {
  markdown: string;
  kind: CanvasNodeKind;
  shell: CanvasShell;
  appearance: NonNullable<CanvasNode["appearance"]>;
};

function MarkdownBody({ markdown, kind, shell, appearance }: MarkdownBodyProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <div
      className={
        appearance === "transparent" || appearance === "feature"
          ? "space-y-2 text-base leading-7"
          : appearance === "technology"
            ? "min-w-0 space-y-0.5 text-xs leading-5"
            : appearance === "section"
              ? "space-y-0 text-sm leading-5"
              : "space-y-3 text-sm leading-6"
      }
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 1 ? "h2" : "h3";

          return (
            <Heading
              key={`${block.raw}-${index}`}
              className={`font-semibold tracking-tight ${getHeadingSize(
                block.level,
                appearance,
              )} ${getHeadingTone(block.level, appearance, kind, shell)}`}
            >
              {renderInline(block.text, shell, kind)}
            </Heading>
          );
        }

        if (block.type === "list") {
          if (
            block.items.some(
              (item) =>
                item.startsWith(":school:") ||
                item.startsWith(":company:") ||
                item.startsWith(":stack:") ||
                item.startsWith(":project:") ||
                item.startsWith(":writing:") ||
                item.startsWith(":github:") ||
                item.startsWith(":velog:") ||
                item.startsWith(":email:") ||
                item.startsWith(":calendar:") ||
                item.startsWith(":package:") ||
                item.startsWith(":website:"),
            )
          ) {
            return (
              <ul key={`${block.raw}-${index}`} className="space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="flex min-h-6 items-center gap-3">
                    <span className="flex min-w-0 items-center">
                      {renderInline(item, shell, kind)}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.items.every((item) => item.startsWith("`"))) {
            return (
              <ul key={`${block.raw}-${index}`} className="flex flex-wrap gap-2">
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item, shell, kind)}</li>
                ))}
              </ul>
            );
          }

          return (
            <ul key={`${block.raw}-${index}`} className="space-y-1">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${shell.accentBg}`}
                  />
                  <span>{renderInline(item, shell, kind)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "code") {
          if (block.language === "profile") {
            const [initials = "", caption = "", meta = ""] = block.text
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);

            return (
              <div
                key={`${block.raw}-${index}`}
                className="flex items-center gap-4 rounded-md border border-[var(--border)] bg-[var(--card-2)] p-4"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] font-mono text-xl font-semibold text-[var(--accent)]">
                  {initials}
                </div>
                <div>
                  <p className={`text-sm font-medium ${shell.strong}`}>{caption}</p>
                  <p className={`mt-1 text-xs ${shell.muted}`}>{meta}</p>
                </div>
              </div>
            );
          }

          return (
            <pre
              key={`${block.raw}-${index}`}
              className={`overflow-x-auto rounded-md border p-3 font-mono text-xs leading-5 ${
                block.language === "mermaid"
                  ? `${shell.border} ${shell.panel} ${shell.muted}`
                  : "border-zinc-800 bg-zinc-950 text-zinc-100"
              }`}
            >
              <code>
                {block.language ? (
                  <span className={shell.accent}>
                    {block.language}
                    {"\n"}
                  </span>
                ) : null}
                {block.text}
              </code>
            </pre>
          );
        }

        return (
          <p
            key={`${block.raw}-${index}`}
            className={kind === "code" ? "text-zinc-300" : shell.muted}
          >
            {renderInline(block.text, shell, kind)}
          </p>
        );
      })}
    </div>
  );
}

type MarkdownBlock =
  | {
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
      raw: string;
    }
  | {
      type: "paragraph";
      text: string;
      raw: string;
    }
  | {
      type: "list";
      items: string[];
      raw: string;
    }
  | {
      type: "code";
      language: string;
      text: string;
      raw: string;
    };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.trim().split("\n");
  const blocks: MarkdownBlock[] = [];
  let list: string[] = [];
  let code: string[] = [];
  let codeLanguage = "";
  let inCode = false;

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list, raw: list.join("\n") });
      list = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push({
          type: "code",
          language: codeLanguage,
          text: code.join("\n"),
          raw: code.join("\n"),
        });
        code = [];
        codeLanguage = "";
        inCode = false;
        return;
      }

      flushList();
      codeLanguage = line.replace("```", "").trim();
      inCode = true;
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (line.startsWith("- ")) {
      list.push(line.replace("- ", ""));
      return;
    }

    flushList();

    if (line.startsWith("# ")) {
      blocks.push({
        type: "heading",
        level: 1,
        text: line.replace("# ", ""),
        raw: line,
      });
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push({
        type: "heading",
        level: 3,
        text: line.replace("### ", ""),
        raw: line,
      });
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        type: "heading",
        level: 2,
        text: line.replace("## ", ""),
        raw: line,
      });
      return;
    }

    if (line.trim()) {
      blocks.push({ type: "paragraph", text: line, raw: line });
    }
  });

  flushList();

  return blocks;
}

function getHeadingSize(
  level: 1 | 2 | 3,
  appearance: NonNullable<CanvasNode["appearance"]>,
) {
  if (level === 1) {
    return appearance === "transparent" || appearance === "feature"
      ? "text-3xl leading-tight md:text-4xl"
      : "text-2xl leading-snug";
  }

  if (level === 2) {
    if (appearance === "feature") {
      return "text-xl leading-8 md:text-2xl";
    }

    return appearance === "section" ? "text-base leading-6" : "text-sm";
  }

  return appearance === "transparent" || appearance === "feature"
    ? "text-xl leading-8 md:text-2xl"
    : "text-xs";
}

function getHeadingTone(
  level: 1 | 2 | 3,
  appearance: NonNullable<CanvasNode["appearance"]>,
  kind: CanvasNodeKind,
  shell: CanvasShell,
) {
  if (kind === "code") {
    return "text-white";
  }

  if (level === 1 && appearance === "transparent") {
    return "border-l-[3px] border-[var(--accent)] pl-4 text-[var(--text)]";
  }

  if (level === 2 && appearance === "feature") {
    return "text-[var(--accent)]";
  }

  return shell.strong;
}

function renderInline(
  text: string,
  shell: CanvasShell,
  kind: CanvasNodeKind,
): ReactNode {
  const parts = text
    .split(
      /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|@\w[\w-]*|:(?:school|company|stack|project|writing|github|velog|email|calendar|package|website):)/g,
    )
    .filter(Boolean);

  return parts.map((part, index) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (linkMatch) {
      const [, label, href] = linkMatch;
      const [visibleLabel, tooltipContent = visibleLabel] = label.split("|");
      const isExternal = href.startsWith("http");
      const linkClassName =
        "inline-flex align-middle items-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold leading-none text-[var(--accent)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)]";
      const link = isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={linkClassName}
        >
          {visibleLabel}
        </a>
      ) : (
        <Link
          href={href}
          onClick={(event) => event.stopPropagation()}
          className={linkClassName}
        >
          {visibleLabel}
        </Link>
      );

      return (
        <Tooltip key={`${part}-${index}`} content={tooltipContent} placement="right">
          {link}
        </Tooltip>
      );
    }

    if (
      part === ":school:" ||
      part === ":company:" ||
      part === ":stack:" ||
      part === ":project:" ||
      part === ":writing:" ||
      part === ":github:" ||
      part === ":velog:" ||
      part === ":email:" ||
      part === ":calendar:" ||
      part === ":package:" ||
      part === ":website:"
    ) {
      const Icon =
        part === ":school:"
          ? GraduationCap
          : part === ":company:"
            ? Building2
            : part === ":project:"
              ? Braces
              : part === ":writing:"
                ? BookOpenText
                : part === ":github:"
                  ? GithubIcon
                  : part === ":velog:"
                    ? VelogIcon
                    : part === ":email:"
                      ? Mail
                      : part === ":calendar:"
                        ? CalendarDays
                        : part === ":package:"
                          ? Package
                          : part === ":website:"
                            ? Globe
                            : Code2;

      return (
        <Icon
          key={`${part}-${index}`}
          aria-hidden="true"
          size={15}
          className={`mr-3 inline-block w-4 shrink-0 align-[-2px] ${shell.accent}`}
        />
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className={`mr-1.5 rounded px-1.5 py-0.5 font-mono text-xs ${
            kind === "code"
              ? "bg-white/10 text-white"
              : `${shell.accentBg} ${shell.accent}`
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("@")) {
      return (
        <span
          key={`${part}-${index}`}
          className={`mr-1 inline-flex rounded px-1.5 py-0.5 font-mono text-xs ${shell.accentBg} ${shell.accent}`}
        >
          {part}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampPan(
  pan: CanvasPoint,
  viewportSize: CanvasSize,
  occludedLeft: number,
  contentSize: CanvasSize,
  zoom: number,
) {
  const effectiveLeft = Math.min(occludedLeft, viewportSize.width);
  const effectiveWidth = Math.max(1, viewportSize.width - effectiveLeft);
  const scaledWidth = contentSize.width * zoom;
  const scaledHeight = contentSize.height * zoom;
  const centeredX = effectiveLeft + (effectiveWidth - scaledWidth) / 2;
  const centeredY = (viewportSize.height - scaledHeight) / 2;
  const minX =
    scaledWidth <= effectiveWidth ? centeredX : viewportSize.width - scaledWidth;
  const maxX = scaledWidth <= effectiveWidth ? centeredX : effectiveLeft;
  const minY =
    scaledHeight <= viewportSize.height
      ? centeredY
      : viewportSize.height - scaledHeight;
  const maxY = scaledHeight <= viewportSize.height ? centeredY : 0;

  return {
    x: clamp(pan.x, minX, maxX),
    y: clamp(pan.y, minY, maxY),
  };
}

function normalizeZoom(zoom: number) {
  return Math.round(clamp(zoom, MIN_ZOOM, MAX_ZOOM) * 1000) / 1000;
}

function getDisplayZoom(zoom: number) {
  return zoom / DISPLAY_ZOOM_BASE;
}

function getInitialViewportPan(
  nodes: CanvasNode[],
  nodeHeights: CanvasNodeHeights,
  viewportSize: CanvasSize,
  occludedLeft: number,
  contentSize: CanvasSize,
) {
  const effectiveLeft = Math.min(occludedLeft, viewportSize.width);
  const nodeBoxes = nodes.map((node) => getNodeBox(node, nodeHeights));
  const firstContentX = Math.min(...nodeBoxes.map((box) => box.x));
  const firstContentY = Math.min(...nodeBoxes.map((box) => box.y));

  return clampPan(
    {
      x: effectiveLeft + INITIAL_CONTENT_GAP - firstContentX * DEFAULT_ZOOM,
      y: INITIAL_CONTENT_TOP - firstContentY * DEFAULT_ZOOM,
    },
    viewportSize,
    occludedLeft,
    contentSize,
    DEFAULT_ZOOM,
  );
}

function getViewportCenter(viewportSize: CanvasSize, occludedLeft: number) {
  const effectiveLeft = Math.min(occludedLeft, viewportSize.width);
  const effectiveWidth = Math.max(1, viewportSize.width - effectiveLeft);

  return {
    x: effectiveLeft + effectiveWidth / 2,
    y: viewportSize.height / 2,
  };
}

function getCanvasRenderOrder(nodes: CanvasNode[]) {
  return new Map(
    getCanvasAnimationOrderedNodes(nodes).map((node, index) => [node.id, index]),
  );
}

function getEqualHeightGroups(nodes: CanvasNode[], nodeHeights: CanvasNodeHeights) {
  return nodes.reduce<Map<string, number>>((groups, node) => {
    if (!node.equalHeightGroup) {
      return groups;
    }

    const height = nodeHeights[node.id] ?? getNodeHeight(node);
    const currentHeight = groups.get(node.equalHeightGroup) ?? 0;

    groups.set(node.equalHeightGroup, Math.max(currentHeight, height));
    return groups;
  }, new Map());
}

function getCanvasOrderedNodes(nodes: CanvasNode[]) {
  const sequenceNodes = nodes.filter((node) => !node.excludeFromSequence);

  return getOrderedNodes(sequenceNodes);
}

function getCanvasAnimationOrderedNodes(nodes: CanvasNode[]) {
  return getOrderedNodes(nodes);
}

function getOrderedNodes(nodes: CanvasNode[]) {
  const automaticOrder = new Map(
    [...nodes].sort(compareByCanvasPosition).map((node, index) => [node.id, index + 1]),
  );

  return [...nodes].sort((a, b) => {
    const sequenceOrder =
      (a.order ?? automaticOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? automaticOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER);

    if (sequenceOrder !== 0) {
      return sequenceOrder;
    }

    if (a.order !== undefined && b.order === undefined) {
      return -1;
    }

    if (a.order === undefined && b.order !== undefined) {
      return 1;
    }

    return compareByCanvasPosition(a, b);
  });
}

function compareByCanvasPosition(a: CanvasNode, b: CanvasNode) {
  const diagonalOrder = a.x + a.y - (b.x + b.y);

  return diagonalOrder || a.y - b.y || a.x - b.x;
}

function getViewportFocusedNodeId(
  nodes: CanvasNode[],
  pan: CanvasPoint,
  viewportSize: { width: number; height: number },
  occludedLeft: number,
  nodeHeights: CanvasNodeHeights,
  zoom: number,
) {
  const screenCenter = getViewportCenter(viewportSize, occludedLeft);
  const viewportCenter = {
    x: (screenCenter.x - pan.x) / zoom,
    y: (screenCenter.y - pan.y) / zoom,
  };

  return [...nodes]
    .map((node) => {
      const box = getNodeBox(node, nodeHeights);
      const center = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };

      return {
        id: node.id,
        distance: Math.hypot(center.x - viewportCenter.x, center.y - viewportCenter.y),
      };
    })
    .sort((a, b) => a.distance - b.distance)[0]?.id;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, button, a, [contenteditable='true']"),
  );
}
