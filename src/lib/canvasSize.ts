export interface CanvasSize {
  width: number;
  height: number;
  /** Radius of the chart wheel that fits in the canvas. */
  radius: number;
}

const MAX_SIZE = 600;
const MIN_SIZE = 102;
// Room left above the canvas for the page header, so a landscape phone still
// shows the whole chart without scrolling.
const HEADER_HEIGHT = 64;

/** Picks a square canvas size: the full viewport width on a phone. */
export function getCanvasSize(): CanvasSize {
  const available = Math.min(
    document.documentElement.clientWidth,
    window.innerHeight - HEADER_HEIGHT,
    MAX_SIZE,
  );
  const v = Math.max(available, MIN_SIZE);
  return { width: v, height: v, radius: (v - 100) / 2 };
}
