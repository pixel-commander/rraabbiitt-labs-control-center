SEARCH RECORDS API
==================

Mount handleSearchRecords(world, req, res, url?) from search-records.mjs.
The shared server owns routing, host/origin checks, and authentication.
This module does not start a server, create a database, or alter schemas.

SEARCH

POST /api/search-records
  {query, message: SAVED_MESSAGE_ID, limit: 20}

The saved message must have type=user and description equal to the trimmed
query. limit is optional, from 1 to 100. Records come from the single database
registered in rab.project.json. Original House IDs and raw data are retained.
No manifest fallback runs.

Success uses {return_type:"api-call",status:"complete",settings,response}.
response.paths contains ranked results; the first is the top result.
response also has mode, message, summary, and the hybrid tool's evidence body.
summary reports count, candidates, feedback_scope and neural:true on success.

Each result retains its original fields, record_key and hybrid ranking details.
hybrid_score, ranking.score and score preserve the established tool's score.

Mode is hybrid. The API calls registered tool 1793154927345 with this world's
project path. The tool exports this project's registered records database and
uses the registered pinned encoder/reranker baseline. Per-field BM25, semantic
retrieval and reranking belong to that existing engine. No FTS substitution or
fallback runs. Missing runtime/configuration returns an explicit error.
Approved lessons feed the established engine evidence interface. No separate
score arithmetic is added, and no neural weights are updated. Scores are ranking values, not probabilities.

REPHRASE AND FEEDBACK

Read REPHRASE.txt for complete semantics, stored context and failure behavior.

POST /api/search-records/feedback
  {query,message,id,path:record_key,name:"all",content:{vote:"up"}}
  vote is up, part, or down. query must match the saved message.

POST /api/search-records/rephrase
  {query:NEW_WORDING,message:NEW_MESSAGE_ID,id,path:record_key,name:"all",
   content:{vote:"up",rephrase:NEW_WORDING,
            source:{query:ORIGINAL_QUERY,message:ORIGINAL_MESSAGE_ID,rank:SOURCE_RANK}}}
  Both new and original messages must exist. Their descriptions must match.
  The original query is not relabelled for the selected lower-ranked result.

Both endpoints accept content as an object or a JSON string. Responses use
return_type, status, settings and response/error. A successful save returns
file, path, message, id, grade, lesson_type, learning, scope, mode,
neural_training:false, warnings. Rephrase also returns original_message/query.
Paths are fixed to learned-on-site. Destination/phase override keys are refused.
HTTP409 indicates the established evidence capacity would be exceeded, before
any lesson is saved. HTTP400 is invalid input/context. HTTP503 is unavailable
DB/runtime/storage. No fallback results or automatic training run on failure.

Search response.feedback contains latest saved vote selection for returned
records as {record_key,field:"all",vote}. Search scores and ordering remain the
established engine's output; there is no separate +1/-1 scoring layer.


SKILL DISPLAY RETURNS

When the first ranked record is a skill, the search tool and HTTP response
return_type are skill. response.body is that skill's display text. Original
hybrid evidence remains in response.evidence; paths and scores are retained.
Running the app returns only npm run dev. Viewing the app resolves outputs.body
source by the current world ID and key url, then returns rab.world.json.url.
The URL includes the configured port and route. The frontend displays this
body instead of a description or an engine evidence JSON string.

