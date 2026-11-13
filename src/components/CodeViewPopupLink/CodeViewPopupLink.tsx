import type { CodeViewPopupLinkProps } from "./CodeViewPopupLink.types";
import { createPortal } from "react-dom";
import { useCodeViewPopupLink } from "./hooks/useCodeViewPopupLink/useCodeViewPopupLink";
import { FloatWindow } from "../FloatWindow/FloatWindow";
import { CodeEditAndView } from "../CodeEditAndView/CodeEditAndView";
import "./css/code-view-popup-link.css";
import "../FolderTree/TreeItem/css/tree-item.css";
export const CodeViewPopupLink = (props: CodeViewPopupLinkProps) => {
  const popup = useCodeViewPopupLink(props);
  const icon =
    props.Icon !== undefined ? (
      props.Icon
    ) : (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        {props.type === "world" ? (
          <>
            <circle cx="10" cy="10" r="8" />
            <ellipse cx="10" cy="10" rx="3.5" ry="8" />
            <path d="M2 10h16M4 5h12M4 15h12" />
          </>
        ) : props.type === "beacon" ? (
          <>
            <path d="m7 5 8 8-4 4-8-8zM12 2l6 6-3 3-6-6zM2 12l6 6-3 1-4-4zM12 8l4-4M13 2a5 5 0 0 1 5 5" />
          </>
        ) : props.type === "settings" ? (
          <path d="M1 10h4l3-7 4 14 3-7h4" />
        ) : (
          <>
            <path d="M5 2.5h6l4 4v11H5z" />
            <path d="M11 2.5v4h4" />
          </>
        )}
      </svg>
    );
  return (
    <>
      {(props.showLink ?? true) && (
        <button
          ref={popup.trigger}
          type="button"
          data-grid="side-left"
          className={[
            "code-view-popup-link",
            "folder-tree__row",
            props.className,
            popup.open ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={props.disabled}
          aria-expanded={popup.open}
          onClick={popup.show}
        >
          <span
            data-area="side"
            className="tree-item__icons"
            aria-hidden="true"
          >
            {icon}
          </span>
          <span data-area="main" className="tree-item__name">
            {props.children ??
              props.title ??
              props.file ??
              props.name ??
              "View code"}
          </span>
        </button>
      )}
      {popup.open && createPortal(
        <FloatWindow
          title={props.title ?? props.file}
          rect={popup.rect}
          className={["code-view-popup-link__window", props.window_class]
            .filter(Boolean)
            .join(" ")}
          handleChange={popup.move}
          handleClose={popup.close}
        >
          {popup.pending ? (
            <p role="status">Loading file...</p>
          ) : popup.error ? (
            <p role="alert">{popup.error}</p>
          ) : (
            <CodeEditAndView
              {...props}
              key={JSON.stringify([props.path, props.file])}
              code={popup.code}
              children={undefined}
              className={undefined}
              initialMode={props.initialMode ?? "view"}
              handleChange={(data, type) =>
                props.handleChange?.(data, type, props)
              }
              handleValidate={
                props.handleValidate
                  ? (data, type) => props.handleValidate!(data, type, props)
                  : undefined
              }
              handleSave={
                props.handleSave
                  ? (data, type) => props.handleSave!(data, type, props)
                  : undefined
              }
            />
          )}
        </FloatWindow>, document.body
      )}
    </>
  );
};
