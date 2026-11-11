TOOL USAGE

POST /api/tool-usage on the site host. JSON: {id, date, message?}.
id is the existing numeric tool ID. date is epoch milliseconds. message is an
optional numeric database message ID, never text. Each tool reports once after
its work, before return. finishToolUsage is the shared client.

The database location comes from the root rab.project.json database registration.
One row is appended to tool_usage per report. Repeated tool IDs are retained;
COUNT(*) counts uses and date records when. No invocation/parent ID is added.
HTTP success/error returns use return_type api-call. The client makes no console
output and appends a tracking error to the tool return on failure, preserving its
status, settings and response. Missing API helper/service and timeouts are safe.
