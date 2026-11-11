LEARNING FILES
==============

Choose where the files come from first:

shipped-with-app/    Baseline files maintained by us and shipped with the app.
learned-on-site/    Lessons and output saved at this installation.

Both branches have the same shape:

  search-results/
    lessons/
    grades/
    saved-models/
  question-rephrasing/
    lessons/
    grades/
    saved-models/
  field-ranking/
    lessons/
    grades/
    saved-models/
  search-quality-tests/
    lessons/
    grades/
    saved-models/

WHAT GOES WHERE

search-results/ concerns the complete result returned for a question.
question-rephrasing/ concerns new wording paired with its selected correct result.
field-ranking/ concerns explicit judgments about individual record fields.
search-quality-tests/ concerns test questions and their expected answers.

lessons/ holds the source inputs. A whole-result feedback lesson is one JSON
file per explicit vote. It retains the question, saved message ID, result ID,
vote, original request, and source record snapshot. A vote does not tell us
which field was responsible. The current API writes these lessons only in
learned-on-site/search-results/lessons/.

grades/ holds measured evaluation results. It answers how a particular
search or model version performed against expected answers. It does not
hold save receipts or execution logs. No evaluation files are invented by
folder setup. The current feedback API does not write evaluations.

saved-models/ holds actual model versions when a supported training process
creates them. It does not hold votes or lexical ranking adjustments. Retain
the starting model, lesson references, settings, and actual changes with a
saved version under the owning process contract. No model is created or
claimed by making this folder.

PROCESSING STATE

The feedback API saves processing receipts under each lesson folder's
processing-state/receipts/. These are save records, not model grades.
The current engine rebuilds its private supervised evidence directly from
approved lesson files. Historical snapshots are not authoritative.

WRITE OWNERSHIP

Customer feedback always writes learned-on-site. The API does not accept
custom destinations or a phase selector. A request targeting shipped data
is rejected. Maintainers prepare shipped-with-app files manually here.
This is an API boundary, not an operating-system file permission setting.

The search API calls the registered hybrid engine. The separate feedback
layer reads the installation's saved message votes.
It does not train a neural model, personalize by an authenticated user, or
merge installation votes into the shipped baseline. Reading shipped model
files uses the registered established runtime and the pinned local baseline.

CURRENT CONTENT AND FORMAT

The initial migration found only old folder instructions, metadata, and
empty markers. It found no actual lessons, grades, or models to relocate.
Original metadata was archived in the HQ task workspace. The four subject
IDs were retained at their corresponding learned-on-site locations.

There is no new trainer-ready data format in this change. A later exporter
must use the selected trainer's actual contract and retain original IDs and
vote context. Search quality test inputs stay separate from training inputs.
Do not treat these folders as dependency installations or model downloads.

Model assets and learning files are tracked in Git, including installation
lessons, grades, processing receipts and saved versions. Python environments,
dependencies, build output and temporary files remain ignored.

CONNECTED SHIPPED MODEL

search-results/saved-models/hybrid-seat-ranking/ now contains the verified
pretrained encoder, reranker and a zero-feedback baseline checkpoint. It was
copied from existing pinned HQ assets. No model download or training ran.
Read that model folder's README.txt for provenance and runtime registrations.


SELECTED-RESULT REPHRASES

Rephrase saves approved new wording and the selected correct record in
learned-on-site/question-rephrasing/lessons. It retains both saved message
contexts. The original query is not relabelled for a lower-ranked result.
Approved installation lessons feed the established hybrid evidence interface,
not a separate score boost. Read api/search-records/REPHRASE.txt from the project
root for evidence indexing, negative suppression and the current capacity.



