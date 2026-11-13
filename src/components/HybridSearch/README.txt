HybridSearch

Built-in search feature with no props. The World Search page renders this component. Its hook owns feature state; the two presentation subcomponents forward to the existing message box and chat bubble without adding DOM wrappers. The existing page styles and ToolCol are reused. No demo folder is included at the user request. Verify the live /world-search route.

Props: none. Callbacks: none accepted. The owner hook saves the user message,
then calls the registered hybrid search API. Request errors are visible.
The main header uses the Style Guide TopResult composition: result title,
description and vote actions. Remaining ranked cards live in ToolCol's scroll.
Explicit votes save whole-result lessons tied to the saved message/query.

Style overrides on visual components use the inherited container/action class props, className, theme tokens, or parent CSS. The top-level feature accepts no style props.

Each saved user message displays a right user bubble. A left model activity
bubble says Searching with Sent status. After a successful search, that status
becomes Read and a new left activity bubble announces a found result (or no
result). The actual result remains in the top panel. These fixed activity
labels are interface state, not generated model answers. Failed searches do
not append a found-result bubble. Only the submitted user row is persisted by
the current message API; activity bubbles are derived local display state.


Top and lower results provide Rephrase. The shared message box displays the
selected target and accepts wording that makes it correct. Explicit submission
saves the new message and lesson before search. See api/search-records/REPHRASE.txt
from the project root for the stored context and supervised evidence behavior.


A skill return displays its returned text directly. The running skill shows
npm run dev; the viewing skill displays the current registered world URL.
Feedback progress is a left model-style bubble derived from local notice state.
It does not create a database message row. Its footer uses Sent/Read only.


DumBot mode: accepts mode="dumbot" in the incoming props bag (default hybrid). Uses /api/search-records/dumbot and the same scroll layout. Select result loads requirements; answers retain contract values in this mounted page. New search clears them. DumBot hides grading actions. className is composed at the feature root.

Rephrase: MessageBox accepts optional handleClick(text, "rephrase", completeProps). When supplied, an outlined Rephrase button appears beside Run. DumBot owns this callback and previews the current draft through its model responder in the chat; no tool executes and the draft is preserved.
