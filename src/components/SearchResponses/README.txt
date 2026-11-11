SearchResponses
===============

Use result_type to select a component.
  top-result       Renders TopResult with the existing response panel layout.
  search-response  Renders ChatBubble.

Unknown or unsupported types produce a console warning and visible fallback.
The fallback text is: invalid component type {result_type}.

container_class is optional. TopResult defaults it to container-side-rail.
An empty string removes the default skin. container_aton remains a fallback
when container_class is absent. className is added to the base class.

Use title and children as ReactNode values. color is an optional rail override.
Use data and handleClick(data, voteType, props) for feedback.
Vote types are good-vote, bad-vote and ok-vote. The complete bag is passed.

side selects left or right for search-response. The default is left.
Both sides require a numeric date. The timestamp appears next to the title.
Right always shows User. Left defaults to Model.
user_class and model_class default to container-alt on the middle row.
Footer is an optional ReactNode below the middle row.
TopResult does not accept side.

The parent owns data and votes. The component performs no I/O.
Use theme tokens, className or parent CSS for style overrides.
