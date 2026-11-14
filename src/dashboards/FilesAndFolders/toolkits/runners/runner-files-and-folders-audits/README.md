# runner-files-and-folders-audits

Run selected filesystem audits with optional discovery refresh and preserve each tracked result.

Supply root. Optional refresh true saves a fresh discovery inventory first. db defaults true for the audits. Optional checks selects count-imports, count-file-types and list-orphaned-files. A failed or incomplete refresh prevents subsequent audits from using stale inventory. Returns flat RunnerReturn; inspect child errors even when execution completed.

Source files are not changed. Discovery refresh and preset saving update only their project database tables. Shared execution owns timings and run history.
