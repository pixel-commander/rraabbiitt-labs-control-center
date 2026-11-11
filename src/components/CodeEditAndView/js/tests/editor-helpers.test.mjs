import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCode } from "../validate-code/validate-code.ts";
import { saveCodeFile } from "../save-code-file/save-code-file.ts";

test("syntax validation rejects broken syntax and does not claim semantic type checking", async () => {
  assert.deepEqual(
    await validateCode({
      code: "const x = 1;",
      file: "test.ts",
      language: "ts",
    }),
    [],
  );
  assert.ok(
    (
      await validateCode({
        code: "const x = ;",
        file: "test.ts",
        language: "ts",
      })
    ).some((item) => item.severity === "error"),
  );
  assert.ok(
    (
      await validateCode({
        code: "{ nope",
        file: "test.json",
        language: "json",
      })
    ).length,
  );
  assert.deepEqual(
    await validateCode({
      code: 'const x: number = "text";',
      file: "test.ts",
      language: "ts",
    }),
    [],
  );
});

test("saving invokes the supplied capability and propagates missing-handler and I/O failures", async () => {
  const file = { code: "", file: "test.ts", language: "ts" };
  await assert.rejects(saveCodeFile(file), /No file-saving/);
  await assert.rejects(
    saveCodeFile(file, () => {
      throw Error("disk failed");
    }),
    /disk failed/,
  );
  let received;
  await saveCodeFile(file, (data, type) => {
    received = { data, type };
  });
  assert.deepEqual(received, { data: file, type: "save-code" });
});
