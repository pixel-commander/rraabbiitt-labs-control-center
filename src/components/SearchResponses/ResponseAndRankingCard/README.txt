ResponseAndRankingCard

Ranked response with metadata, title, score, and four actions.

Props extend HouseKeys. id is numeric. name is metadata text.
title accepts ReactNode and defaults to name. rank remains accepted for compatibility; the score occupies the left heading position.
score defaults to 0 and displays two decimal places.
action_class defaults to action-outline and styles Rephrase only. The three hand-vote buttons have no action atom, background, or border and use a pointer cursor.
An empty action_class is preserved. className composes with the root class.
data is passed unchanged to optional handleClick(data, type, props).
The callback receives the complete incoming bag. Types are good-vote,
ok-vote, bad-vote, and rephrase. Parent owns votes and other decisions.

The root composes container-side-rail and pad-base. Colors use theme tokens.
Override the rail through --container-side-rail-color on a supplied class.
Override controls with action_class; override structure through className
or external CSS. The parent controls available width.

The SearchResponses demo on /style-guide includes this subcomponent.

