/* gridAreaResolve — grid collision resolver for the FIXED cells. Pure, no React/DOM (trivially testable).
   It reads the cell STATE array (each cell's real r1/c1/rows/cols) to compute overlaps + free space — the
   array is the source of truth, so no DOM measuring / no desync.

   INVARIANT held every step: all cells stay non-overlapping + in-bounds + fixed. The dragged cell = the
   ACTIVE one, pinned at `proposed`, and it WINS; its ORIGIN (pre-step footprint) frees up. Every overlapped
   neighbor is resolved by a ladder, checking ALL directions:
     1) SHRINK it off the active from the contested edge, down to a 1-cell floor            (resize only)
     2) SWAP  — axis-aware: it takes the active's ORIGIN position on the DRAG AXIS, keeps its OTHER axis
     3) PUSH  — shove it just PAST the active on the nearest valid side (adjacent, NOT teleported)
     4) BLOCK — nothing lands -> reject the whole step (caller keeps the last valid state; the drag stops)
   A cell shoved into a third one is pushed past THAT one too (cascade); if it can't, the whole step blocks. */

import type { GridArea as CellArea } from "../../GridAreaSelect.types";

interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const toRect = (a: CellArea): Rect => {
  const top = a.r1 || 1,
    left = a.c1 || 1;
  return { top, left, bottom: top + a.rows - 1, right: left + a.cols - 1 };
};
const applyRect = (base: CellArea, r: Rect): CellArea => ({
  ...base,
  r1: r.top,
  c1: r.left,
  rows: r.bottom - r.top + 1,
  cols: r.right - r.left + 1,
});
const overlaps = (a: Rect, b: Rect): boolean =>
  a.left <= b.right &&
  a.right >= b.left &&
  a.top <= b.bottom &&
  a.bottom >= b.top;
const inBounds = (r: Rect, cols: number, rows: number): boolean =>
  [r.left, r.top, r.right, r.bottom].every(Number.isFinite) &&
  r.left >= 1 &&
  r.top >= 1 &&
  r.left <= r.right &&
  r.top <= r.bottom &&
  r.right <= cols &&
  r.bottom <= rows;
const wSpan = (r: Rect): number => r.right - r.left; // 0-based span (a 1-col cell = 0)
const hSpan = (r: Rect): number => r.bottom - r.top;
const clash = (r: Rect, others: Rect[]): boolean =>
  others.some((o) => overlaps(r, o));

// 1) SHRINK b off a: recede ONE edge, keep >= 1 cell, pick the least-loss option. (resize only)
const shrink = (b: Rect, a: Rect): Rect | null => {
  const opts: Rect[] = [];
  if (a.left > b.left) opts.push({ ...b, right: a.left - 1 }); // recede right edge
  if (a.right < b.right) opts.push({ ...b, left: a.right + 1 }); // recede left edge
  if (a.top > b.top) opts.push({ ...b, bottom: a.top - 1 }); // recede bottom edge
  if (a.bottom < b.bottom) opts.push({ ...b, top: a.bottom + 1 }); // recede top edge
  const valid = opts.filter(
    (o) => o.left <= o.right && o.top <= o.bottom && !overlaps(o, a),
  );
  if (!valid.length) return null;
  const area = (r: Rect): number => (wSpan(r) + 1) * (hSpan(r) + 1);
  return valid.sort((x, y) => area(y) - area(x))[0]; // biggest kept = least loss
};

// 2) SWAP b onto the active's ORIGIN along the drag axis; keep b's OTHER axis; clamp in-bounds.
const swapAxis = (
  b: Rect,
  origin: Rect,
  axis: "x" | "y",
  cols: number,
  rows: number,
): Rect | null => {
  let r: Rect;
  if (axis === "x") {
    let left = Math.min(origin.left, cols - wSpan(b)); // take origin col-start, keep width, fit boundary
    left = Math.max(1, left);
    r = { ...b, left, right: left + wSpan(b) };
  } else {
    let top = Math.min(origin.top, rows - hSpan(b));
    top = Math.max(1, top);
    r = { ...b, top, bottom: top + hSpan(b) };
  }
  return inBounds(r, cols, rows) ? r : null;
};

// 3) PUSH b just PAST a on the nearest valid side (adjacent only — never teleported). null if boxed in.
const pushPast = (
  b: Rect,
  a: Rect,
  blockers: Rect[],
  cols: number,
  rows: number,
): Rect | null => {
  const w = wSpan(b),
    h = hSpan(b);
  const sides: Rect[] = [
    { top: b.top, left: a.left - 1 - w, bottom: b.top + h, right: a.left - 1 }, // LEFT of a  (keep b's rows)
    {
      top: b.top,
      left: a.right + 1,
      bottom: b.top + h,
      right: a.right + 1 + w,
    }, // RIGHT of a
    { top: a.top - 1 - h, left: b.left, bottom: a.top - 1, right: b.left + w }, // ABOVE a    (keep b's cols)
    {
      top: a.bottom + 1,
      left: b.left,
      bottom: a.bottom + 1 + h,
      right: b.left + w,
    }, // BELOW a
  ];
  const valid = sides.filter(
    (c) => inBounds(c, cols, rows) && !overlaps(c, a) && !clash(c, blockers),
  );
  if (!valid.length) return null;
  const move = (c: Rect): number =>
    Math.abs(c.top - b.top) + Math.abs(c.left - b.left);
  return valid.sort((x, y) => move(x) - move(y))[0]; // nearest shove
};

/** true if `area` overlaps any of `others` — the draw guard: don't drop a NEW cell onto occupied space. */
export function overlapsAny(area: CellArea, others: CellArea[]): boolean {
  const r = toRect(area);
  return others.some((o) => overlaps(r, toRect(o)));
}

export interface ResolveResult {
  areas: CellArea[];
  blocked: boolean;
}

const finishResolution = (
  areas: CellArea[],
  rects: Rect[],
  cols: number,
  rows: number,
): ResolveResult => {
  if (
    rects.some(
      (rect, index) =>
        !inBounds(rect, cols, rows) || clash(rect, rects.slice(index + 1)),
    )
  )
    return { areas, blocked: true };
  return {
    areas: areas.map((area, index) => applyRect(area, rects[index])),
    blocked: false,
  };
};

export function resolveResize(
  areas: CellArea[],
  index: number,
  proposed: CellArea,
  cols: number,
  rows: number,
): ResolveResult {
  const active = toRect(proposed);
  if (!inBounds(active, cols, rows)) return { areas, blocked: true };

  const origin = toRect(areas[index]);
  const isResize =
    proposed.rows !== areas[index].rows || proposed.cols !== areas[index].cols;
  // drag axis: whichever moved/grew more (ties -> x). Drives SWAP.
  const dx =
    Math.abs(active.left - origin.left) +
    Math.abs(wSpan(active) - wSpan(origin));
  const dy =
    Math.abs(active.top - origin.top) + Math.abs(hSpan(active) - hSpan(origin));
  const axis: "x" | "y" = dy > dx ? "y" : "x";

  const rects: Rect[] = areas.map((a, i) => (i === index ? active : toRect(a)));
  const placed: boolean[] = areas.map((_, i) => i === index); // active is pinned/placed

  // resolve overlapped cells nearest-to-active first
  const dist = (r: Rect): number =>
    Math.abs(r.top - active.top) + Math.abs(r.left - active.left);
  const order = areas
    .map((_, i) => i)
    .filter((i) => i !== index)
    .sort((i, j) => dist(rects[i]) - dist(rects[j]));

  for (const i of order) {
    let b = rects[i];
    const others = (): Rect[] =>
      rects.filter((_, k) => placed[k] && k !== i && k !== index);

    if (overlaps(b, active)) {
      let done = false;
      if (isResize) {
        // 1) shrink
        const s = shrink(b, active);
        if (s && !clash(s, others())) {
          b = s;
          done = true;
        }
      }
      if (!done) {
        // 2) swap
        const s = swapAxis(b, origin, axis, cols, rows);
        if (s && !overlaps(s, active) && !clash(s, others())) {
          b = s;
          done = true;
        }
      }
      if (!done) {
        // 3) push adjacent  ->  4) block
        const s = pushPast(b, active, others(), cols, rows);
        if (!s) return { areas, blocked: true };
        b = s;
      }
    } else if (clash(b, others())) {
      // shoved into a third cell -> push past that one
      const hit = others().find((o) => overlaps(b, o)) as Rect;
      const s = pushPast(
        b,
        hit,
        [active, ...others().filter((o) => o !== hit)],
        cols,
        rows,
      );
      if (!s) return { areas, blocked: true };
      b = s;
    }

    rects[i] = b;
    placed[i] = true;
  }

  return finishResolution(areas, rects, cols, rows);
}

// share a range on the perpendicular axis (so two cells actually abut, not just line up on a corner)
const shareRows = (a: Rect, b: Rect): boolean =>
  a.top <= b.bottom && a.bottom >= b.top;
const shareCols = (a: Rect, b: Rect): boolean =>
  a.left <= b.right && a.right >= b.left;

/* resolveSnap — SNAP mode (push OFF). v1 = linked DIVIDER on resize: when an edge that ABUTS a touching
   neighbor moves, that neighbor's shared edge follows (stays flush) and it re-proportions. A neighbor can't
   go below 1 cell -> the divider stops (block). Non-shared edges (walls / empty space) just grow freely.
   v1 scope: direct touching neighbors on the moved edge only — no group cascade / outsider push yet. */
export function resolveSnap(
  areas: CellArea[],
  index: number,
  proposed: CellArea,
  cols: number,
  rows: number,
): ResolveResult {
  const active = toRect(proposed);
  if (!inBounds(active, cols, rows)) return { areas, blocked: true };
  const origin = toRect(areas[index]);

  const movedRight = active.right !== origin.right;
  const movedLeft = active.left !== origin.left;
  const movedTop = active.top !== origin.top;
  const movedBottom = active.bottom !== origin.bottom;

  const rects: Rect[] = areas.map((a, i) => (i === index ? active : toRect(a)));

  for (let i = 0; i < rects.length; i++) {
    if (i === index) continue;
    let n = rects[i];
    const others = (): Rect[] => rects.filter((_, k) => k !== i && k !== index);
    // once a re-proportion would crush the neighbor below 1 cell, PUSH it instead (keep its size, translate)
    // — but only if there's room; the grid boundary (or another cell) is the only thing that STOPS it.
    const pushOrBlock = (moved: Rect): ResolveResult | Rect =>
      inBounds(moved, cols, rows) && !clash(moved, others())
        ? moved
        : { areas, blocked: true };

    // RIGHT edge moved -> neighbor on the right whose LEFT abutted the active's old right edge follows
    if (movedRight && n.left === origin.right + 1 && shareRows(n, origin)) {
      const left = active.right + 1;
      if (left <= n.right)
        n = { ...n, left }; // re-proportion (shrink)
      else {
        // at 1 cell -> push right
        const r = pushOrBlock({ ...n, left, right: left + (n.right - n.left) });
        if ("blocked" in r) return r;
        n = r;
      }
    }
    // LEFT edge moved -> neighbor on the left whose RIGHT abutted the active's old left edge follows
    if (movedLeft && n.right === origin.left - 1 && shareRows(n, origin)) {
      const right = active.left - 1;
      if (right >= n.left) n = { ...n, right };
      else {
        const r = pushOrBlock({
          ...n,
          right,
          left: right - (n.right - n.left),
        });
        if ("blocked" in r) return r;
        n = r;
      }
    }
    // TOP edge moved -> neighbor above whose BOTTOM abutted the active's old top edge follows
    if (movedTop && n.bottom === origin.top - 1 && shareCols(n, origin)) {
      const bottom = active.top - 1;
      if (bottom >= n.top) n = { ...n, bottom };
      else {
        const r = pushOrBlock({
          ...n,
          bottom,
          top: bottom - (n.bottom - n.top),
        });
        if ("blocked" in r) return r;
        n = r;
      }
    }
    // BOTTOM edge moved -> neighbor below whose TOP abutted the active's old bottom edge follows
    if (movedBottom && n.top === origin.bottom + 1 && shareCols(n, origin)) {
      const top = active.bottom + 1;
      if (top <= n.bottom) n = { ...n, top };
      else {
        const r = pushOrBlock({ ...n, top, bottom: top + (n.bottom - n.top) });
        if ("blocked" in r) return r;
        n = r;
      }
    }
    rects[i] = n;
  }

  return finishResolution(areas, rects, cols, rows);
}
