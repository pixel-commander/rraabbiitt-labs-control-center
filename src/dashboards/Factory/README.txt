Factory

The /factory dashboard uses the header-main house grid.
The header contains TabNav with Component Factory selected.
The main region renders the local components/ComponentFactory component.
Factory accepts the ComponentFactory props and forwards them, using className
on the dashboard wrapper.

Save opens a required HouseKeys form with the designer name prefilled.
handleSave(data, "component-runner") generates JSX and CSS strings and invokes
runner-render-factory-composition by stable ID through the local API.
The Type dropdown selects the component, page, or dashboard runner and its configured destination.
The selected runner creates the scaffold. Only its return expression and
imported CSS file are replaced, preserving props, defaults, imports and types.
Editable compositions are stored beside the generated artifact as composition.json.
Subsequent saves update the matching component and composition.

Save path is the required destination artifact folder, not a project root. The Factory route supplies src/components. The server resolves it against its configured projectRoot, passes it as the runner save_path, and writes composition.json beside the generated component. The server plugin receives explicit path, projectRoot and toolkitRoot options; it does not infer HQ or sibling toolkit folders.

Factory saves pass catalog: false through the runner and metadata steps. Saving writes component files and composition.json without refreshing or registering the catalog.
