# Rraabbiitt Labs Control Center

This project is a React and Vite dashboard for search and model tools. It includes a World Search interface, a Style Guide, local tools, database setup, and a portable Python ranker package.

All file and folder paths in this document are relative to this README.

Run `npm run dev` for the site, API and Streamable HTTP MCP server together. The root
`rab.world.json`, beside `src`, is THE source of truth for paths, including
the project-relative runtime locations, toolkit registrations and MCP server location.
Keep `path` set to `"."`. Startup resolves the root from this manifest's actual folder.
See `api/mcp/README.txt` for connection and cloud access setup.

The single application database is `db/main/app.sqlite`. Indexed source settings
and skills live in `records` using their existing House IDs. SQLite full-text
indexes cover records, messages, docs, runs and tool-call/usage data. The project
file registers that database; there is no separate active catalog database.

## Architecture

The project uses a self-similar architecture. Components, hooks, tools, and skills use common identity fields, callback patterns, and metadata conventions. Each unit has a defined responsibility. A larger unit composes smaller units through their contracts.

Self-similarity is the design requirement. It does not mean that every unit has the same files or props. Read the contract before you use a unit. Keep shared behavior with one owner. Call that owner instead of making a second implementation.

The parent owns application data, selection, saving, and business decisions. An owner hook manages related interaction state. A display component receives the values and callbacks that it needs. When server connections are added, the server must own database access, file operations, and Python execution.

Read [RULES.txt](RULES.txt) before you change the project. Use the applicable scaffold for a new unit. Keep existing IDs when you move or change files.

## HouseKeys and Contracts

[src/HouseKeys.types.ts](src/HouseKeys.types.ts) defines the shared TypeScript contract. It defines numeric House IDs, numeric timestamps, descriptive fields, location fields, and callback types.

Use a numeric House ID for identity. Use numeric milliseconds for dates at data boundaries. Format a date only for display. A name or title is a label. A path is a location. Neither replaces the ID.

A props bag is the complete set of incoming props. A unit must accept the contract that it passes onward. Add defaults only for values that are absent under that contract. Keep supplied values such as `false`, `0`, and an empty string when they are valid.

Use `HandlerKey` for House callbacks. The callback pattern is:

```ts
(data, type, props)
```

`data` is the payload. `type` identifies the action. `props` is the complete incoming bag. Read the specific type for permitted payloads, action values, and return values. Do not assume that all callbacks accept the same data.

The database schema is a separate contract. A TypeScript field in HouseKeys does not automatically add a database column.

## ID Lookup and Loading

Use the numeric ID to look up a registered unit. Read its current settings to find the implementation and locations. Read its usage skill before you call or compose it.

1. Find the record by its numeric House ID through the available registered lookup service.
2. Read its current settings. Resolve the location under the owning contract.
3. Read its usage skill for inputs, defaults, and callbacks.
4. Load the implementation through its supported entry point.
5. Check the returned data or rendered behavior.

Names can help a person find a candidate. After you identify the candidate, retain its ID as the reference. Do not use a display name or an old path as its identity.

In skill references, use `id` for an entity and `use` for a skill. Supply the numeric ID. Keep names as labels. Keep file inventories in settings.

An ID reference does not load code by itself. A lookup service must resolve the record. The caller must then use the supported entry point. Static React imports still use module paths. If a registered lookup service is unavailable, inspect current local metadata and state that limit.

`rab.project.json` registers source folders and the application database.
`rab.project.json.BAK` is a historical backup. Runtime does not load the backup.

## Skills and How to Use a Unit

[skills/](skills/) holds project-level skills. Usage skills can also be next to the unit that they describe. A skill explains how to use the unit. Settings hold its identity and location metadata.

For a component, read the skill to find its props, defaults, and callbacks. Identify the required inputs. Supply those inputs. Use the specified callback payload and action type. Keep application decisions in the caller that owns them.

For an atom, read the skill to find its visual treatment and supported modifiers. For a setup skill, read the inputs, procedure, and expected result. Component usage skills cover usage only: props, defaults, and callbacks. File inventories belong in settings.

When you change a contract, update its usage skill. When you move an implementation, update its location metadata and module imports. Retain the entity ID and skill ID. A move must not create a second identity for the same unit.

## Components, Hooks, and Atoms

[src/components/](src/components/) holds site components and their related subcomponents. Components own structure. Read the types and usage skill before composition. Compose incoming `className` with the base class. Keep custom component props out of DOM attributes.

[src/hooks/](src/hooks/) holds shared hooks. Component-specific hooks can remain with their component. Put related mutable state in one owner hook. Reuse that owner when another unit needs the same behavior.

[src/atoms/](src/atoms/) holds reusable visual classes. Atoms own skin, including container and action treatments. Markup composes structure with atom classes. Use theme tokens for color, spacing, and radius values.

Use registered `data-grid` topologies and exact area names. Shared grid CSS owns track definitions and shrink behavior. Keep alignment with the owning layout. Do not use `align-self` on grid containers or grid items.

## Themes and Style Guide

The project has dark and light themes. Edit color values in [src/themes/dark/colors.css](src/themes/dark/colors.css) and [src/themes/light/colors.css](src/themes/light/colors.css). Use the Style Guide to inspect tokens, atoms, and component examples.

`--color-main` is the page background. Color slots have matching `-neg` values for contrasting use. Use theme values instead of fixed dark or light colors in components. Use the status tokens for success, warning, error, and muted states. Keep status meaning consistent across themes.

## Search Box

The reusable search input is `MessageBox`. Its House ID is **1794399461744**. Use this ID to resolve its current settings and usage skill.

The component displays a text area, an optional lower-left content area, and a submit button. It collects input. The supplied callback decides what to do with the message.

`handleSubmit` is required. It receives `(trimmedText, "message-box", props)`. Blank text does not submit. Optional `handleChange` receives `(text, "message-box", props)`.

Supply `value` and `handleChange` for controlled input. The caller must update and clear the controlled value. If `value` is absent, the message hook owns the local draft and clears it after the submit callback returns normally.

The default placeholder is `Search your world…`. The default container is `container-outline`. The default submit treatment is `action-filled`. Supply `container_class` and `submit_class` to select other atom classes. `children` fills the lower-left area. `className` adds a root class.

World Search uses the input through its search subcomponent. Submission saves the user message through the message API, then calls the registered hybrid search tool against the current database catalog. The feature hook owns request state. Pinned model assets and the established runtime supply hybrid retrieval and reranking.

## Local Toolkit

[toolkit/](toolkit/) holds local tool copies for this project. The copies keep supported setup operations with the project when it is transferred. Read each tool's current settings and adjacent usage skill before execution.

Use the supported entry point and input contract. Check the returned status and output. Do not infer success from a process exit code alone. Use the owning tool to generate new House IDs. Create or refresh metadata only within the requested scope.

The active hybrid engine is local in `packages/hybrid-search-runtime/`.
Its adapters export indexed records from the registered database and rank them
with the shipped model. The separate `packages/portable-search-ranker/` CLI
is optional and does not power World Search. Retained legacy training adapters
are not an enabled weight-training workflow.

## API Boundary

[api/](api/) contains the live message and search handlers and the MCP server.
`npm run dev` serves these handlers with the UI through Vite middleware.
Message operations are set, get, edit, and delete. Search and feedback use
`/api/search-records`. File-system endpoint folders remain placeholders.

Define request and response contracts before you add an endpoint. Keep database access, disk access, and Python execution on the server. The browser sends requests and receives response data through this boundary.

A search adapter must receive the query, obtain the required catalog, call the selected runtime, and return the agreed response shape. Define persistence and feedback handling before you connect those actions.

## Database

[db/](db/) holds the setup procedure and schema reference. Run `npm run db:setup` from the project root to create the database and missing tables. Setup retains existing rows. It stops if column names do not match the expected layout.

Runtime storage is `db/main/app.sqlite`. The database is intended for records, messages, and document metadata. The tables use standard House record columns and supplied numeric IDs. The message API saves user text in `description`, the role in `type`, and a
numeric timestamp ID supplied on submit. Read its current handler contract
before adding fields.

Setup creates required tables. It does not populate document records. A table's existence does not establish a working persistence connection.

Check Git inclusion before transfer. This project does not ignore `db/main/`.
The database can contain user messages. Keep schema and setup source so a new
installation can create an empty database when live data is not transferred.

## Training Data

[learning/](learning/) separates the baseline shipped with the app from learning saved at this installation. Both branches use the same subject folders and lessons, grades, and saved-models locations. Read [learning/README.txt](learning/README.txt) for their exact contents and write rules.

Keep evaluation data separate from training data. Retain record IDs and the source of judgments so results can be traced to inputs. Use the format required by the selected training entry point. Read the local folder instructions before you add data or start a run.

Keep dependency installations and model downloads in their designated locations. Do not use this folder for npm dependencies. Setup does not start training. Model assets and learning files are not ignored
by this project. Keep them with the transfer, including approved site lessons.

## Setup and Run

Use Node 24 or newer and Python 3.12 or newer. The verified local environment
uses Python 3.14.5. Setup needs package registry access. The optional portable
ranker installer also needs PowerShell 7.

From the project root, install dashboard dependencies and start the UI:

```sh
npm ci
npm run setup
npm run test:hybrid-baseline
npm run dev
```

Use the URL printed by Vite. The dev command serves the UI, API, and MCP
endpoint together. The registered local URL is in `rab.world.json`.

Run `npm run build` to check TypeScript and produce the production UI. Run `npm run preview` to inspect that build locally.

`npm run setup` creates the local `.venv`, installs the hybrid runtime
dependencies, and sets up the database. It does not download models or start
training. The shipped model files must be present. Use `npm run hybrid:setup`
or `npm run db:setup` for one part. `npm run ranker:setup` installs only the
separate optional portable CLI.

The portable ranker source is in [packages/portable-search-ranker/](packages/portable-search-ranker/). Read [RANKER_CONNECTION.txt](RANKER_CONNECTION.txt) for installation, runner settings, transfer instructions, and remaining connection work. Resolve current component locations from settings if older notes contain a previous location.

## Transfer and Verification

Before connecting project data on a new machine, run `npm run test:hybrid-baseline`.
It checks the shipped hybrid model against frozen system/toolkit records and seven
known queries, without an application database or customer lessons. Read
[tests/hybrid-search/README.txt](tests/hybrid-search/README.txt) for dependencies,
fixed expectations, and report locations. It never trains or refreshes fixtures.

Transfer this folder with its source, local tools, contracts, skills, model
assets, and learning files. Keep required database data or create an empty
database with setup. Recreate `node_modules/` and `.venv/` on the destination.
No sibling HQ project is required. Run `npm run audit:portable` after setup.
Temporary files and reports stay in this project's Git-ignored `.tmp/`.

Verify actual output before you call an integration complete. For UI changes, check rendered behavior and applicable themes. For tools and endpoints, check responses and stored results. Run applicable build and contract checks. State which connections remain incomplete.


