import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadWorld } from "./world.mjs";

// This relative bootstrap locates the one path configuration source.
const world = await loadWorld();
if (!world.mcp?.path || !world.mcp?.file || !Array.isArray(world.toolkits))
  throw new Error("rab.world.json requires mcp.path, mcp.file and toolkits.");
const toolkits = world.toolkits.map((entry) => {
  if (typeof entry.path !== "string" || !entry.path)
    throw new Error("Each toolkit requires a path.");
  return { ...entry, path: resolve(world.path, entry.path) };
});
const { start } = await import(
  pathToFileURL(resolve(world.path, world.mcp.path, world.mcp.file)).href
);
process.chdir(world.path);
await start({ ...world, toolkits });
