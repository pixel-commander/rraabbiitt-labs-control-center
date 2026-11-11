HYBRID SEARCH CONNECTION
========================

The registered tool 1793154927345 uses the local project-search.ts and
project_search.py adapters. Search runs the existing established hybrid engine:
per-field BM25 plus semantic retrieval and reciprocal-rank fusion, followed by
the pinned cross-encoder reranker. There is no FTS-only substitute on this path.

rab.world.json owns runtime locations. hybrid-seat-ranking identifies the
project's shipped baseline under learning/shipped-with-app/search-results/
saved-models/hybrid-seat-ranking. hybrid-seat-ranking-runtime identifies the
local engine in packages/hybrid-search-runtime/models/hybrid-seat-ranking.
search-python identifies this project's .venv interpreter. Relative registrations
resolve from the project folder after transfer. Run npm run setup to install.

The local export-search-catalog tool reads records.data from the single database
registered in rab.project.json. The adapter passes that JSON to the unchanged
ranking code. It does not use the HQ catalog or create another database.
Original numeric IDs and record keys remain in results.

Only search is enabled through this baseline adapter. The feedbackProject entry
refuses writes. The Python adapter rejects initialization, feedback, training,
and nonempty custom search options. A plain query uses the active baseline and
the current catalog. Temporary catalogs are created under this project's
.tmp/hybrid-search/requests and removed after the worker exits.

Pinned encoder and reranker bytes are copied from the existing verified HQ
assets. The clean checkpoint1794201063837438200 has no feedback examples.
It was copied without HQ catalogs, learned corrections, MLflow, or feedback DBs.
Internal asset paths were shortened for Windows. Their SHA-256 values remain
unchanged. This is a search connection, not a training run or model download.

Install the active runtime with packages/hybrid-search-runtime/requirements.txt
through npm run hybrid:setup. Dependencies live in the project .venv.
The ranking engine imports the adjacent world-embedding module inside the same
local runtime package. Keep that package layout when transferring.
Experiment tracking is not invoked by this search path.

Other copied toolkit entries are retained source. Their presence does not make
their training/runtime requirements installed or their mutation paths enabled.
Customer feedback is saved separately under learning/learned-on-site/search-
results/lessons. It must not write or activate the shipped model state.

APPROVED INSTALLATION LESSONS

The search binding now reads approved installation lessons through the adjacent
learned_lessons.py helper and passes them to the established engine's existing
private evidence interface. The shipped model stays read-only. This indexes
approved examples; it does not tune neural weights. See api/search-records/
REPHRASE.txt from the project root for locations, capacity and exact scope.

