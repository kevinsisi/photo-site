import type { Photo } from '../api';

// Photos without stored dimensions render at this ratio (landscape 3:2)
export const FALLBACK_RATIO = 1.5;

// Clamp extreme panoramas/strips so one photo can't blow up a row or column
const MIN_RATIO = 0.4;
const MAX_RATIO = 3.2;

export function photoRatio(photo: Photo): number {
  if (photo.width && photo.height && photo.height > 0) {
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, photo.width / photo.height));
  }
  return FALLBACK_RATIO;
}

export interface JustifiedItem {
  photo: Photo;
  width: number;
  height: number;
}

/**
 * Greedy justified rows: fill a row until the natural height (at full
 * container width) drops below targetHeight, then scale the row to fit
 * exactly. The last row keeps its natural size (never enlarged).
 */
export function justifiedRows(
  photos: Photo[],
  containerWidth: number,
  targetHeight: number,
  gap: number
): JustifiedItem[][] {
  if (containerWidth <= 0 || photos.length === 0) return [];

  const rows: JustifiedItem[][] = [];
  let row: Photo[] = [];
  let ratioSum = 0;

  const flush = (isLast: boolean) => {
    if (row.length === 0) return;
    const gapTotal = gap * (row.length - 1);
    let height = (containerWidth - gapTotal) / ratioSum;
    if (isLast && height > targetHeight) {
      // Don't enlarge a sparse final row
      height = targetHeight;
    }
    rows.push(
      row.map((photo) => ({
        photo,
        width: photoRatio(photo) * height,
        height,
      }))
    );
    row = [];
    ratioSum = 0;
  };

  for (const photo of photos) {
    row.push(photo);
    ratioSum += photoRatio(photo);
    const gapTotal = gap * (row.length - 1);
    const naturalHeight = (containerWidth - gapTotal) / ratioSum;
    if (naturalHeight <= targetHeight) {
      flush(false);
    }
  }
  flush(true);

  return rows;
}

/**
 * Masonry: distribute photos into the visually shortest column so the
 * reading order stays roughly top-to-bottom (unlike CSS columns, which
 * order column-major).
 */
export function masonryColumns(photos: Photo[], columnCount: number): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);

  for (const photo of photos) {
    let target = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    columns[target].push(photo);
    // Height contribution at equal column width is 1/ratio
    heights[target] += 1 / photoRatio(photo);
  }

  return columns;
}

export function masonryColumnCount(containerWidth: number): number {
  if (containerWidth < 640) return 2;
  if (containerWidth < 1024) return 3;
  return 4;
}

export function justifiedTargetHeight(containerWidth: number): number {
  if (containerWidth < 640) return 200;
  if (containerWidth < 1024) return 260;
  return 300;
}
