import test from "node:test";
import assert from "node:assert/strict";
import { resolveResize, resolveSnap, overlapsAny } from "../resolve-layout.ts";
const area = (id, c1, r1, cols, rows) => ({
  id,
  c1,
  r1,
  cols,
  rows,
  name: `area-${id}`,
});
const valid = (areas, cols, rows) =>
  areas.every(
    (a, i) =>
      a.c1 >= 1 &&
      a.r1 >= 1 &&
      a.cols >= 1 &&
      a.rows >= 1 &&
      a.c1 + a.cols - 1 <= cols &&
      a.r1 + a.rows - 1 <= rows &&
      !overlapsAny(a, areas.slice(i + 1)),
  );

test("moving an area into its neighbor preserves identity and produces nonoverlapping geometry", () => {
  const input = [area(1, 1, 1, 2, 2), area(2, 3, 1, 2, 2)];
  const snapshot = structuredClone(input);
  const result = resolveResize(input, 0, { ...input[0], c1: 2 }, 6, 3);
  assert.equal(result.blocked, false);
  assert.equal(valid(result.areas, 6, 3), true);
  assert.deepEqual(
    result.areas.map((a) => [a.id, a.name]),
    input.map((a) => [a.id, a.name]),
  );
  assert.deepEqual(input, snapshot);
});

test("snap resizing shares a divider and blocks when no cell remains for its neighbor", () => {
  const input = [area(1, 1, 1, 2, 2), area(2, 3, 1, 2, 2)];
  const result = resolveSnap(input, 0, { ...input[0], cols: 3 }, 4, 2);
  assert.equal(result.blocked, false);
  assert.deepEqual(
    result.areas.map((a) => [a.c1, a.cols]),
    [
      [1, 3],
      [4, 1],
    ],
  );
  const blocked = resolveSnap(input, 0, { ...input[0], cols: 4 }, 4, 2);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.areas, input);
});

test("every accepted move/resize in a crowded grid stays in bounds and nonoverlapping", () => {
  const input = [area(1, 1, 1, 2, 2), area(2, 3, 1, 2, 1), area(3, 3, 2, 2, 2)];
  for (const resolve of [resolveResize, resolveSnap]) {
    for (let index = 0; index < input.length; index++) {
      for (let r1 = 1; r1 <= 3; r1++)
        for (let c1 = 1; c1 <= 4; c1++) {
          for (let rows = 1; rows <= 3; rows++)
            for (let cols = 1; cols <= 4; cols++) {
              const result = resolve(
                input,
                index,
                { ...input[index], r1, c1, rows, cols },
                4,
                3,
              );
              if (!result.blocked)
                assert.equal(valid(result.areas, 4, 3), true);
              else assert.equal(result.areas, input);
            }
        }
    }
  }
});
