SKILLS

Store project-level skills in this folder.
Setup skills describe setup inputs, actions, and expected results.
Component use skills stay beside their component and describe only props,
defaults, and callbacks. Atom use skills describe the atom and modifiers.
Keep file inventories in rab.settings.json, not in usage instructions.
Refer to an owner, implementation, context, or source by numeric House ID.
Use id for an entity or use for a skill. Names are labels, not lookup keys.

Use toolkit/rab-world/scaffolds/new-skill-flow to create a skill.
Supply name, title, description, path, and instructions. The tool creates
use.skill.yaml by default. An existing skill is not replaced automatically.

This folder is registered by rab.beacon.json, not a root settings record.
The beacon registers source discovery within this folder. New skills keep
their own numeric IDs and usage instructions. Refresh the project catalog
after adding or removing skill files. An empty folder does not supply a skill.


IMPORTED SOURCE GUIDANCE

The following guidance is retained from the imported skills folder.
HYBRIDSEARCHMODEL SKILLS

Skills explain how to use this project. They do not authorize startup, indexing, training, or tool execution.

project/: app, package, skill, and tooling guides.
cli/: index maintenance.
toolkits/: shared tool and runner guidance.
Implementation skills stay beside their tools and components.

Resolve paths from the project root. Read context parents first. Check their IDs.
Preserve IDs when copying or editing skills. Use project/adding-skills/use.skill.yaml for changes.
The root rab.project.json registers source folders. The database stores skills in its skill table.
Run npm run index after a requested skill change to make it searchable.
