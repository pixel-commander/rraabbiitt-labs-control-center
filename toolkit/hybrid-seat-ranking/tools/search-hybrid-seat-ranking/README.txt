Ranks records by intent and separate name, title and description evidence.

Send the shared settings bag as JSON on stdin; read the shared ToolReturn from stdout. Supplied settings are returned unchanged. query is required. Search is read-only. Field contributions are in ranking.contributions; field cosine scores in ranking.features; detailed evidence and intent in response.body.

Optional content JSON may contain checkpoint: a versioned path such as
checkpoints/1793156735503290500. It must be inside this model checkpoints folder.
Named-checkpoint search uses saved weights/catalog/feedback (or the old feedback
parent chain), never today's changing feedback, and does not switch active.json.
Omit content to use the live model. Scoring uses the installed implementation;
retain source hashes with reports when comparing subsequent code changes.

Live search reads the current registered catalog on each request and encodes
its current fields using saved weights/vocabulary. Deleted or unregistered tools
and their orphaned usage records disappear; missing tool implementations are
excluded too. Adds and edits are visible without retraining. Unseen terms can
match literal fields, but need training for new semantic relationships. This
refresh is read-only: no checkpoint, source, or database is rewritten. Historical
named-checkpoint searches deliberately keep their original catalog.
