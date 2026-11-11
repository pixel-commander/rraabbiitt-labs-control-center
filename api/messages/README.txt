MESSAGE API

The shared site/MCP HTTP handler serves these routes when the site
middleware forwards /api/messages/ requests:

POST   /api/messages/set          Create a message. Duplicate IDs return 409.
GET    /api/messages/get?id=ID     Read one message. Missing IDs return 404.
PATCH  /api/messages/edit         Change supplied fields. Retain other fields.
DELETE /api/messages/delete?id=ID Delete one message. Missing IDs return 404.

POST and PATCH require application/json. Supply a positive safe integer id.
Generate the numeric ID on submit. The API retains the supplied ID.
Writable fields are name, title, type, description, tags, file, path, paths.
tags and paths accept arrays or null. Other fields accept strings or null.
The API uses the current House message schema. It does not add message fields.

Example set body:
  {"id":1794419000000,"type":"user","description":"Search my world"}
Example edit body:
  {"id":1794419000000,"description":"Updated message"}

Responses use return_type=api-call, status, settings and response or error.
The server resolves the database from rab.project.json's database entry.
Missing database access returns 503. No manifest fallback stores messages.
Existing server host, origin, and token checks apply to these routes.
Use the shared site server. A separate MCP process is not required for site
requests. The site middleware must forward all /api/messages/ action routes.
The endpoint owner does not generate IDs or add timestamps to the schema.
For submitted user text, supply type="user" and description=the message text.
On success, response is the saved row with tags and paths decoded as arrays
or null. Delete returns response={id}. Set returns HTTP 201; other successful
actions return 200. Invalid inputs return 400, missing IDs return 404,
duplicate IDs return 409, and unavailable database access returns 503.

SEARCH CLIENT CONNECTION

The search hook's messagesApi.ts exports:
  saveSearchMessage(text, id = Date.now())
    POST set with {id, type:"user", description:text.trim()}.
    Resolves {id, query, date, record} only after database save succeeds.
    date is derived from the submitted timestamp ID; it is not a DB column.
  getSearchMessage(id)             Read the saved row.
  editSearchMessage(id, fields)    Change only supplied House message fields.
  deleteSearchMessage(id)          Delete the saved row; resolves {id}.

Call saveSearchMessage from the submit owner. Await it before starting search.
Keep its id as the message context for search, tool calls, and feedback.
Display query as the user message. Use date for the displayed submission time.
Keep or restore the draft if persistence fails. Catch errors in the submit owner.
A failed request does not return a saved-message context. No local fallback runs.
If an ID conflict occurs, report it; this helper does not overwrite the record.
The optional id permits the caller to retain its original submission identity.
No conversation ID, model choice, search results, or feedback are stored by
this helper. The current message table does not define those fields.
