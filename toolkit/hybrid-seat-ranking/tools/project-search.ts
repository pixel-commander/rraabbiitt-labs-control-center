// Get the function that sends a search to the Python worker.
import { searchWorker } from "./search-worker.ts";
// Get the functions that read files, make folders, make temporary folders, and delete folders.
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
// Get the functions that join and compare folder paths.
import { dirname, resolve, relative, isAbsolute } from "node:path";
// Get the function that changes a file URL into a normal path.
import { fileURLToPath } from "node:url";
// Get the two catalog export functions. "exportCatalog" records usage. "executeTool" does not record usage.
import { run as exportCatalog, executeTool } from "../../tools/export-search-catalog/export-search-catalog.ts";
// Get the types for tool settings and tool results.
import type { ToolsProps, ToolReturn } from "../../Tooling.types.ts";

// Find the folder that holds this file.
const toolsDirectory = dirname(fileURLToPath(import.meta.url));
// Find the project root folder. It is three folders above this file.
const defaultProject = resolve(toolsDirectory, "../../..");
// Read a JSON file and return its data.
const read = async (path: string) => JSON.parse(await readFile(path, "utf8"));

// Run a normal search. The catalog export records usage.
export const searchProject = (settings: ToolsProps) => runProject(settings, "search");
// Run a warm-up search when the server starts. The catalog export does not record usage.
export const warmProject = (settings: ToolsProps) => runProject(settings, "search", executeTool);
// Refuse all feedback. The shipped model cannot change.
export const feedbackProject = async (settings: ToolsProps): Promise<ToolReturn> => ({
  // Return an error result with the original settings.
  return_type: "results", status: "error", settings,
  // Tell the caller where to save feedback instead.
  error: "The shipped hybrid baseline is read-only. Save customer lessons through the search feedback API.",
// End of the feedback result.
});

// Do the search. "export_catalog" is the export function to use. It records usage if you do not give another one.
const runProject = async (settings: ToolsProps, operation: "search" | "feedback", export_catalog: (settings: ToolsProps) => ToolReturn | Promise<ToolReturn> = exportCatalog): Promise<ToolReturn> => {
  // Keep the path of the temporary folder, so that it can be deleted at the end.
  let temporary: string | undefined;
  // Start the steps that can fail.
  try {
    // Make sure that the query is text, is not empty, and is not longer than 2000 characters.
    if (typeof settings.query !== "string" || !settings.query.trim() || settings.query.length > 2000)
      // Stop with an error if the query is not correct.
      throw new Error("Supply a query of 1 to 2000 characters.");
    // Get the project path. A search uses "path". Feedback uses "save_path".
    const projectPath = operation === "search" ? settings.path : settings.save_path;
    // Use the given project path. If there is no path, use the default project folder.
    const project = resolve(typeof projectPath === "string" ? projectPath : defaultProject);
    // Read the project settings file, rab.world.json.
    const world = await read(resolve(project, "rab.world.json"));
    // Make a helper that finds one named location in rab.world.json.
    const entry = (name: string) => {
      // Find all locations that have this name.
      const matches = world.paths.filter((row: { name: string }) => row.name === name);
      // Stop with an error if there is not exactly one location with this name.
      if (matches.length !== 1) throw new Error(`Register exactly one ${name} location in rab.world.json.`);
      // Return the location.
      return matches[0];
    // End of the helper.
    };
    // Find the model folder.
    const model = resolve(project, entry("hybrid-seat-ranking").path);
    // Get the model folder path relative to the project folder.
    const childPath = relative(project, model);
    // Stop with an error if the model folder is outside the project folder.
    if (childPath.startsWith("..") || isAbsolute(childPath)) throw new Error("Model state must stay inside its project.");
    // Find the Python program location.
    const python = entry("search-python");
    // Find all database locations.
    const databases = world.paths.filter((row: { name: string }) => row.name === "database");
    // Stop with an error if there is not exactly one database.
    if (databases.length !== 1) throw new Error("Register exactly one catalog database in rab.world.json.");
    // Set the folder that holds the temporary search folders.
    const temporaryRoot = resolve(defaultProject, ".tmp/hybrid-search/requests");
    // Make that folder if it does not exist.
    await mkdir(temporaryRoot, { recursive: true });
    // Make a new temporary folder for this search only.
    temporary = await mkdtemp(resolve(temporaryRoot, "search-"));
    // Set the path of the catalog file in the temporary folder.
    const catalog = resolve(temporary, "catalog.json");
    // Export the records from the database into the catalog file.
    const exported = await export_catalog({
      // Give the database file and the catalog file path.
      path: resolve(project, databases[0].path, databases[0].file), save_path: catalog,
      // Give the message ID if the search has one.
      ...(settings.message !== undefined ? { message: settings.message } : {}),
    // End of the export settings.
    });
    // Stop with an error if the export failed.
    if (exported.status !== "complete") throw new Error(exported.error || "Catalog export failed.");
    // Send the search to the Python worker and wait for the result.
    const result = await searchWorker(project, model, resolve(project, python.path, python.file), resolve(toolsDirectory, "project_search.py"), catalog, settings);
    // Return the search result with the original settings.
    return { ...result, return_type: "results", settings };
  // Catch any error from the steps above.
  } catch (error) {
    // Return an error result with the error message.
    return { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  // Always do these steps at the end, also after an error.
  } finally {
    // Do the cleanup only if a temporary folder was made.
    if (temporary) {
      // Set the folder that holds the temporary search folders again.
      const temporaryRoot = resolve(defaultProject, ".tmp/hybrid-search/requests");
      // Get the temporary folder path relative to that folder.
      const child = relative(temporaryRoot, resolve(temporary));
      // Stop with an error if the folder to delete is not inside that folder. This prevents deleting the wrong folder.
      if (!child || child.startsWith("..") || isAbsolute(child)) throw new Error("Unsafe request cleanup path.");
      // Delete the temporary folder and the catalog file in it.
      await rm(temporary, { recursive: true, force: true });
    // End of the cleanup check.
    }
  // End of the final steps.
  }
// End of the search function.
};
