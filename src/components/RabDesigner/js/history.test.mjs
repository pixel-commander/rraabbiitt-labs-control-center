import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHistory,
  transitionHistory,
  hasUnsavedRevision,
} from "./history.ts";
import { newDocument } from "./document.ts";
const edit = (state, title) =>
  transitionHistory(state, {
    type: "commit",
    data: { ...state.present.data, title },
  });
test("undo and redo restore the saved revision rather than counting steps", () => {
  let state = createHistory(newDocument());
  state = edit(state, "Saved title");
  const saved = state.present.revision;
  state = edit(state, "New title");
  assert.equal(hasUnsavedRevision(state, saved), true);
  state = transitionHistory(state, { type: "undo" });
  assert.equal(hasUnsavedRevision(state, saved), false);
  assert.equal(state.present.data.title, "Saved title");
  state = transitionHistory(state, { type: "redo" });
  assert.equal(hasUnsavedRevision(state, saved), true);
  assert.equal(state.present.data.title, "New title");
});
test("branching after undo creates a fresh revision and drops redo", () => {
  let state = createHistory(newDocument());
  state = edit(state, "One");
  state = edit(state, "Two");
  const discarded = state.present.revision;
  state = transitionHistory(state, { type: "undo" });
  state = edit(state, "Branch");
  assert.ok(state.present.revision > discarded);
  assert.equal(state.future.length, 0);
  assert.equal(hasUnsavedRevision(state, discarded), true);
});
test("many drag previews create no revisions and release commits once", () => {
  let state = createHistory(newDocument());
  const original = state.present;
  for (let i = 0; i < 30; i++)
    state = transitionHistory(state, {
      type: "preview",
      data: { ...original.data, title: `Preview ${i}` },
    });
  assert.equal(state.present, original);
  assert.equal(state.past.length, 0);
  assert.equal(state.nextRevision, 1);
  assert.equal(hasUnsavedRevision(state, 0), true);
  state = transitionHistory(state, { type: "commit", data: state.preview });
  assert.equal(state.past.length, 1);
  assert.equal(state.present.revision, 1);
  assert.equal(state.preview, undefined);
});
test("cancelling a preview restores the clean saved state without history", () => {
  let state = createHistory(newDocument());
  const original = state.present.data;
  state = transitionHistory(state, {
    type: "preview",
    data: { ...original, title: "Drag" },
  });
  state = transitionHistory(state, { type: "preview", data: original });
  assert.equal(hasUnsavedRevision(state, 0), false);
  assert.equal(state.past.length, 0);
  assert.equal(
    transitionHistory(state, { type: "commit", data: original }),
    state,
  );
});
test("an outstanding save marks only its snapshot; later edits stay dirty", () => {
  let state = edit(createHistory(newDocument()), "Sent to server");
  const sent = state.present;
  state = edit(state, "Edited during save");
  assert.equal(hasUnsavedRevision(state, sent.revision), true);
  state = transitionHistory(state, { type: "undo" });
  assert.equal(hasUnsavedRevision(state, sent.revision), false);
});
test("adopting even the same document starts a new session and clears history", () => {
  let state = edit(createHistory(newDocument()), "Old");
  const requestSession = state.session,
    oldRevision = state.present.revision;
  state = transitionHistory(state, { type: "reset", data: state.present.data });
  assert.notEqual(state.session, requestSession);
  assert.ok(state.present.revision > oldRevision);
  assert.deepEqual(state.past, []);
  assert.deepEqual(state.future, []);
});
test("bounded history keeps unique revisions beyond sixty edits", () => {
  let state = createHistory(newDocument());
  for (let i = 0; i < 80; i++) state = edit(state, `Edit ${i}`);
  assert.equal(state.past.length, 60);
  assert.equal(state.present.revision, 80);
  assert.equal(
    new Set([...state.past, state.present].map((e) => e.revision)).size,
    61,
  );
});
