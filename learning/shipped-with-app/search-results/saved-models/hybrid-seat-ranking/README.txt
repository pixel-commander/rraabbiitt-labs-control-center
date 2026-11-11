SHIPPED HYBRID SEARCH BASELINE
=============================

This folder contains the actual pretrained encoder and reranker, plus a
zero-feedback established search checkpoint. It is used by the registered
hybrid search tool. It is not a generated example or a trained customer model.

Source checkpoint: 1794201063837438200, from the registered HQ model.
Copied checkpoint files: engine.json, vectors.npz, examples.json,
record-examples.json. Both example arrays are empty. HQ catalog, feedback,
tracking databases, and later learned checkpoints were not copied.

The 19 pinned model asset files were verified against the engine's SHA-256
manifest. Assets are under data/pretrained/encoder and /reranker. Those shorter
local paths avoid the Windows Python path-length limit. Only location fields
in the copied engine/spec files changed; pinned asset bytes did not change.

checkpoints/active.json selects the clean baseline. The established engine
uses the current exported database catalog. A catalog signature mismatch
recomputes field embeddings for inference; it does not train model weights.

Runtime code and Python are resolved from the project's rab.world.json:
  hybrid-seat-ranking          This local model folder.
  hybrid-seat-ranking-runtime  The local packages/hybrid-search-runtime engine.
  search-python                The local .venv Python executable.

The local adapter supports search only. Feedback, initialization, training,
and custom search options are not enabled through this adapter. It blocks
runtime writes to this shipped baseline. Customer votes are handled by the
separate learned-on-site lesson writer. Search request catalogs are temporary
project .tmp files, not model state. No extra application or feedback database is
created by this connection.

To transfer the dashboard, retain these pinned assets and register the runtime
code and a Python environment with its required packages on the destination.
Run npm run setup to create the destination environment. Do not copy .venv. Read toolkit/hybrid-seat-ranking/README.txt from the
project root for the connection contract. No package or model download was
performed to make this local connection.
