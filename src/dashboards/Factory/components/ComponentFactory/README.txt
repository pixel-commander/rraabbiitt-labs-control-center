ComponentFactory

Choose a grid for the selected layer in the left Grid tab. Select a canvas
area to open Layout and add an element. Edit the selection in the Style tab.
Drag elements between cells. Drag the grid label to move the frame or use its
handles to resize it. The lower right pane previews the composition HTML and CSS.

handleSubmit receives (composition, "save", props). When absent, Save
uses handleClick. New, Open, and Export JSON emit their handleClick
actions for the caller. className adds a root styling hook.

Pass theme_tokens and layout_tokens as maps of CSS custom property names
to string values. See demo/theme.ts and demo/layout.json. The Style color
picker uses theme_tokens and Theme lists layout_tokens. The canvas inherits
the loaded theme stylesheet. The footer can override its backdrop color.
Exported CSS references the same custom property names.
