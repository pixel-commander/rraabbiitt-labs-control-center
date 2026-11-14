Factory tools

Composition authoring directions, exact node fields, layout recipes and a complete
JSON example: ../components/ComponentFactory/README.txt. Read it before building.
Use the public version 2 nested tree, not the private editor/legacy flat types.

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

LLM workflow: discover and inspect each tool registration, build a version 2 tree,
generate to validate/normalize, inspect warnings and rendered layout, then save.
Supply exactly one of composition or content to generate. Its response IS the
normalized document (with presentation type/warnings), not response.composition.
Save receives composition as an object; MCP use_tool.content is the serialized
settings object. Report the save response.url. Never guess tool registration IDs.

These tools do not grant permissions. Execution access must be enforced by the
MCP host. Existing Factory artifact Save and scaffolds are separate.
