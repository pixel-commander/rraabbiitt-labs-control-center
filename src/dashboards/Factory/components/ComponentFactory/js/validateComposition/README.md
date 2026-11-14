# Validate a composition

Call `validateComposition(composition)` with a node, a version 2 document, or a JSON string.
The function returns `error_count`, `errors`, and `summary`.
`errors` contains all detected errors as `{ path, message }` records.
An `error_count` of zero means validation passed.
The function does not change the input or assign node IDs.

```ts
const result = validateComposition(composition);
// { error_count: 0, errors: [], summary: { nodes: 3, tags: { div: 3 }, ... } }
```

Factory's `readComposition` uses these same rules after legacy conversion.
Use `readComposition` to import old formats and assign missing IDs.
This checks document structure. It does not verify atom availability or rendered appearance.

## Summary

- `nodes`: Number of node objects visited.
- `tags`: Number of uses for each tag.
- `classes`: Number of nodes that use each name or atom class.
- `css`: Number of nodes that supply each CSS property.
- `grids`: Number of uses for each `grid_type` value.
- `display`: Number of uses for each explicit `css.display` value.

Repeated class tokens on one node count once.
The CSS count includes the composition's `padding` and `gap` fields.
These fields generate CSS declarations. They do not imply `pad` or `gap` classes.
Statistics include invalid nodes where traversal is possible.
