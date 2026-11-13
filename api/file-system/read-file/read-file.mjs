import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, basename, extname } from "node:path";

const extensions = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".css", ".json", ".yaml", ".yml", ".md", ".txt", ".html", ".svg"]);
const inside = (root, file) => {
  const child = relative(root, file);
  return child !== ".." && !child.startsWith("../") && !child.startsWith("..\\") && !isAbsolute(child);
};

export const handleReadFile = async (world, req, res, url) => {
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify(body));
  };
  if (req.method !== "GET") return send(405, { error: "Use GET to read source." });
  try {
    const root = await realpath(resolve(world.path, "src"));
    const candidate = resolve(world.path, url.searchParams.get("path") ?? "", url.searchParams.get("file") ?? "");
    if (!inside(root, candidate)) return send(403, { error: "Only project source files can be viewed." });
    const file = await realpath(candidate);
    if (!inside(root, file)) return send(403, { error: "File resolves outside project source." });
    if (basename(file) !== ".gitkeep" && !extensions.has(extname(file).toLowerCase())) return send(415, { error: "This file type cannot be previewed as source." });
    const info = await stat(file);
    if (!info.isFile()) return send(400, { error: "Select a file." });
    if (info.size > 2 * 1024 * 1024) return send(413, { error: "File is too large to preview." });
    return send(200, { code: await readFile(file, "utf8") });
  } catch (error) {
    return send(error.code === "ENOENT" ? 404 : 500, { error: error.code === "ENOENT" ? "File no longer exists." : "Could not read source file." });
  }
};
