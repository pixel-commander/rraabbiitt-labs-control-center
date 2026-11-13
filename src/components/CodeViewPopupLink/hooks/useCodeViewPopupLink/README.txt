useCodeViewPopupLink
===================
Accepts full CodeViewPopupLinkProps. Owns local open, code, error, loaded source,
window rect and trigger focus. Returns those plus pending/show/close/move.
Loads on open and source/code changes; ignores stale asynchronous responses.
Caller owns loading and saving implementations. Does not render or style UI.
