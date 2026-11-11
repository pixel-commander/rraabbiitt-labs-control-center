RAB React

Purpose

RAB React creates React project starters and common UI structures that follow
the house conventions. Its generators render checked templates, write a new
item into an existing project or create a new project, and return the saved
settings record together with a receipt describing what was created.

Choose a workflow

- Start a project with `runner-new-react-project-kit`. It can use an existing
  parent folder, or a project's registered projects destination. The generated
  starter includes a Vite and React setup, home and style-guide views, house
  settings, shared grid definitions, and example atoms. It does not seed a
  component library or install packages.
- Add a reusable component with `runner-new-component`. The starter includes
  implementation and type files, component styles, a hook, a demo, and starter
  documentation and settings. Its optional grid must be in the shared grid
  catalog. The optional class string is emitted directly; there is no class
  resolver.
- Add a structural child with `runner-new-subcomponent`. Give it the existing
  parent component as its destination. It creates a smaller component starter
  with types and styles, and can optionally emit the source as text for testing.
- Add a page with `runner-new-page`. It provides a page component, styles, hook,
  and content starter. A supplied content value is the default; children take
  precedence when the page is used.
- Add a dashboard with `runner-new-dashboard`. The current template is a
  self-contained header-and-main layout. It accepts a title and initial main
  content, and uses the host project's grid styling.
- Add navigation with `new-react-navigation`. Supply a nonempty list of unique
  identifiers, labels, and destinations. The generated navigation is accessible
  and may use a canonical grid and a class string. This generator is called
  directly rather than through a project-destination runner.
- Add a style atom with `runner-new-atom`, choosing `action`, `container`,
  `effect`, or `grid`. Action, container, and effect atoms accept CSS
  declarations that use the project's tokens. A grid atom is generated from one
  of the included grid examples. These generators create styles and a demo with
  settings that identify the atom category.
- Record component imports that cross the component boundary with
  `generate-dependencies.manifest-json`. Give it one component or several. It
  reports literal relative imports that point outside each supplied component,
  including type, dynamic, re-export, side-effect, and CSS imports. It skips
  demos, tests, build output, dependencies, and version-control folders. The
  report is an import inventory; it does not resolve modules, traverse
  dependencies, deduplicate entries, or build a package.

Using the project runners

For a component, subcomponent, page, dashboard, or atom, provide the existing
project root and a name. The runner reads the project's `rab.project.json`
settings and selects the registered category destination. An explicit
project-relative destination can override that choice; a subcomponent needs
its parent component destination. Atom creation also needs the atom category.
For a new project, provide a parent folder and project name; an explicit
destination can be supplied, otherwise the runner uses the registered projects
category when available and falls back to the parent folder.

Runners normalize component, subcomponent, page, and dashboard names to
PascalCase. Project and atom names use lowercase kebab-case. Direct scaffold
functions take one settings object containing a name and destination, along
with the optional values supported by that generator. Read each tool's current
settings for its exact inputs. Component names and page names accept ordinary
text styles and are normalized; atom names must be kebab-case. Navigation rows
must have distinct IDs and destinations. The project name is normalized to a
folder-safe kebab-case form.

Project settings matter: normal scaffold publishing needs a project settings
record above the destination. The project runner reads the root settings before
choosing a category; malformed existing settings are errors. Keep each
category registration unambiguous: the runner selects the first matching
entry. A missing required category or an existing target causes the operation
to fail instead of silently choosing another location or replacing content.
Runner destination overrides are resolved relative to the project root, but
the current runner does not enforce that they remain inside the project; keep
overrides within the project.

Results and limits

Successful runners return the generated settings record and a receipt listing
created files. The receipt is for the caller to use in later work; generated
settings do not become a file inventory. The scaffolds refuse to replace an
existing item and report failures as errors. A failure during writing can leave
partial output, so inspect the destination before retrying.

Scaffolding is deliberately limited to generating files and metadata. It does
not install packages, wire generated source into application imports, update a
database, launch the app, scan or register tools, or automatically create a
chain of related components. Review the generated starter, connect it to the
application, and verify it in the host project.
