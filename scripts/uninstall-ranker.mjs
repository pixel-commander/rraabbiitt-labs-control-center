import { lstat, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const managed = await realpath(
  path.join(root, "packages/portable-search-ranker"),
);
if (!managed.startsWith((await realpath(root)) + path.sep)) {
  throw new Error("Refusing a ranker package outside this dashboard.");
}
const targets = [];
for (const relative of [".venv", "models/hf-cache"]) {
  const target = path.resolve(managed, relative);
  try {
    const info = await lstat(target);
    const resolved = await realpath(target);
    if (
      info.isSymbolicLink() ||
      !resolved.startsWith(managed + path.sep) ||
      !info.isDirectory()
    ) {
      throw new Error(`Refusing unmanaged runtime target: ${target}`);
    }
    targets.push(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
for (const target of targets) {
  console.log(
    `${process.argv.includes("--dry-run") ? "Would remove" : "Removing"}: ${target}`,
  );
  if (!process.argv.includes("--dry-run"))
    await rm(target, { recursive: true });
}
console.log(
  "Package source, records, messages, training data, and candidate models are retained.",
);
