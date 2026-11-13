Markup to Factory composition

CLI:
  node src/dashboards/Factory/components/ComponentFactory/js/generateCompositionFromMarkup/generateCompositionFromMarkup.mjs path/to/Demo.tsx output.json
  node src/dashboards/Factory/components/ComponentFactory/js/generateCompositionFromMarkup/generateCompositionFromMarkup.mjs path/to/markup.html
  (stdin is supported by using - as the input)

Function:
  import { generateCompositionFromMarkup } from './generateCompositionFromMarkup.mjs';
  const result = generateCompositionFromMarkup(sourceString, { name: 'MyCard' });

Returns the shared HouseKeys ToolReturn envelope: return_type: results,
status: complete/error, settings with the source and options, and response.
response contains type: composition, version: 2, name, root, and warnings.
Failures return error text instead of throwing. The CLI outputs the full
envelope and exits nonzero for errors. Existing output files are overwritten when supplied.

Accepts static HTML/JSX markup or a TSX component/demo containing a JSX return.
Uses the first JSX return found in source order; supply a single component/demo
when a source file contains several. It does not resolve imports or execute code.

Supported HTML tags become nodes. Unsupported wrappers retain supported children.
Images, SVG, media, scripts, styles, and form controls are skipped entirely.
Static text and literal JSX expressions survive. Mixed text is placed in spans
where needed to preserve order. Dynamic values are skipped with warnings.
Map callbacks contribute one template; arrays and runtime values are not evaluated.
Conditional && content is retained; ternaries use their first branch, with warnings.

Imports container/action/effect classes, scroll atoms, padding tokens, data-grid,
data-area, data-cols/rows, data-gap, static inline styles, href, and disabled.
One custom class becomes the node name; names and IDs are made unique.
External stylesheets, handlers, dynamic classes/styles, imported components,
and runtime behavior are not reconstructed. This is a loose static importer,
not an exact reverse compiler. Review warnings and the generated composition.

Verification: node tests/markup-to-composition.mjs


