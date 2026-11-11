Builds versioned retrieval checkpoints from approved field feedback and optional pending candidate examples. The established engine indexes supervised query examples with a frozen pretrained encoder; it does not fine-tune language-model weights.

Send the shared settings bag as JSON on stdin; read the shared ToolReturn from stdout. Supplied settings are returned unchanged. Training accepts the shared bag without required inputs. Saves a versioned checkpoint and retains older checkpoints.

Optional content JSON: mode (live or candidate), include_suggestions (boolean).
Defaults: live, false. Pending suggestions may train only candidate checkpoints.
Example settings: {"content":"{\"mode\":\"candidate\",\"include_suggestions\":true}"}
Candidates never switch active.json or approve their suggestions.

Legacy train.json and candidate sources are read without editing originals.
Each checkpoint retains suggestions.json, examples.json, record-examples.json,
adaptation.json with source hashes, feedback-snapshot.json, catalog.json, weights,
and a report naming the parent checkpoint. Source values and user judgments are
separate from pending inferred field labels and generated rephrases. Warm starts
retain historical learning; excluding pending rows does not unlearn prior weights.
Compare checkpoints through search content.checkpoint using frozen questions
that are never added to training. Source code hashes belong with test reports.
