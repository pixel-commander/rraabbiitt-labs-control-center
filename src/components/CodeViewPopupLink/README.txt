CodeViewPopupLink
=================
Button styled as a file link opens CodeEditAndView inside FloatWindow.
path is the containing folder; file is the filename. No drive paths are embedded.
Icon supplies optional React content and overrides presets, including explicit null.
type: world = globe, beacon = satellite, settings = pulse; other values use file. children/title/file/name determine the label.
Accepts editor props: code, language, initialMode, showLineNumbers, showMinimap,
startLine, tabSize, disabled, container_class, handleChange and handleValidate.
Defaults to view mode. With no handleLoad, displays supplied code (or empty text).

handleLoad({path,file}, "load-code", props) returns code or Promise<string>.
handleSave(codeFile, "save-code", props) owns persistence.
handleClick(location, "open", props) and handleCancel(undefined, "close", props)
receive the complete incoming bag, as do change and validation callbacks.
Load errors appear inside the popup. Save failures remain in the editor.
open controls visibility when supplied; parent must update it in callbacks.
showLink=false supports external triggers such as FolderTree.
rect sets initial geometry; the owner hook handles subsequent move/resize.
className styles the link, window_class styles FloatWindow, container_class
styles the editor. Base classes remain composed. Parent CSS and theme tokens
can override styles. Caller supplies a positioned, bounded parent.

Demo: /style-guide/components/code-view-popup-link
Opens this component's own source through the development file API.
Caller uses revision-checked saving. No production file backend is included.
