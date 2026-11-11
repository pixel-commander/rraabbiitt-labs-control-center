`train.jsonl` starts empty. Add one JSON object per line with `query`, `document`, and `grade` from 0 to 1. It trains the CrossEncoder candidate.

`feedback.jsonl` also starts empty. For an explicit, reviewed field judgment, add one JSON object per line with the exact `query`, a matching catalog `id` or `record_key`, a `field` (`name`, `title`, or `description`), a `grade` of `0`, `0.5`, or `1`, and `"approved": true`. Only exact-query entries marked approved affect search. Do not copy the app's SQLite database into this folder.
