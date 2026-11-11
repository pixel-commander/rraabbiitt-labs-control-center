useHybridSearch

Owns search request state, explicit votes and message-scroll following.
Delegates draft/submission to the message provider. Saves each submitted user
message through the messages API before calling hybrid search with that ID.

Props: none. handleChange(key, value) changes a feature field;
handleSubmit(text, type, bag) saves and searches the query;
handleClick(data, action) saves an explicit whole-result vote and refreshes
ranking, or returns the current query to the draft for manual rephrasing.
handleReset clears the displayed session, not database history or lessons.
Returns message, state, actions, messagesRef and handleScroll.
The selected model tiles remain demo controls; they do not select the ranker.
Failures display an error and do not substitute preview data.

Style overrides on visual components use the inherited container/action class props, className, theme tokens, or parent CSS. The top-level feature accepts no style props.

Message state retains model label and optional answer text/time for display.
An absent answer shows a Searching activity with Sent status. Successful search
sets the answer and Read status; failure sets failed without an answer. The
activity labels are local display state, not new persisted message rows.


Rephrase selects a record plus original query/message/rank. The next submitted
wording is a new saved message and positive lesson for that selected record.
It does not positively label the original query for a lower-ranked result.
Lesson-save failures retain the text; a search failure after saving is reported
as saved-lesson/search-failed. Cancel clears the selected rephrase target.

