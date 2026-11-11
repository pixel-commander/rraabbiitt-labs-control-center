ToolCol

Page-local right column for World Search.

Props
children: Optional ReactNode displayed in the scrolling region.
is_open: Optional boolean. Default false. Parent owns this value.
className: Optional class composed with tool-col and its state class.
Also accepts HouseKeys. Custom props are not spread to the DOM.

The wrapper is positioned relative and clips overflow. Closed state adds
is-closed and max-width: 0. Open state adds is-open with no max-width.
The absolute inner grid fills the height and keeps max-content width.
Its child owns vertical scrolling. Closed content is inert and aria-hidden.

The parent supplies width and children compose container atoms. Override
structure with className or parent CSS. No callbacks or internal state.
