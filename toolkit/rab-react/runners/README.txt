React creation runners

All runners use shared ToolsProps and the existing run-tools execution owner.
path is the caller project root, not the scaffold destination. The runner reads
rab.project.json paths and finds the type:path record by its category tag or
name, for example components folder or tags containing components.

runner-new-component -> components
runner-new-subcomponent -> components plus required save_path for the existing parent
runner-new-page -> pages
runner-new-dashboard -> dashboards
runner-new-atom -> required type container/action/effect/grid -> containers/actions/effects/grids
runner-new-react-project-kit -> projects, or explicit save_path if no projects category exists

name is required. Component, subcomponent, page and dashboard inputs accept any
text style and are normalized to PascalCase for their output folders and files.
Project and atom names remain kebab-case. save_path is an explicit project-relative
parent override; it must remain inside the caller project. Subcomponent parents
must be registered components and already have a component settings record.
Duplicate categories, missing paths, escaped paths and existing targets fail.
Optional scaffold values are forwarded using the shared bag, preserving false
and empty strings. No per-runner input types, nested trackers or automatic chains.

Each returned tool response contains the generated settings HouseKeys, path,
file: rab.settings.json, and paths listing every created file, including nested
settings. Inventory entries use path for their folder and file for their basename.
Return locations are relative to the caller root. A new project's saved metadata
is relative to that new project. Inventories are returned, not written into each
settings file. The project root still stores its registered category paths.

Scaffold helpers share publishing, template rendering and a process-local
monotonic numeric ID allocator. ID allocation is not coordinated across processes.
No package installation, source import wiring or database indexing is automatic.
