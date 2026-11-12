import { executeTool } from "../toolkit/tools/refresh-world-database/refresh-world-database.ts";
import { projectRoot } from "./world.mjs";
const result = await executeTool({ path: projectRoot });
console.log(JSON.stringify(result, null, 2));
if (result.status !== "complete" || !result.response?.summary?.count) process.exitCode = 1;
