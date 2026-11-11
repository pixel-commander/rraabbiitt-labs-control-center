import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isInputObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseInput = async (args) => {
  if (args.length === 0) return {};

  let raw;
  if (args.length === 2 && args[0] === "--json") {
    raw = args[1];
  } else if (args.length === 1) {
    raw = args[0];
  } else {
    throw new Error("Supply one JSON object or one JSON options file.");
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    if (args.length !== 1 || args[0] === "--json") {
      throw new Error("The --json value must be valid JSON.");
    }
    const contents = await readFile(args[0], "utf8");
    input = JSON.parse(contents.replace(/^\uFEFF/, ""));
  }

  if (!isInputObject(input))
    throw new Error("Tool input must be a JSON object.");
  return input;
};

/** Run a tool's direct function as a CLI and print its domain return unchanged. */
export async function runToolCli(url, execute) {
  if (!process.argv[1] || path.resolve(process.argv[1]) !== fileURLToPath(url))
    return;

  try {
    const settings = await parseInput(process.argv.slice(2));
    const response = await execute(settings);
    process.stdout.write(`${JSON.stringify(response ?? null, null, 2)}\n`);
    if (response?.status === "error") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
