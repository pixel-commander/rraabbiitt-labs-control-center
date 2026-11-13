DumBot
URL: /dumbot. Reuses HybridSearch mode="dumbot". No page props or callbacks.
Page CSS owns the 40/30/30 rabbit, chat and results columns; below 900px they stack.
Ranks database records using word/pair evidence and slots. No grading controls.
The page-owned db-pairs.adapter.ts reads the database on the server; the model takes data.
The top result's registered owner supplies its contract. Explicit values fill fields;
remaining required fields are asked one at a time. An unusable contract is reported.
settings.json maps component/api/page/dashboard/root to relative paths. Supplied paths win.
Project-root runners receive root plus save_path. Execution resolves path against the project.
A complete contract shows the selected tool ID and arguments for yes/no confirmation.
Yes consumes a server-owned proposal and invokes the registered dispatcher; no cancels.
Expired or reused confirmations cannot execute. Tool failures are reported as failures.
Success uses returned action/type/name/path information in the chat reply. Full return
includes execution receipts. New search clears the page's current contract.
