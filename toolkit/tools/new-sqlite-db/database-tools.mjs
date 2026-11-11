import path from "node:path";

export function filename(value = "app.sqlite") {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(sqlite|db)$/.test(value)
  )
    throw Error("file must be a plain .sqlite or .db filename");
  return value;
}

export function directory(value) {
  if (typeof value !== "string" || !value.trim())
    throw Error("path is required");
  return path.resolve(value);
}
