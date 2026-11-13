
Layout / Dev modes
- New composition chooses Layout or Dev once (older HTML documents remain readable). Existing compositions cannot switch modes.
- HTML draws real divs. Text edits the selected element content directly.
- Properties control block/flex/grid, alignment, wrapping, CSS dimensions, spacing and typography.
- Root canvas positioning belongs to editor frames; exported markup has no editor frames or x/y coordinates.
- Nested divs participate in CSS flow. Arrow keys move root editor frames only; nested layout is controlled by CSS.
- Dev assigns box-N class names. All class names use lowercase kebab-case. Rename Class to name a reusable style; Saved classes inserts an instance (including a copy of the current subtree).
- Dev instances share appearance, pseudo states and layout. Content and child structure remain local to each instance.
- Save/Open and JSON exports preserve mode, class definitions and instances. Clipboard remaps conflicting class names across compositions.
- Export HTML downloads a standalone page. Export component downloads JSX with class styles and theme variables. The compact Composition panel shows markup and expandable CSS.
- This produces files; it does not publish a site or register generated classes as house atoms.

Review corrections
- Dev non-grid elements have no explicit CSS width/min-width/max-width. Resizing their root frame changes editor geometry only; grids support explicit CSS widths.
- Resize starts from rendered bounds and changes only the dragged axes, preserving other responsive dimensions.
- Safe CSS dimension values accepted by browser controls are accepted by persistence, including ch, dynamic viewport units and CSS-wide keywords.
- Toolbar buttons keep native keyboard activation; canvas shortcuts ignore controls.
- New/Open protect all unsaved edits, including empty-document title/theme changes. Save/Open clear stale recovery; edits made during a save remain recoverable.

Layout output contract
- The visible Layout mode retains the existing canvas storage value for compatibility.
- Layout Save and JSON export capture rendered box coordinates and dimensions, including grid-arranged children.
- Layout Composition output uses absolute positioning for every box. Grid controls remain authoring metadata in its JSON.
- Dev Save preserves the actual HTML hierarchy and CSS layout rules; editor wrapper positions never become exported CSS.
