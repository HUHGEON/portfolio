// Shared architecture-diagram dimensions + frame-height math.
// Plain data (no client deps) so both the server-side detail builder and the
// client ArchitectureDiagram component can compute a frame that HUGS the
// content (no big empty box for wide/short diagrams).

export const ARCH_BOX_W = 1340;
export const ARCH_MAX_H = 720;
export const ARCH_PAD_X = 44;
export const ARCH_PAD_Y = 30;

// design-space width/height per diagram (mirrors ARCH_SPECS width/height;
// omitted specs fall back to the component defaults 1600×980)
export const ARCH_DIMENSIONS: Record<string, { w: number; h: number }> = {
  haeyaji: { w: 1600, h: 980 },
  "voice-kiosk": { w: 1900, h: 680 },
  "live-chat": { w: 1500, h: 760 },
  "blog-platform": { w: 1250, h: 620 },
  zogakzip: { w: 1580, h: 560 },
  "media-inference": { w: 1550, h: 620 },
  "intern-arch": { w: 1440, h: 840 },
};

export function archScale(w: number, h: number) {
  return Math.min(
    1,
    (ARCH_BOX_W - ARCH_PAD_X * 2) / w,
    (ARCH_MAX_H - ARCH_PAD_Y * 2) / h,
  );
}

// pixel height of the rendered frame (scaled content + vertical padding)
export function archFrameHeight(w: number, h: number) {
  return Math.round(h * archScale(w, h)) + ARCH_PAD_Y * 2;
}

export function archFrameHeightForKey(key: string) {
  const d = ARCH_DIMENSIONS[key] ?? { w: 1600, h: 980 };
  return archFrameHeight(d.w, d.h);
}
