FAVORITES

Use GET /api/favorites/get to read saved favorites. Supply optional id to select one.
Use POST /api/favorites/set with JSON {id} to save an indexed record.
Use DELETE /api/favorites/delete?id=ID to remove it. Repeated calls are safe.
The table uses House columns. Each favorite retains the source record ID.
Metadata is copied from records, not trusted from the browser.
Favorites are local bookmarks. They do not change ranking or training data.
