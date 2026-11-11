TopResult
=========

TopResult renders the former SearchResponses article.
Use title, children, data, className and handleClick.
container_class defaults to container-side-rail.
Supply another container class to change the skin.
Supply an empty string to remove the default container class.
The earlier container_aton prop remains a fallback when container_class is absent.
color is an optional rail color override. It has no default value.
Vote callbacks receive data, the vote type, and the complete incoming bag.
Vote types are good-vote, ok-vote and bad-vote.
The component does not use side.
The parent owns data and vote state.
Use theme tokens, className or parent CSS for style overrides.

Rephrase receives (data, rephrase, complete props). The parent owns wording,
selected-result context, and lesson saving. The component performs no training.


Optional score displays two decimal places in a left heading box. Zero is
preserved. Omitting score hides the box. The title remains the result title.

