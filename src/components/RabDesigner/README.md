# RAB Designer

The `/rab-designer` dashboard edits a recursive document of boxes and text. Children use the same document-node contract as their parent. Drawing, property edits, theme changes, and state styles share the document history and persistence owner in `hooks/useDesigner.ts`.

## Editing

- Draw a box with R, text with T; V selects and H pans. Space temporarily pans. Wheel zoom stays anchored to the pointer.
- Auto mode pans empty canvas and positions selected objects. Escape cancels gestures or clears selection. Arrow keys nudge one canvas pixel; Shift nudges ten.
- Ctrl/Cmd+C, X, and V copy, cut, and paste the selected object with its entire child tree and styles. Paste assigns fresh IDs, keeps the original parent when available, and offsets repeated copies. Cut and paste each support undo. Native text-field clipboard behavior is preserved. Theme tokens missing from a destination composition are brought along; existing destination tokens win.
- Properties apply directly. Grids use the shared numeric `data-cols` / `data-rows` contracts, gap, and padding.
- Appearance supports backgrounds, borders, independent sides/corners, opacity, and multiple outer/inset shadow layers. Color swatches open a saturation/brightness picker with hue, alpha, and theme swatches.
- Normal, hover, active, focus, and disabled styles have separate overrides. State CSS uses real pseudo-classes and explicit previews. The advanced CSS sections are optional.
- Theme loads the current tokens (preserving readable `var()` aliases), imports/exports token JSON, and allows adding/editing tokens. Theme changes are scoped to the canvas document.
- Composition shows compact, highlighted JSX for the selection and its descendants. Copy the accompanying CSS + theme as well; output uses house atom styles.

## Persistence

Save composition writes `compositions/<id>.json` through the dashboard's Vite middleware. Open validates and reads those files. Export JSON downloads the full recursive document, theme, and state overrides. Browser recovery uses session storage so concurrent editing tabs do not overwrite one another's recovery; legacy local recovery remains readable.

The editor does not yet publish generated atoms or register grid topologies. Theme editing does not rewrite the application's global theme files.

## Verification

Run `node --test src/dashboards/RabDesigner/api/designer.test.mjs` for persistence, validation, CSS state generation, shadow parsing, and color conversion checks. Run `npx tsc --noEmit` and `npx vite build` for the UI. The editable overview and effects examples are in `compositions/`.
