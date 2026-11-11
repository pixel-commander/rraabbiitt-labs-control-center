LOCAL HYBRID RUNTIME
====================

This package contains the established hybrid-ranking Python implementation and
its adjacent world-embedding dependency. The source was copied into the dashboard
from its registered HQ runtime. Numeric IDs and shipped model assets were retained.
The world-embedding catalog bridge points at this project's existing database
indexer. It does not carry another indexer implementation or catalog database.

The active inference dependency pins are in requirements.txt in this folder.
Run npm run hybrid:setup from the project root. It installs into the local .venv.
Use Python 3.12 or newer. Python 3.14.5 was verified for this installation.
The original model-level requirements are retained with the copied engine for
provenance; they include optional training/tracking packages not used by the app.

rab.world.json registers this runtime and the local Python interpreter.
Model state lives separately under learning/shipped-with-app/search-results/
saved-models/hybrid-seat-ranking. The app adapter binds the engine to that model
and the database catalog. It blocks writes to shipped model state.

No model inference, model download, or training occurs merely by copying source.
Setup installs dependencies. Search loads local pinned model assets offline.
The legacy mutation APIs in the engine are not an enabled app training workflow.
