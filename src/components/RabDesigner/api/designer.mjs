import { mkdir, readFile, readdir, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { validateDocument } from "../js/validation.mjs";
export { validateDocument } from "../js/validation.mjs";
export const directory = fileURLToPath(
  new URL("../compositions/", import.meta.url),
);
export async function saveDocument(data, root = directory) {
  validateDocument(data);
  await mkdir(root, { recursive: true });
  const temp = join(root, `${data.id}.${randomUUID()}.tmp`),
    destination = join(root, `${data.id}.json`);
  await writeFile(temp, JSON.stringify(data, null, 2) + "\n", { flag: "wx" });
  await rename(temp, destination);
  return { id: data.id, file: `${data.id}.json` };
}
export function designerPlugin() {
  const install = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url ?? "", "http://localhost");
      if (url.pathname !== "/api/designer") return next();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      try {
        if (req.method === "GET") {
          const id = url.searchParams.get("id");
          if (id) {
            if (!/^[1-9][0-9]{0,15}$/.test(id))
              throw Error("Invalid composition ID.");
            res.end(
              JSON.stringify(
                validateDocument(
                  JSON.parse(
                    await readFile(join(directory, id + ".json"), "utf8"),
                  ),
                ),
              ),
            );
          } else {
            await mkdir(directory, { recursive: true });
            const rows = [];
            for (const file of await readdir(directory)) {
              if (!/^\d+\.json$/.test(file)) continue;
              const d = validateDocument(
                JSON.parse(await readFile(join(directory, file), "utf8")),
              );
              rows.push({ id: d.id, title: d.title });
            }
            res.end(JSON.stringify(rows));
          }
        } else if (req.method === "PUT") {
          if (
            req.headers.origin &&
            new URL(req.headers.origin).host !== req.headers.host
          ) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: "Same-origin request required." }));
            return;
          }
          let body = "",
            size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 2000000) throw Error("Composition exceeds 2 MB.");
            body += chunk;
          }
          res.end(JSON.stringify(await saveDocument(JSON.parse(body))));
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "GET or PUT required." }));
        }
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: String(error.message ?? error) }));
      }
    });
  };
  return {
    name: "rab-designer",
    configureServer: install,
    configurePreviewServer: install,
  };
}
