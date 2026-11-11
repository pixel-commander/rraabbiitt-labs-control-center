import type { CodeEditAndViewProps } from "./CodeEditAndView.types";
import { useCodeEditAndView } from "./hooks/useCodeEditAndView/useCodeEditAndView";
import { CodeViewer } from "./CodeViewer/CodeViewer";
import "./css/code-edit-and-view.css";

export const CodeEditAndView = (props: CodeEditAndViewProps) => {
  const editor = useCodeEditAndView(props);
  return (
    <section
      data-grid="shell"
      className={[
        "code-edit-and-view",
        props.container_class ?? "",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${editor.file} editor`}
      aria-busy={editor.pending}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          if (props.handleSave) void editor.save();
        }
      }}
    >
      <header
        data-area="header"
        className="code-edit-and-view__toolbar"
        data-cols="2"
      >
        <div>
          <strong>{editor.file}</strong>{" "}
          <span>{editor.dirty ? "Unsaved" : "Unchanged"}</span>
        </div>
        <div className="code-edit-and-view__actions" data-cols="5">
          <button
            type="button"
            aria-pressed={editor.mode === "view"}
            onClick={() => editor.setMode("view")}
          >
            View
          </button>
          <button
            type="button"
            aria-pressed={editor.mode === "edit"}
            disabled={props.disabled}
            onClick={() => editor.setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            disabled={editor.pending || props.disabled}
            onClick={() => void editor.validate()}
          >
            Check
          </button>
          <button
            type="button"
            disabled={!editor.dirty || editor.pending || props.disabled}
            onClick={editor.revert}
          >
            Revert
          </button>
          <button
            type="button"
            disabled={
              !props.handleSave ||
              !editor.dirty ||
              editor.pending ||
              props.disabled
            }
            onClick={() => void editor.save()}
          >
            {editor.pending ? "Checking..." : "Save"}
          </button>
        </div>
      </header>
      <div data-area="main" className="code-edit-and-view__content">
        <CodeViewer
          code={editor.draft}
          language={editor.language}
          mode={editor.mode}
          showLineNumbers={props.showLineNumbers}
          showMinimap={props.showMinimap}
          startLine={props.startLine}
          tabSize={props.tabSize}
          disabled={props.disabled || editor.pending}
          diagnostics={editor.diagnostics}
          activeLine={editor.selectedLine}
          handleChange={editor.change}
          handleClick={(data, type) => {
            if (data && type === "line-click") editor.navigate(data.line);
          }}
        />
      </div>
      <footer
        data-area="footer"
        className="code-edit-and-view__status"
        aria-live="polite"
      >
        {editor.draft.split("\n").length} lines | {editor.language} |{" "}
        {editor.mode}
        {editor.message && <span> | {editor.message}</span>}
        {!props.handleSave && <span> | No save handler connected</span>}
        {editor.error && (
          <p role="alert" className="code-edit-and-view__error">
            {editor.error}
          </p>
        )}
        {editor.diagnostics.length > 0 && (
          <ul
            className="code-edit-and-view__diagnostics"
            aria-label="Code diagnostics"
          >
            {editor.diagnostics.map((item, index) => (
              <li key={index} data-severity={item.severity}>
                <button
                  type="button"
                  onClick={() =>
                    editor.navigate(
                      (props.startLine ?? 1) + (item.line ?? 1) - 1,
                    )
                  }
                >
                  {item.line
                    ? `Line ${item.line}${item.column ? `:${item.column}` : ""}: `
                    : ""}
                  {item.message}
                </button>
              </li>
            ))}
          </ul>
        )}
        {props.children}
      </footer>
    </section>
  );
};
