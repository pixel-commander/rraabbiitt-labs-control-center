ComponentFactory: building compositions

Start here when authoring a composition by hand or with an LLM. A composition
is a JSON tree of supported HTML elements. It describes structure, static text,
layout and styling. ComponentFactory edits it and generates HTML/JSX plus CSS.
It does not interpret React component names, hooks, event handlers or data bindings.
Add application behavior in the generated React artifact separately.

1. Choose the output and build the tree

Use a version 2 document with root, rather than the legacy flat elements format.
Give the document a PascalCase artifact name and every node a descriptive,
composition-prefixed CSS name. Start with the root, then its immediate regions,
then the content inside each region. children determines DOM order and nesting.
Use text for literal copy. Use a real child node for each separately styled item.

Complete starter composition (valid JSON, ready to Open in /factory):

```json
{
  "version": 2,
  "name": "ProjectCard",
  "title": "Project card",
  "description": "A card with a heading and actions.",
  "colors": { "--factory-accent": "#83b4ff" },
  "editor": { "frame": { "x": 24, "y": 24, "width": 600, "height": 360 } },
  "root": {
    "id": 1,
    "tag": "article",
    "name": "project-card",
    "grid_type": "header-main",
    "padding": 24,
    "gap": 16,
    "css": { "backgroundColor": "#172033", "color": "#ffffff", "borderRadius": 16 },
    "children": [
      {
        "id": 2,
        "tag": "header",
        "name": "project-card-header",
        "grid_area": "header",
        "children": [
          {
            "id": 3,
            "tag": "h2",
            "name": "project-card-title",
            "text": "Build from JSON",
            "css": { "margin": 0, "fontSize": 26, "color": "var(--factory-accent)" }
          }
        ]
      },
      {
        "id": 4,
        "tag": "section",
        "name": "project-card-body",
        "grid_area": "main",
        "gap": 16,
        "css": { "display": "flex", "flexDirection": "column", "minWidth": 0 },
        "children": [
          {
            "id": 5,
            "tag": "p",
            "name": "project-card-description",
            "text": "One tree drives the canvas and generated code.",
            "css": { "margin": 0, "fontSize": 16, "lineHeight": 1.6, "color": "#ffffff" }
          },
          {
            "id": 6,
            "tag": "footer",
            "name": "project-card-actions",
            "gap": 12,
            "css": { "display": "flex", "flexWrap": "wrap", "alignItems": "center" },
            "children": [
              { "id": 7, "tag": "button", "name": "project-card-build", "action_class": "action-main", "text": "Build" },
              { "id": 8, "tag": "a", "name": "project-card-docs", "text": "Read docs", "href": "/style-guide#stylers" }
            ]
          }
        ]
      }
    ]
  }
}
```

2. Follow the public type contract

ComponentFactory.types.ts defines FactoryDocument and FactoryNode.
../../Factory.types.ts defines FactoryCompositionInput and FactoryNodeInput for
tool authoring: IDs may be omitted there and are assigned by readComposition.
FactoryNode and the normalized saved document require numeric IDs.

Document fields:
  version         Use the number 2.
  root            One FactoryNode, not an array.
  name/title/
  description     House metadata for the composition, outside root.
  composition_id  Optional database identity, distinct from an artifact scaffold ID.
  colors          Optional map of CSS custom property names to values. Include --
                  in keys, e.g. --factory-accent; reference with var(...).
  editor.frame    Optional x, y, width, height numbers for the canvas only.
                  Frame dimensions are NOT exported component width/height.

Node fields (this is the complete allowed field list):
  id              Unique positive safe integer across the whole tree. Preserve IDs
                  when editing an existing composition. Omit only on authoring input.
  name            Required, unique across the tree; matches
                  ^[a-zA-Z_][a-zA-Z0-9_-]*$. Emitted as a CSS class, not an HTML id.
  tag             Required: article, aside, div, footer, header, main, nav, section,
                  span, h1, h2, h3, h4, h5, h6, button, a, p, strong, em, small,
                  ul, ol, li. Lists should contain li children.
  container_class Existing container atom class(es), separated by spaces.
  action_class    Existing action atom class(es), separated by spaces.
  effect_class    Existing effect atom class(es), separated by spaces.
  grid_type       One preset listed below.
  grid_area       Local slot in the immediate parent's grid. No slash paths.
                  Siblings cannot share a grid_area. Independent of node.name.
  grid_rows       Integer 1 through 12.
  grid_cols       Integer 1 through 12.
  scroll_x        Boolean; generates overflow-x: auto or visible.
  scroll_y        Boolean; generates overflow-y: auto or visible.
  padding         Number in pixels, CSS length, spacing token, or object with
                  top/right/bottom/left values of those types.
  gap             Number in pixels, CSS length, or spacing token.
  css             React.CSSProperties object: camelCase property names and static
                  string/number values. Example: { "fontSize": 20, "margin": 0 }.
  text            Literal string, escaped on export. Not HTML, JSX or Markdown.
  href            Static URL for tag a. Defaults to # if omitted on links.
  disabled        Boolean for tag button.
  children        Array of nodes; omitted or [] for a leaf.
  grid_custom     Advanced drawn grid: { rows, cols, areas: [...] }. Each area has
                  numeric id, r1, c1, rows, cols; see GridAreaSelect.types.ts.
  grid_spans      Advanced map of zero-based slot indices to { rows?, cols? }.
  states          Button paint map keyed by default, selected, hover, disabled,
                  mousedown. Values are FactoryPaint, not arbitrary CSS objects.
                  Example: { "hover": { "background": "#2450aa", "radius": 8 } }.
                  selected exports an [aria-pressed="true"] selector; behavior
                  that sets this attribute must be implemented separately.

Do not author kind, area, atom_class, layout, style, elements or gridStyle on
nodes. Those belong to internal editor or legacy formats. Do not add className,
props, component, onClick, data-* or arbitrary HTML attributes as node fields.
Unknown node fields fail validation. Inputs, images, SVG and custom React tags
are outside the current supported node contract.

3. Choose one layout strategy per container

Preset grids use the project's shared CSS. Put a wrapper child in each required
slot, and put that region's content inside the wrapper. Multiple items in main
belong inside ONE child with grid_area: main. Use unique prefixed names on these
wrappers even when nested grids reuse a local slot such as main.

Preset          Immediate child grid_area values
single-cell     main (exports data-rows="1" data-cols="1")
side-left       side, main
side-right      main, side
header-main     header, main
main-footer     main, footer
shell           header, main, footer
side-cols       left, main, right
holy-grail      header, left, main, right, footer

grid_type exports data-grid (except single-cell); grid_area exports data-area.
The validator checks preset names, but does not check that an area exists in
its parent preset. Check this yourself to prevent structurally valid bad layouts.

For equal tracks, use grid_rows/grid_cols and direct children in DOM order.
For a flex row/column, use css.display: flex, css.flexDirection and gap; omit
preset/track fields. For bespoke CSS grids, use css.display: grid with explicit
gridTemplateColumns/gridTemplateAreas and suitable child placement. Do not mix
preset, drawn-grid and CSS template strategies without inspecting their output.
The JSON has no breakpoint/media-query field; add responsive CSS to the artifact
when required. Set exported sizes in css, not editor.frame. Use minWidth: 0 and
appropriate overflow on regions that must shrink or scroll.

4. Use real styles and tokens

Spacing tokens xs, sm, md, base, lg, xl become var(--space-TOKEN). Numbers are
pixels for lengths; use strings for rem, %, clamp(...) and other CSS expressions.
Keep padding/gap/scroll fields and css equivalents consistent: the public fields
are applied after css and can override it. Common unitless numeric CSS properties
such as lineHeight, opacity, fontWeight and flexGrow remain unitless on export.

Inspect src/atoms/{containers,actions,effects} or the list-css-atoms tool before
using atom names. An invented class passes structural validation but has no style.
Use css for one-off styles; set text color/fontSize explicitly when needed instead
of relying on inheritance (the editor projection supplies text defaults).

The host must load the shared grid, atom and theme CSS. The editor eagerly loads
atom CSS through StyleCol. Generated artifacts still need their host stylesheets.
theme_tokens and layout_tokens are maps of CSS variable names to strings for the
editor controls; they are not a substitute for loading the theme stylesheet.
See demo/theme.ts, demo/layout.json and demo/Demo.tsx.

5. Validate, inspect, then save

LLM workflow:
  a. Inspect the current composition before changing it; retain existing IDs.
  b. Build the smallest complete tree, then add styles. Return JSON without code
     fences when a tool expects content as JSON text.
  c. Validate with generate-factory-composition using { "composition": DOCUMENT }.
     Alternatively supply { "content": STATIC_MARKUP }, but never both.
  d. Check ToolReturn.status and error. The normalized document is in response,
     not response.composition. Review warnings from markup import. The tool adds
     response.type and response.warnings as presentation fields; these are not
     node fields. Reuse the normalized version/root/metadata as the composition.
  e. Open the result in Factory, inspect Layers, HTML/CSS and actual appearance.
     Check text contrast, sizing, parent slots and overflow. Validation alone does
     not verify CSS values, atom/token availability, HTML semantics or appearance.
  f. Save using the appropriate flow below; report the returned URL when present.

Through MCP use_tool: query for the tool by name, inspect its registration with
id, then execute that discovered id with content set to the JSON-stringified
settings object. Do not guess registration IDs. See ../../toolkit/README.txt.

save-factory-composition takes { name, composition } to create a database record,
or { id, composition } to update one, retaining omitted metadata. It saves DB
only and returns response.url. find-factory-composition loads by id or searches
metadata by query. A saved record opens at /factory#<id>.

The /factory dashboard's Save composition action instead opens the artifact form
(name, title, description, type and destination path) and runs the selected
scaffold, writing JSX/CSS and composition.json. It does not update a DB record
merely because a DB composition was loaded. See ../../README.txt for API and
artifact-save requirements. ComponentFactory alone does not implement persistence.

React usage (imports relative to this folder):

```tsx
import { ComponentFactory } from "./ComponentFactory";
import type { FactoryDocument } from "./ComponentFactory.types";
import design from "./demo/design.json";

export const Editor = () => (
  <div style={{ height: "44rem", minHeight: 0 }}>
    <ComponentFactory
      json={JSON.stringify(design)}
      handleSubmit={(document: FactoryDocument) => {
        console.log(document); // Replace with your persistence handler.
      }}
    />
  </div>
);
```

json accepts an object or serialized JSON, including a bare node. A changed json
prop loads a new document; keep it stable during local edits. Bad input displays
an alert and preserves the last valid document. Legacy inputs migrate on load;
new authoring should always use the public version 2 tree.

New resets locally; Open uses the built-in JSON file picker; View JSON inspects;
Export JSON downloads locally. These actions do not require host callbacks.
Save calls handleSubmit(document, "save", props), falling back to
handleClick({}, "save", props). className adds a root styling hook.

In the UI select the frame/layer, choose Grid, select an area and use Layout to
add elements, then edit Style. Layers selects nested nodes. Drag between cells;
drag/resize the frame for canvas presentation. Escape clears selection when no
custom-grid draft or JSON dialog is open. Switching root grids may delete content
in removed slots after confirmation.

Verification and source references

From the project root with dependencies installed (Node >=24):
  node tests/factory-composition.mjs
  node tests/factory-tools.mjs
  node tests/markup-to-composition.mjs

These verify existing fixtures and conversion/tool contracts. To validate your
own JSON, use generate-factory-composition or load it in the editor. In app code,
validateComposition(input) returns error_count, errors ({ path, message }) and
summary without mutating input. readComposition(input) validates and assigns IDs.
compositionCode(document, "jsx") returns { html, css, code }; code is markup only,
not a complete component file. Neither helper saves. These TypeScript helpers
use the app/Vite module environment; do not assume raw Node resolves their imports.

Source of truth:
  ComponentFactory.types.ts                  Public document/node and editor types
  ../../Factory.types.ts                    Tool inputs and artifact save types
  js/validateComposition/validateComposition.ts   Runtime structural checks
  js/compositionTree.ts                      Import, normalize, editor projection
  js/compositionCode.ts                      HTML/JSX and CSS output
  ../../../../components/GridLayoutDisplay/GridLayoutDisplay.types.ts   Presets
  ../../../../components/GridAreaSelect/GridAreaSelect.types.ts         Drawn grids
  demo/design.json                          Larger working nested example
  js/generateCompositionFromMarkup/README.txt  Static importer and its limitations
