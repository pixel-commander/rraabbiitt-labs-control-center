import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ranker = path.resolve(
  root,
  process.env.RANKER_PATH ?? "packages/portable-search-ranker",
);
const python = process.env.RANKER_PYTHON
  ? path.resolve(root, process.env.RANKER_PYTHON)
  : path.join(
      ranker,
      ".venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );

if (!existsSync(python)) {
  console.error(
    "Ranker Python environment is missing. Run npm run ranker:setup on Windows, or set RANKER_PYTHON.",
  );
  process.exitCode = 1;
} else {
  const child = spawn(
    python,
    [path.join(ranker, "search.py"), ...process.argv.slice(2)],
    {
      cwd: ranker,
      stdio: "inherit",
      shell: false,
    },
  );
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
