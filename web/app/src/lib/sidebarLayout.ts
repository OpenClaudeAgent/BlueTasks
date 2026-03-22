/** Sidebar layout spec: persisted width (px), resize lane, compact threshold. */

export const SIDEBAR_WIDTH_STORAGE_KEY = 'bluetasks.sidebarWidthPx';

export const SIDEBAR_DEFAULT_WIDTH_PX = 248;
/**
 * Minimum width while dragging (JS clamp). Must fit compact tiles + sidebar padding (see compact CSS).
 */
export const SIDEBAR_MIN_WIDTH_PX = 56;
export const SIDEBAR_MAX_WIDTH_PX = 480;

/** Grid column between sidebar and main (drag target). */
export const SIDEBAR_RESIZE_LANE_PX = 10;

/**
 * Sidebar width (px) at or below which compact layout applies (must stay below default so the default is not compact).
 * If this is too high relative to default, users never see a transition when resizing.
 */
export const SIDEBAR_COMPACT_MAX_WIDTH_PX = 240;

export function clampSidebarWidthPx(width: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH_PX, Math.max(SIDEBAR_MIN_WIDTH_PX, width));
}
