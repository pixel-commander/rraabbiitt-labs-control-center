RAB WORLD TOOL COPIES

scaffolds/new-settings-json        Create a settings record.
scaffolds/new-skill-flow           Create a use or enhance skill.
scaffolds/new-world-beacon-json    Create a beacon record.
scaffolds/new-world-project-json   Create a project record.
tools/refresh-settings-json        Refresh one settings file inventory.
tools/refresh-beacon-json          Refresh one beacon.
tools/refresh-project-json         Refresh one project.
runners/refresh-settings-json-paths Refresh settings below a supplied folder.
runners/runner-refresh-world-json  Refresh a supplied settings, beacon,
                                  project, or world scope.

The copy includes templates, the numeric ID generator, and shared runner
execution/tracking helpers. YAML serialization uses the dashboard yaml
dependency. Use Node 24 or newer. Read each entry's settings and usage file
before calling it. Missing source usage files are supplemented locally.

These tools do not depend on the HQ toolkit location. Do not run a world
refresh merely to inspect this package. The dashboard rab.project.json.BAK
stays inactive until explicitly restored.
