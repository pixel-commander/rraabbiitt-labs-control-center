SHIPPED SEARCH CHECK
===================

Run from the dashboard root:
  npm run test:hybrid-baseline

Run this after moving the app, before connecting project data. It checks the
shipped search model against a frozen set of 89 system/toolkit records and seven
known questions. Both component-creation questions must rank the original
New Component runner first. Four other capability checks require their
original record ID among the first three results. The exact CLI question
"what is the cli to run the app" must rank the original Running the app skill
1793126984423 first and return its actual npm run dev instruction.

No project database, site server, customer messages or learned-on-site lessons
are used. This does not train the model or refresh the catalog. Expectations
are evaluation labels, never training lessons. No fixtures change during a run.

On the destination, run npm ci and npm run setup. Runtime registrations in
rab.world.json are project-relative. Setup selects the platform interpreter
inside .venv. Keep the shipped model assets and tests with the product.
Do not copy a Python virtual environment between machines. Missing registered
dependencies fail explicitly; this test does not download or install them.

catalog.json preserves original numeric IDs and system fields captured on
2026-11-11. It excludes project components/documents, customer messages and
lessons. expectations.json fixes the catalog hash, clean checkpoint engine
hash and expected IDs/rank limits. Review any fixture/model update explicitly;
never rewrite expected results automatically to make a failing test pass.
The original six cases and 88 records were retained when the authorized CLI
regression added one imported system skill and its question. That addition
has source-file SHA provenance in expectations.json; it is not a training label.

The existing hybrid engine owns BM25, embeddings, RRF and cross-encoder scoring.
This runner only supplies the frozen catalog and checks its returned rankings.
It verifies pinned model asset hashes, empty baseline lessons, finite hybrid
scores and unchanged shipped files after inference. It loads models once for
the batch. No test writes to shipped-with-app or learned-on-site.

The report is written to this project's .tmp/hybrid-search-baseline.
No parent workspace, AGENTS.md, or external temporary folder is required.
An error or failed expectation produces a nonzero exit code. Passing these
questions is a transfer/regression check, not proof that every search is good.
