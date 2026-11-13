SearchBar

Search form with caller-owned change and submit handling. Props extend HouseKeys.
handleChange and handleSubmit receive ({ search }, "search-bar", completeIncomingProps).
The input keeps its own native form value; callbacks do not save or fetch anything.
auto_complete defaults to false.
className extends search-bar; input_class extends search-bar__input.
container_class defaults to container-cell container-cell--inset; an empty string removes it.
Override skin through supplied classes, theme tokens or parent CSS.
