FILE SYSTEM API

read-file/   Endpoint folder for reading text files.
save-file/   Endpoint folder for saving edited text.
list-files/  Endpoint folder for listing available files.

These folders do not contain HTTP handlers yet.
CodeEditAndView calls handleSave with the edited code and file metadata.
The parent must send that request to the server. Keep disk access on the
server and restrict requests to the configured file root. Resolve and
check paths, including symbolic links, before reading or writing.
Define the file root, request contract and overwrite behavior before
connecting Save. The Style Guide demo uses memory only.
