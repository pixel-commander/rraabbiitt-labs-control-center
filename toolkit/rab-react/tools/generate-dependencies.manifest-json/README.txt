generate-dependencies.manifest-json

Supply path for one component folder or paths: [{ path }] for several. Both are combined when supplied. Relative input paths resolve from the process working directory.
Recursively inspect JS/TS/JSX/TSX and CSS in each folder, excluding demo, tests, __tests__, node_modules, dist and .git. Symlink directories are not followed.
List only literal ../ imports that resolve outside the supplied folder. Include type imports, side-effect imports, re-exports, literal dynamic imports and quoted CSS @import. Ignore internal imports, package names, aliases, require calls, computed imports and implicit global styles.
Overwrite dependencies.manifest.json in every supplied folder, including an empty paths array when there are no outward imports. No source files, settings, indexes or packages are changed by this tool.
Each paths entry has name (original import), path (target relative to the component root), type: import, and file (importing source relative to the component root). Extensionless targets remain extensionless; this is an import inventory, not a file resolver or package builder. Repeated imports are retained. No dependency traversal or deduplication is performed.

Example:
{ "paths": [{ "path": "C:/rraabbiitt-react-components/src/components/Calendar" }, { "path": "C:/rraabbiitt-react-components/src/components/NetworkGraph" }] }
