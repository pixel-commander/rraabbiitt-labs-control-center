runner-world-tooling

run({runs}, callbacks?) resolves tool IDs from the current world. Each input run
has type, numeric tool id, settings and optional House identity fields.
runnerWorldTooling({runs}, {execute,...callbacks}) is the shared executor owner.
Returns a flat array containing each tool return plus numeric date_start/date_end.
Existing tool IDs are retained. No invocation/parent IDs are introduced.
Tools own usage reporting. Nested runner plans and parallel groups remain supported.
