import { useDesignerComposition } from "../../hooks/useDesignerComposition";
import { useRef } from "react";
import type { DesignerProps } from "../../RABDesigner.types";
import "./css/designer-composition.css";

export const DesignerComposition = (props: DesignerProps) => {
  const { site, code } = useDesignerComposition(props);
  const status = useRef<HTMLOutputElement>(null);
  const highlight = (text: string) =>
    text
      .split(/("(?:[^"\\]|\\.)*"|'[^']*'|\b\d+(?:\.\d+)?\b|[<>{}=])/g)
      .map((part, i) => (
        <span
          key={i}
          className={
            /^['"]/.test(part)
              ? "container-canvas-code-string"
              : /^\d/.test(part)
                ? "container-canvas-code-number"
                : /^[<>{}=]$/.test(part)
                  ? "container-canvas-code-punctuation"
                  : undefined
          }
        >
          {part}
        </span>
      ));
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (status.current) status.current.value = "Copied";
    } catch {
      if (status.current)
        status.current.value =
          "Clipboard unavailable — select and copy the code.";
    }
  };
  return (
    <section
      className="designer-composition container-canvas-rule"
      aria-label="Composition code"
    >
      <h3>Composition</h3>
      <header>
        <span>
          {props.data.mode === "html"
            ? "HTML"
            : props.data.mode === "dev"
              ? "Component (JSX)"
              : "Layout (absolute JSX)"}
        </span>
        <button
          className="action-canvas-tool"
          onClick={() =>
            void copy(
              props.data.mode === "dev" && site ? site.component : code.jsx,
            )
          }
          aria-label={
            props.data.mode === "html"
              ? "Copy HTML"
              : props.data.mode === "dev"
                ? "Copy component"
                : "Copy composition JSX"
          }
        >
          Copy
        </button>
      </header>
      <pre className="container-cell container-canvas-code">
        <code>{highlight(code.jsx)}</code>
      </pre>
      <details>
        <summary>CSS + theme</summary>
        <button
          className="action-canvas-tool"
          onClick={() => void copy(code.css)}
        >
          Copy CSS
        </button>
        <pre className="container-cell container-canvas-code">
          <code>{highlight(code.css)}</code>
        </pre>
      </details>
      <output ref={status} aria-live="polite" />
    </section>
  );
};
