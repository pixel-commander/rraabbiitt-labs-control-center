new-skill-flow
Creates use.skill.yaml or enhance.skill.yaml from template/skill.yaml.
Required props: name, title, description, path, instructions.
Optional intent defaults to use; file selects the output filename and must match intent. It is not written as a skill field. A supplied owner must include its numeric House ID.
newSkillFlow returns the saved skill record with its own ID. run returns standard ToolReturn; the shared runner owns tracking.
Existing destination files are never overwritten. No indexing or registration is performed.
