import type { DesignerProps } from "../../RABDesigner.types";
import { useDesignerTheme } from "../../hooks/useDesignerTheme";
import "./css/designer-theme.css";
import { DesignerColor } from "../DesignerColor/DesignerColor";

export const DesignerTheme = (props: DesignerProps) => {
  const theme = useDesignerTheme(props);
  return (
    <section className="designer-theme">
      <h3>Theme</h3>
      <div ref={theme.root}>
        <p>
          Load the current theme or import token JSON. Changes apply to the
          canvas and save with the composition.
        </p>
        <button className="action-main" onClick={theme.loadCurrent}>
          Load current theme
        </button>
        <button
          type="button"
          className="action-main designer-theme-import"
          onClick={() =>
            theme.root.current
              ?.querySelector<HTMLInputElement>('input[type="file"]')
              ?.click()
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />
          </svg>
          Import theme
        </button>
        <input
          hidden
          type="file"
          aria-label="Theme file"
          accept=".json,application/json"
          onChange={(e) => {
            void theme.importFile(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
        <button className="action-main" onClick={theme.exportTheme}>
          Export theme
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget),
              key = String(values.get("token")),
              value = String(values.get("value"));
            if (theme.change({ ...props.data.theme, [key]: value }))
              e.currentTarget.reset();
          }}
        >
          <label>
            Token name
            <input
              className="container-cell"
              name="token"
              placeholder="--my-accent"
              pattern="--[a-zA-Z][a-zA-Z0-9_-]*"
              required
            />
          </label>
          <label>
            Token value
            <input
              className="container-cell"
              name="value"
              placeholder="Color, size, or CSS value"
              defaultValue={theme.draftColor}
              required
              onChange={(e) => theme.setDraftColor(e.currentTarget.value)}
            />
          </label>
          <DesignerColor
            {...props}
            name={undefined}
            title="New token color"
            value={
              CSS.supports("color", theme.draftColor)
                ? theme.draftColor
                : undefined
            }
            theme={props.data.theme}
            handleChange={(value) => {
              if (value === undefined) return;
              theme.setDraftColor(value);
              const input = theme.root.current?.querySelector<HTMLInputElement>(
                'input[name="value"]',
              );
              if (input) input.value = value;
            }}
          />
          <button className="action-main">Add token</button>
        </form>
        <div role="status">{theme.message}</div>
        {Object.entries(props.data.theme ?? {}).map(([key, value]) => (
          <div key={key} className="designer-theme-token">
            {CSS.supports("color", value) && !/shadow|motion|font/.test(key) ? (
              <div className="designer-theme-color">
                <span>{key}</span>
                <DesignerColor
                  {...props}
                  title={key}
                  value={value}
                  theme={props.data.theme}
                  handleChange={(next) =>
                    theme.change({
                      ...props.data.theme,
                      [key]: next || "transparent",
                    })
                  }
                />
              </div>
            ) : (
              <label>
                {key}
                <input
                  className="container-cell"
                  data-token={key}
                  defaultValue={value}
                  onChange={(e) =>
                    theme.change({
                      ...props.data.theme,
                      [key]: e.currentTarget.value,
                    })
                  }
                />
              </label>
            )}
            <button
              className="action-main"
              aria-label={`Remove ${key}`}
              onClick={() => {
                const next = { ...props.data.theme };
                delete next[key];
                theme.change(next);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
