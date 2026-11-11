Field feedback training

Send the shared settings bag as JSON on stdin; read ToolReturn from stdout. query is the original question, path is the original result record key, name is the judged field, and optional id is the selected correct record House ID. content is JSON with vote up/down, correction for a down vote, or rephrase for another wording. An up vote with id resolves the selected record and trains its actual field value. Rephrases inherit the previous judgment and selected ID. Original query groups are retained. Settings are returned unchanged; source records are not edited. Training saves a versioned checkpoint.

This operation is for user judgments. New rows retain user origin and approved
review status. Supplied content.origin must be user and review_status approved
when present. LLM suggestions belong in pending candidate batches and must not
be submitted here as if they were user feedback.
HQ PROJECT ADAPTER (2026-11-09)
Entry train-field-feedback.ts calls project-search.ts with operation feedback.
save_path is the project root, not the result path. path remains canonical record key.
The selected project rab.world.json resolves its model and Python registrations.
name=all votes on name/title/description together. vote supports up/part/down.
The original runtime writes data/feedback.sqlite, data/training-chunks and checkpoints
under .rab/models/hybrid-seat-ranking. No neural weight fine-tuning occurs here.
