Factory tools

generate-factory-composition: validate/normalize composition JSON, or import static
markup through content. Returns the document directly in response, as does
generateCompositionFromMarkup. Does not save.
find-factory-composition: id loads a saved record; query searches saved metadata.
save-factory-composition: composition plus name creates; id plus composition
updates the existing record while retaining omitted metadata. Saves DB only.

All use House ToolReturn: return_type results, status complete/error, settings,
response or error. Shared settings/returns live in ../Factory.types.ts.
For available CSS atoms use rab-world/tools/list-css-atoms.

Each tool owns its implementation in its own folder. The generate tool calls
the existing ComponentFactory/js/generateCompositionFromMarkup importer and
compositionTree.readComposition validator; no second generator is maintained.
Find and save call the existing Factory database API. Save reuses find for
loading metadata and generate for validation, without creating nested usage runs.

Verification: node tests/factory-tools.mjs (isolated mock API; no DB writes).

Minimal LLM trial prompt: Build and save a small dashboard using Factory tools.
Give me its URL. Let tool usage and errors reveal what documentation is missing.

These tools do not grant permissions. Execution access must be enforced by the
MCP host. Existing Factory artifact Save and scaffolds are separate.
