import { loadWorld } from "./world.mjs";
import { resolve } from "node:path";
import { run } from "../toolkit/rab-world/runners/runner-use-tool/runner-use-tool.ts";
const [rawId, content, ...extra] = process.argv.slice(2);
if (!rawId || !/^[1-9][0-9]*$/.test(rawId) || !Number.isSafeInteger(Number(rawId)) || extra.length)
  throw Error('Use npm run tool -- ID [JSON-settings]. With no settings, inspect the tool.');
const world = await loadWorld();
const result = await run({ id: Number(rawId), ...(content === undefined ? {} : { content }),
  toolkits: world.toolkits.map(row => ({ ...row, path: resolve(world.path, row.path) })) });
console.log(JSON.stringify(result, null, 2));
if (result.some(row => row.status === "error")) process.exitCode = 1;
