Factory

The /factory dashboard uses the header-main house grid.
The header contains TabNav with Component Factory selected.
The main region renders the local components/ComponentFactory component.
Factory accepts the ComponentFactory props and forwards them, using className
on the dashboard wrapper.

Save opens a required HouseKeys form with the designer name prefilled.
handleSave(data, "component-runner") generates JSX and CSS strings and invokes
runner-render-factory-composition by stable ID through the local API.
The component runner creates the scaffold. Only its return expression and
imported CSS file are replaced, preserving props, defaults, imports and types.
Editable compositions are stored at HQ/src/user/components/Name/composition.json.
Subsequent saves update the matching component and composition.
