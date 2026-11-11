import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { projectRoot } from "./world.mjs";
for (const file of ["scripts/setup-hybrid.mjs", "db/setup.mjs"]) {
  const result = spawnSync(process.execPath, [resolve(projectRoot, file)], { cwd: projectRoot, stdio: "inherit", windowsHide: true, shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
