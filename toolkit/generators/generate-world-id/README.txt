generate-world-id

Call generateWorldId({}) or generateWorldId(). Returns exactly { id: number }.
No other props, filesystem work, CLI, tracking or metadata in the return.
Preserves generate-timestamp registration ID 1790784702601 under the new name.
IDs are timestamp-based and monotonic within one loaded module instance.
They are not guaranteed unique across processes, machines or module reloads.
This produces House record IDs, not only world-record IDs. It does not register
anything. Old validId is not part of generation; consumers validate their own
input types. The owning host places the record directly in response.
