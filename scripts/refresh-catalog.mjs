import { runTools } from "../toolkit/runners/run-tools.ts";
import { executeTool } from "../toolkit/tools/refresh-world-database/refresh-world-database.ts";
import { projectRoot } from "./world.mjs";
const [{ response, ...step }] = await runTools(
  [{ id: 1793210509222, name: "refresh-world-database", type: "tool", settings: { path: projectRoot } }],
  run => executeTool(run.settings),
);
const result = { ...step, response };
console.log(JSON.stringify(result, null, 2));
if (result.status !== "complete" || !result.response?.summary?.count) process.exitCode = 1;
