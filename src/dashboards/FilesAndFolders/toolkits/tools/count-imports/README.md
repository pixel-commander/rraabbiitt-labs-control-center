# count-imports

Scan source imports and return file locations, counts and reverse references using House summary and paths.

Supply root and optional path, name, type and db. db true reads the saved discovery inventory; source parsing still reads the selected files. Missing path means root. Counts use response.summary.count and total; locations use response.paths. response.body contains JSON details, errors and state. Orphan results are candidates and are suppressed when evidence is incomplete. Use save_path and optional save_file for explicit JSON/text reports; existing report files are not overwritten.

Source files are not changed. Discovery refresh and preset saving update only their project database tables. Shared execution owns timings and run history.
