import { test } from "node:test";
import assert from "node:assert/strict";
import { newDocument } from "./document.ts";
import { recoveryKey, storeRecovery, recoveryAfterSave } from "./recovery.ts";
const storage = () => {
  const values = new Map();
  return {
    values,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
test("saving current work clears session recovery and legacy fallback", () => {
  const session = storage(),
    legacy = storage(),
    data = {
      ...newDocument("dev"),
      title: "Theme only",
      theme: { "--accent-default": "#aabbcc" },
    };
  legacy.setItem(recoveryKey, "stale");
  storeRecovery(session, legacy, data);
  assert.ok(session.values.has(recoveryKey));
  assert.equal(legacy.values.size, 0);
  storeRecovery(session, legacy, recoveryAfterSave(data, 3, 3));
  assert.equal(session.values.size, 0);
});
test("edits during an outstanding save remain recoverable, including empty documents", () => {
  const session = storage(),
    legacy = storage(),
    saved = newDocument(),
    current = { ...saved, title: "New title" };
  storeRecovery(session, legacy, recoveryAfterSave(current, 4, 3));
  assert.equal(JSON.parse(session.values.get(recoveryKey)).title, "New title");
  // Opening a saved document explicitly clears the prior recovery record.
  storeRecovery(session, legacy);
  assert.equal(session.values.size, 0);
});
