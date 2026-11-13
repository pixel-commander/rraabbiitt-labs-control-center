import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dbPairs } from "../../../models/dumbot/model/db-pairs.ts";
import type { SearchRecord } from "../../../models/dumbot/model/db-pairs.ts";

/** path is the caller project root; its manifest owns the database location. */
export const readDbRecords = async ({ path }: { path: string }): Promise<SearchRecord[]> => {
  const project = JSON.parse(await readFile(resolve(path, "rab.world.json"), "utf8"));
  const entries = project.paths?.filter((entry: { name?: string }) => entry.name === "database");
  if (entries?.length !== 1 || !entries[0].path || !entries[0].file) throw Error("Database registration is missing or ambiguous.");
  const db = new DatabaseSync(resolve(path, entries[0].path, entries[0].file), { readOnly: true });
  try {
    return db.prepare("SELECT * FROM records").all().map(row => {
      const metadata = JSON.parse(String(row.data ?? "{}"));
      return { ...metadata, ...row, id: Number(row.id), data: metadata,
        tags: JSON.parse(String(row.tags ?? "[]")), paths: JSON.parse(String(row.paths ?? "[]")),
        record_key: metadata.record_key ?? String(row.id) } as SearchRecord;
    });
  } finally { db.close(); }
};

export const searchDbPairs = async (props: { path: string; query: string; fields?: readonly string[] }) => {
  return dbPairs({ ...props, data: await readDbRecords(props) });
};

/** Relative destinations belong to this page, not to the portable model. */
export const configuredPaths = async () => {
  const settings = JSON.parse(await readFile(new URL("./settings.json", import.meta.url), "utf8"));
  return settings.paths as Record<string, string>;
};
export const fillPathSlots = (values: Record<string, unknown>, reqs: { name: string; title?: string }[], slots: { slot: string; normalized: unknown }[], paths: Record<string, string>) => {
  const filled = { ...values };
  const types = [...new Set(slots.filter(slot => slot.slot === "type" && typeof slot.normalized === "string" && Object.hasOwn(paths, slot.normalized)).map(slot => String(slot.normalized)))];
  const type = types.length === 1 ? types[0] : undefined;
  const pathProp = reqs.find(prop => prop.name === "path");
  const rootPath = pathProp?.title?.toLowerCase() === "project root";
  if (pathProp && !Object.hasOwn(filled, "path")) {
    const path = rootPath ? paths.root : type === undefined ? undefined : paths[type];
    if (path !== undefined) filled.path = path;
  }
  if (rootPath && type !== undefined && reqs.some(prop => prop.name === "save_path") && !Object.hasOwn(filled, "save_path")) filled.save_path = paths[type];
  return filled;
};
