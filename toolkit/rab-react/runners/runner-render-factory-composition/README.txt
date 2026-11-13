runner-render-factory-composition

Creates or updates a React component, subcomponent, page, or dashboard from generated JSX and CSS strings.

Required inputs are type (component, subcomponent, page, or dashboard), name, path (project root), code and css.
Other component runner HouseKeys pass through. code is the returned JSX expression,
not a complete TSX module. The existing scaffold props, defaults, imports and types
remain intact. Root className is composed with the scaffold's className binding.
The CSS file comes from the component's actual stylesheet import.

The selected artifact runner is resolved by stable House ID from the toolkit catalog.
A supplied id verifies the matching existing component.
Existing files return an overwrite-confirmation receipt without changes.
Run again with overwrite true to replace only the return expression and CSS.
Unsupported types and invalid JSX fail before creating a component.
Writes stage both files and restore the previous TSX if committing CSS fails.
The return value is the shared flat RunnerReturn with creation and write receipts.
The Factory dashboard saves composition.json separately as its editable source.
