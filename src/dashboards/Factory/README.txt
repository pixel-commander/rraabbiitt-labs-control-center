Factory

The /factory dashboard uses the header-main house grid.
The header contains TabNav with Component Factory selected.
The main region renders the local components/ComponentFactory component.
Factory accepts the ComponentFactory props and forwards them, using className
on the dashboard wrapper.

Save opens a required HouseKeys form with the designer name prefilled.
handleSave(data, "component-runner") generates JSX and CSS strings and invokes
runner-render-factory-composition by stable ID through the local API.
The Type dropdown selects the component, page, or dashboard runner and its configured destination.
The selected runner creates the scaffold. Only its return expression and
imported CSS file are replaced, preserving props, defaults, imports and types.
Editable compositions are stored beside the generated artifact as composition.json.
Subsequent saves update the matching component and composition.

Save path is the required destination artifact folder, not a project root. The Factory route supplies src/components. The server resolves it against its configured projectRoot, passes it as the runner save_path, and writes composition.json beside the generated component. The server plugin receives explicit path, projectRoot and toolkitRoot options; it does not infer HQ or sibling toolkit folders.

Factory saves pass catalog: false through the runner and metadata steps. Saving writes component files and composition.json without refreshing or registering the catalog.

Nested composition JSON (version 2)

Factory and ComponentFactory accept json={document} or json={JSON.stringify(document)}.
The value loads on mount and when the prop changes. The editor then owns local edits.
Use Open to load a JSON file, New for a blank composition, View JSON to inspect,
and Export JSON to download the current nested document. Invalid JSON displays an
error without replacing the last valid composition. Legacy flat compositions
are migrated automatically when loaded.

Factory accepts a node directly, or a document envelope with version: 2,
optional House metadata (name/title/description), root: a node, colors, and
editor.frame. View/export/save use the document envelope. Every node recursively
uses the same authoring fields:

  tag              HTML element to render.
  name             Unique CSS-safe name; displayed in Layers and emitted as .name.
  id               Stable integer. Assigned on import if omitted.
  container_class  Container atom class(es).
  action_class     Action atom class(es).
  effect_class     Effect atom class(es).
  grid_type        House grid preset (for example header-main or holy-grail).
  grid_area        Local parent-grid slot (for example main), independent of name.
  grid_rows        Explicit row count, 1 through 12.
  grid_cols        Explicit column count, 1 through 12.
  scroll_x         Boolean horizontal scrolling.
  scroll_y         Boolean vertical scrolling.
  padding          Pixel number, space token (xs/sm/md/base/lg/xl), CSS length,
                   or an object with top/right/bottom/left values.
  gap              Pixel number, space token, or CSS length.
  css              Custom CSS properties in camelCase, saved in .name's CSS rule.
  children         Array of nodes using these same fields.

Optional text, href, and disabled supply content and link/button attributes.
The optional grid_custom, grid_spans, and states fields preserve drawn-grid,
spanning, and action-state controls. Nodes do not export kind, area, atom_class,
layout, or style. Old flat and earlier nested formats migrate when opened.
Names and IDs must be unique throughout a composition; grid_area is local to its
parent. Unknown node fields fail validation so authoring typos are visible.

Example node accepted by json={node}:
{
  "tag": "article",
  "name": "card",
  "id": 1,
  "container_class": "container-main",
  "grid_cols": 1,
  "padding": "md",
  "gap": "sm",
  "css": { "borderRadius": 12 },
  "children": [
    { "tag": "h2", "name": "card-title", "id": 2, "text": "Built from JSON" },
    { "tag": "button", "name": "card-save", "id": 3, "action_class": "action-main", "text": "Save" }
  ]
}

The nested tree is the document state, Layers reads the tree, and Canvas renders
its nodes recursively. Existing controls use a derived editor projection; that
flat projection is not saved or exported. Node IDs survive edits. Removing a
node removes its descendants, and drag/drop prevents moving a node into itself.
editor.frame contains canvas-only geometry and is excluded from generated markup.
Both save and the code preview generate markup and CSS from the same tree.

Example design: components/ComponentFactory/demo/design.json.
Live prop-input demo: /style-guide#factory-json.
Verification: node tests/factory-composition.mjs
Full save/scaffold/overwrite integration: node tests/factory-composition.mjs --save
(writes a temporary component below src/.tmp).

Database: factory_component was created through new-db-table in db/main/app.sqlite
with the standard House columns. The table is empty; the existing artifact save
flow continues writing composition.json beside the generated component.

Composition database API

The separate factory_composition table stores House metadata and a composition
TEXT column with a JSON-object constraint. The API adds this column to the
existing table when installed; it does not recreate tables or touch scaffolds.
Objects are stringified only at the database boundary and parsed when loaded.

GET  /api/factory/compositions             List metadata (limit 1–100, offset).
GET  /api/factory/compositions/:id         Load House keys plus composition object.
POST /api/factory/compositions             Create a record; returns 201 and its id.
PUT  /api/factory/compositions/:id         Replace the record while retaining its id.

POST/PUT payload:
{ "name": "MissionControl", "title": "Mission control", "type": "dashboard",
  "description": "An editable dashboard", "tags": [], "paths": [],
  "composition": { ...the node or document JSON... } }

name and composition are required. Optional House columns are title, type,
description, tags, file, path, paths, and id (on create). IDs are generated if
omitted. PUT replaces optional metadata with its supplied values or defaults.
Creation never overwrites an existing ID. Requests are limited to 2 MB.
Database writes generate no artifact files and run no scaffolds.

Open /factory#<id> or /factory/component-factory#<id> to load a DB composition
into the editor. Numeric hash changes and back/forward navigation load the new
record. Loading errors leave the current design intact and display an alert.
The loaded document carries composition_id; this is separate from an artifact's
scaffold id. The existing Save composition button still opens the artifact/file
save flow. To update the stored database record, use the PUT endpoint.

API tests: node tests/factory-compositions-api.mjs
