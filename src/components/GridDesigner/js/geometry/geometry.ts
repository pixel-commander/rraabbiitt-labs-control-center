import type { GridBox, GridState, Track } from "../../GridDesigner.types";
export const DEVICES = {
  phone: { inline: 390, block: 844, label: "Phone" },
  tablet: { inline: 768, block: 1024, label: "Tablet" },
  laptop: { inline: 1366, block: 768, label: "Laptop" },
  desktop: { inline: 1920, block: 1080, label: "Desktop" },
} as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const normalizeBox = (box: GridBox): GridBox => {
  return {
    ...box,
    r1: Math.min(box.r1, box.r2),
    c1: Math.min(box.c1, box.c2),
    r2: Math.max(box.r1, box.r2),
    c2: Math.max(box.c1, box.c2),
  };
};

export const clampBox = (box: GridBox, rows: number, cols: number): GridBox => {
  return normalizeBox({
    ...box,
    r1: clamp(box.r1, 1, rows),
    r2: clamp(box.r2, 1, rows),
    c1: clamp(box.c1, 1, cols),
    c2: clamp(box.c2, 1, cols),
  });
};

export const boxGridArea = (box: GridBox) => {
  const value = normalizeBox(box);
  return (
    value.r1 +
    " / " +
    value.c1 +
    " / " +
    (value.r2 + 1) +
    " / " +
    (value.c2 + 1)
  );
};

export const overlaps = (a: GridBox, b: GridBox) => {
  const x = normalizeBox(a);
  const y = normalizeBox(b);
  return !(x.r2 < y.r1 || y.r2 < x.r1 || x.c2 < y.c1 || y.c2 < x.c1);
};

export const placed = (
  box: GridBox,
  boxes: GridBox[],
  rows: number,
  cols: number,
  ignoreId?: number,
) => {
  const candidate = clampBox(box, rows, cols);
  return boxes.some(
    (other) => other.id !== ignoreId && overlaps(candidate, other),
  )
    ? null
    : candidate;
};

export const trackListCss = (tracks: Track[], count: number) => {
  return Array.from({ length: count }, (_, index) => {
    const track = tracks[index] ?? { mode: "1fr", manual: "minmax(0, 1fr)" };
    if (track.mode === "manual") return track.manual.trim() || "minmax(0, 1fr)";
    return track.mode;
  }).join(" ");
};

export const normalizeTracks = (
  tracks: Track[] | undefined,
  count: number,
): Track[] => {
  return Array.from({ length: count }, (_, index) => {
    const source = tracks?.[index];
    return source
      ? { mode: source.mode, manual: source.manual }
      : { mode: "1fr", manual: "minmax(0, 1fr)" };
  });
};

export const atomCss = (name: string, state: GridState) => {
  const safe =
    name
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "grid";
  const lines = [
    '[data-grid="' + safe + '"] {',
    "  display: grid;",
    "  grid-template-columns: " +
      trackListCss(state.colTracks, state.cols) +
      ";",
    "  grid-template-rows: " + trackListCss(state.rowTracks, state.rows) + ";",
    "}",
  ];
  const areas = state.boxes.filter((box) => box.area?.trim());
  if (areas.length) {
    lines.push("");
    areas.forEach((box) => {
      const area = box.area!.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
      lines.push(
        '[data-grid="' +
          safe +
          '"] > [data-area="' +
          area +
          '"] { grid-area: ' +
          boxGridArea(box) +
          "; }",
      );
    });
  }
  return lines.join("\n");
};

export const validateGridState = (state: GridState) => {
  if (!Number.isInteger(state.rows) || state.rows < 1)
    return "Rows must be a positive integer.";
  if (!Number.isInteger(state.cols) || state.cols < 1)
    return "Columns must be a positive integer.";
  for (const box of state.boxes) {
    const value = normalizeBox(box);
    if (
      value.r1 < 1 ||
      value.c1 < 1 ||
      value.r2 > state.rows ||
      value.c2 > state.cols
    )
      return "Box " + box.id + " is outside the grid.";
    if (
      state.boxes.some((other) => other.id !== box.id && overlaps(box, other))
    )
      return "Box " + box.id + " overlaps another box.";
  }
  return "";
};
