Registered runner 1794537157022. Inputs: path and toolkits from the loaded world.
Dispatches metadata runner 1793984711136 through runner-use-tool, preserving branch tracking.
runTools tracks the final save/report step. Runner callbacks record/update are forwarded;
complete receives the combined final array once. No duplicate wrapper around the child runner.
Persists the report in the existing runs table if available. Missing DB yields complete
with errors when metadata refresh succeeded. No database/table creation.
The API only dispatches this ID and extracts response.report from the tracked results.
