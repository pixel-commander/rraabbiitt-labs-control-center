# runner-refresh-discovery

Refresh discovery for one or several root folders through the shared tracked execution owner.

Supply root or House paths with absolute path values. The runner calls refresh-discovery-index for each root through the shared runTools owner. Returns a flat RunnerReturn with child timing and errors.

Source files are not changed. Discovery refresh and preset saving update only their project database tables. Shared execution owns timings and run history.
