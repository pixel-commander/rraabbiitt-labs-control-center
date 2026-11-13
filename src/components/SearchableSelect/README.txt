SearchableSelect
================

Selectable records with a searchable list and caller-owned footer.

Implementation: SearchableSelect.tsx
Exports: SearchableSelect

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { ReactNode } from "react";
import type { HouseKeys, PathsProps, HandlerKey } from "../../HouseKeys.types";

export interface SearchableSelectProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  container_class?: string;
  data?: (HouseKeys & PathsProps)[];
  selected?: HouseKeys & PathsProps;
  placeholder?: string;
  label?: string;
  name?: string;
  disabled?: boolean;
  appearance?: "default" | "text";
  searchable?: boolean;
  status?: { pending: boolean; error?: string };
  handleClick?: HandlerKey<HouseKeys & PathsProps, "searchable-select", void>;
  handleChange?: HandlerKey<
    { query: string },
    "searchable-select",
    void | Promise<void>
  >;
}


Usage skill
-----------
{
  "schema": 1,
  "intent": "use",
  "id": 1793156167379,
  "name": "use-searchable-select",
  "title": "Use SearchableSelect",
  "description": "Select a record from a searchable list.",
  "type": "skill",
  "path": "src/components/SearchableSelect",
  "file": "use.skill.yaml",
  "owner":
    {
      "id": 1793156049058,
      "path": "src/components/SearchableSelect/rab.settings.json",
    },
  "implementation":
    [{ "path": "src/components/SearchableSelect/SearchableSelect.tsx" }],
  "instructions": "Import SearchableSelect. Pass data as HouseKeys/PathsProps records, selected as the parent-owned selected record, and handleClick(data, type = searchable-select, props) using shared HandlerKey. On selection update selected in the parent; data is the selected record and props is the packed settings bag. Supply placeholder and label as needed. Search filters data locally unless handleChange is supplied; for remote search handleChange receives {query}, searchable-select, settings, and the parent replaces data and status. name optionally supplies a hidden form input containing the selected name. Pass children for the always-rendered footer. The header opens the search/list; selection or Escape closes it. No nested form is created. The wrapper is relative and the menu is absolute, so opening it never changes row height. The menu chooses above or below from available space within clipping ancestors and the viewport; no fixed positioning or popover is used. Outside pointer clicks also close it.",
}
