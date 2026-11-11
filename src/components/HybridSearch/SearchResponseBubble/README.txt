SearchResponseBubble

Accepts the complete chat-bubble union contract and renders that component directly. Adds search-response-bubble to its root className. date remains numeric milliseconds. No extra DOM element or state. Side-specific title/status behavior remains with the underlying bubble.

Props
date (required): number
title (optional): ReactNode
children (required): ReactNode
Footer (optional): ReactNode
user_class (optional): string | undefined
model_class (optional): string | undefined
className (optional): string | undefined
id (optional): number | undefined
name (optional): string | undefined
description (optional): string | undefined
path (optional): string | undefined
save_path (optional): string | undefined
save_file (optional): string | undefined
paths (optional): PathsProps[] | undefined
date_added (optional): number | undefined
date_updated (optional): number | undefined
date_used (optional): number | undefined
date_start (optional): number | undefined
date_end (optional): number | undefined
side (optional): "left" | "right" | undefined
status (optional): "sent" | "read" | undefined

Defaults
side="left"; status="sent" for left messages; user_class="container-alt"; model_class="container-alt"; className="". Left title defaults to Model; right title always displays User.

Callbacks and prop behavior
date is required numeric milliseconds. children is required message content. side accepts left or right. title is shown on left; right always displays User. Both show the time. Footer accepts ReactNode. status accepts sent or read on left only. user_class styles right content; model_class styles left content. No callbacks.

Style overrides on visual components use the inherited container/action class props, className, theme tokens, or parent CSS. The top-level feature accepts no style props.
