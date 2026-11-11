SearchMessageBox

Accepts the complete message-box prop contract and renders that component directly. Adds search-message-box to its root className. No extra DOM element, local state, API or persistence. Defaults and callbacks are those of its underlying component.

Props
place_holder (optional): string | undefined
container_class (optional): string | undefined
submit_class (optional): string | undefined
children (optional): ReactNode
className (optional): string | undefined
value (optional): string | undefined
handleChange (optional): HandlerKey<string, "message-box", void, MessageBoxProps> | undefined
handleSubmit (required): HandlerKey<string, "message-box", void, MessageBoxProps>
id (optional): number | undefined
name (optional): string | undefined
title (optional): string | undefined
description (optional): string | undefined
path (optional): string | undefined
save_path (optional): string | undefined
save_file (optional): string | undefined
paths (optional): PathsProps[] | undefined
date_added (optional): number | undefined
date_updated (optional): number | undefined
date_used (optional): number | undefined
date (optional): number | undefined
date_start (optional): number | undefined
date_end (optional): number | undefined

Defaults
place_holder="Search your world…"; container_class="container-outline"; submit_class="action-filled"; className=""; omitted value uses an empty local draft.

Callbacks and prop behavior
handleSubmit is required and receives (trimmedText, "message-box", props). Blank input does not submit. handleChange receives (text, "message-box", props). Supply value plus handleChange for controlled input; clear value after submission. children fills the lower-left area.

Style overrides on visual components use the inherited container/action class props, className, theme tokens, or parent CSS. The top-level feature accepts no style props.
