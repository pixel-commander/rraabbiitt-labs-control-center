import { isHtml, resolveElement } from "../../js/htmlModel";
import { DesignerHtmlProperties } from "../DesignerHtmlProperties/DesignerHtmlProperties";
import type { FormEvent } from "react";
import { useDesignerToolbar } from "../../hooks/useDesignerToolbar";
import { locate, newElement, updateNodes } from "../../js/document";
import type { DesignerElement, DesignerProps } from "../../RABDesigner.types";
import "./css/designer-inspector.css";
import {
  appearanceGroups,
  appearanceStates,
  validCSSValue,
} from "../../js/appearance";
import { useDesignerAppearance } from "../../hooks/useDesignerAppearance";
import { splitShadows } from "../../js/shadows";
import { DesignerComposition } from "../DesignerComposition/DesignerComposition";
import { DesignerTheme } from "../DesignerTheme/DesignerTheme";
import { DesignerColor } from "../DesignerColor/DesignerColor";
import { DesignerShadow } from "../DesignerShadow/DesignerShadow";
import { parseBorder } from "../../js/border";
export const DesignerInspector = (props: DesignerProps) => {
  const found = locate(props.data.children, props.selected)?.node;
  const selected = found ? resolveElement(props.data, found) : undefined;
  const { editor, root, handleTab } = useDesignerToolbar(
    selected,
    props.previewState,
  );
  const appearanceEditor = useDesignerAppearance(selected, props.previewState);
  const changeAppearance = (
    fields: Record<string, string | undefined>,
    state = props.previewState,
  ) => {
    if (!selected) return;
    props.handleChange(
      {
        ...props.data,
        children: updateNodes(props.data.children, selected.id, {
          appearance: {
            ...selected.appearance,
            [state]: { ...selected.appearance?.[state], ...fields },
          },
        }),
      },
      "change",
      { ...props },
    );
  };
  const shadows = splitShadows(
    selected?.appearance?.[props.previewState]?.["box-shadow"] ?? "",
  );
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !event.currentTarget.checkValidity()) return;
    const values = new FormData(event.currentTarget);
    const target = event.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      )
    )
      return;
    const stateFields: Record<string, string> = {
      borderStyle: "border-style",
      borderWidth: "border-width",
      borderRadius: "border-radius",
      opacity: "opacity",
      boxShadow: "box-shadow",
    };
    if (props.previewState !== "normal" && stateFields[target.name]) {
      const value =
        target.name === "opacity"
          ? String(Number(target.value) / 100)
          : target.name === "boxShadow"
            ? target.value === "none"
              ? "none"
              : `var(--effect-${target.value})`
            : ["borderWidth", "borderRadius"].includes(target.name)
              ? `${target.value}px`
              : target.value;
      changeAppearance({ [stateFields[target.name]]: value });
      return;
    }
    const patch: Partial<DesignerElement> = {
      title: String(values.get("title")),
      width: Number(values.get("width")),
      height: Number(values.get("height")),
      content: String(values.get("content")),
      fontSize: Number(values.get("fontSize")),
      fontWeight: Number(
        values.get("fontWeight"),
      ) as DesignerElement["fontWeight"],
      surface: String(values.get("surface")) as DesignerElement["surface"],
      color: String(values.get("color")) as DesignerElement["color"],
    };
    const layout = String(values.get("grid"));
    patch.grid =
      layout === "free" ? undefined : (layout as DesignerElement["grid"]);
    patch.cols = Number(values.get("tracks"));
    patch.rows = patch.cols;
    for (const key of [
      "gap",
      "padding",
      "borderWidth",
      "borderRadius",
    ] as const) {
      const value = String(values.get(key) ?? "");
      patch[key] = value === "" ? undefined : Number(value);
    }
    for (const key of ["backgroundColor", "borderColor"] as const)
      patch[key] = String(values.get(key) ?? "").trim() || undefined;
    patch.borderStyle = String(
      values.get("borderStyle"),
    ) as DesignerElement["borderStyle"];
    patch.boxShadow = String(
      values.get("boxShadow"),
    ) as DesignerElement["boxShadow"];
    patch.opacity = Number(values.get("opacity")) / 100;
    const keys =
      target.name === "tracks"
        ? ["cols", "rows"]
        : target.name === "grid"
          ? ["grid"]
          : [target.name];
    const changed = Object.fromEntries(
      keys.map((key) => [key, patch[key as keyof DesignerElement]]),
    );
    if (stateFields[target.name])
      changed.appearance = {
        ...selected.appearance,
        normal: {
          ...selected.appearance?.normal,
          [stateFields[target.name]]: undefined,
        },
      };
    props.handleChange(
      {
        ...props.data,
        children: updateNodes(props.data.children, selected.id, changed),
      },
      "change",
      { ...props },
    );
  };
  return (
    <aside
      ref={root}
      data-grid="shell"
      className="designer-inspector container-canvas-panel"
      aria-label="Object inspector"
    >
      <div data-area="header">
        <header className="designer-panel-heading">
          <h2>{selected?.title ?? "Properties"}</h2>
          <small className="container-cell-content-muted">
            {selected
              ? `Composition / ${selected.title}`
              : "Select an object to edit"}
          </small>
        </header>
        <div
          role="tablist"
          aria-label="Inspector sections"
          className="designer-panel-tabs container-canvas-rule"
        >
          {["properties", "appearance", "theme"].map((tab, index) => (
            <button
              key={tab}
              id={`designer-tab-${tab}`}
              role="tab"
              data-tab={tab}
              aria-controls={`designer-panel-${tab}`}
              aria-selected={index === 0}
              tabIndex={index === 0 ? 0 : -1}
              className={`action-nav-alt ${index === 0 ? "is-selected" : ""}`}
              onClick={() => handleTab({ value: tab }, "tab", { ...props })}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const tabs = Array.from(
                    e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]',
                    ),
                  );
                  tabs[(index + (e.key === "ArrowRight" ? 1 : 2)) % 3].click();
                  tabs[(index + (e.key === "ArrowRight" ? 1 : 2)) % 3].focus();
                }
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div data-area="main" className="scroll-y">
        {selected && isHtml(props.data) && (
          <div
            id="designer-panel-properties"
            role="tabpanel"
            aria-labelledby="designer-tab-properties"
            data-panel="properties"
          >
            <DesignerHtmlProperties {...props} node={selected} />
          </div>
        )}
        {selected && (
          <form
            key={selected.id}
            ref={editor}
            onChange={apply}
            onSubmit={(event) => event.preventDefault()}
            className="designer-properties"
            data-panel={
              isHtml(props.data) ? "appearance" : "properties appearance"
            }
            data-canvas-controls
            aria-label="Selected object properties"
          >
            {!isHtml(props.data) && (
              <div
                id="designer-panel-properties"
                role="tabpanel"
                aria-labelledby="designer-tab-properties"
                data-panel="properties"
              >
                <h3>Layout</h3>
                <label>
                  Name
                  <input
                    className="container-cell"
                    name="title"
                    defaultValue={selected.title}
                    maxLength={200}
                  />
                </label>
                <label>
                  W
                  <input
                    className="container-cell"
                    name="width"
                    type="number"
                    min="8"
                    max="10000"
                    required
                    defaultValue={Math.round(selected.width)}
                  />
                </label>
                <label>
                  H
                  <input
                    className="container-cell"
                    name="height"
                    type="number"
                    min="8"
                    max="10000"
                    required
                    defaultValue={Math.round(selected.height)}
                  />
                </label>
                <label>
                  Layout
                  <select
                    className="container-cell"
                    name="grid"
                    defaultValue={selected.grid ?? "free"}
                  >
                    <option value="free">Freeform</option>
                    <option value="columns">Columns</option>
                    <option value="rows">Rows</option>
                  </select>
                </label>
                <label>
                  Tracks
                  <input
                    className="container-cell"
                    name="tracks"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue={selected.cols ?? selected.rows ?? 2}
                  />
                </label>
                <label>
                  Grid gap
                  <input
                    className="container-cell"
                    name="gap"
                    type="number"
                    min="0"
                    max="1000"
                    placeholder="Theme default"
                    defaultValue={selected.gap ?? ""}
                  />
                </label>
                <label>
                  Grid padding
                  <input
                    className="container-cell"
                    name="padding"
                    type="number"
                    min="0"
                    max="1000"
                    placeholder="0"
                    defaultValue={selected.padding ?? ""}
                  />
                </label>
                <h3>Content</h3>
                <label>
                  Text
                  <input
                    className="container-cell"
                    name="content"
                    defaultValue={selected.content}
                    maxLength={5000}
                  />
                </label>
                <label>
                  Size
                  <input
                    className="container-cell"
                    name="fontSize"
                    type="number"
                    min="8"
                    max="120"
                    defaultValue={selected.fontSize}
                  />
                </label>
                <label>
                  Weight
                  <select
                    className="container-cell"
                    name="fontWeight"
                    defaultValue={selected.fontWeight ?? 400}
                  >
                    {[400, 500, 600, 700].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div
              id="designer-panel-appearance"
              role="tabpanel"
              aria-labelledby="designer-tab-appearance"
              data-panel="appearance"
              hidden
            >
              <h3>Appearance</h3>
              <label>
                State
                <select
                  className="container-cell"
                  value={props.previewState}
                  onChange={(e) => {
                    e.stopPropagation();
                    props.handleAction(
                      { value: e.currentTarget.value },
                      "state",
                      { ...props },
                    );
                  }}
                  aria-label="Preview state"
                >
                  {appearanceStates.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </label>
              <label>
                Background
                <select
                  className="container-cell"
                  name="surface"
                  defaultValue={selected.surface}
                >
                  {["main", "inset", "float", "transparent"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select
                  className="container-cell"
                  name="color"
                  defaultValue={selected.color}
                >
                  {["default", "muted", "accent", "secondary", "success"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
              <div className="designer-color-row">
                <span>Background color</span>
                <DesignerColor
                  {...props}
                  title="Background"
                  name="backgroundColor"
                  value={
                    selected.appearance?.[props.previewState]?.[
                      "background-color"
                    ] ?? selected.backgroundColor
                  }
                  theme={props.data.theme}
                  handleChange={(value) =>
                    changeAppearance({ "background-color": value || undefined })
                  }
                />
              </div>
              <div className="designer-color-row">
                <span>Text color</span>
                <DesignerColor
                  {...props}
                  title="Text"
                  value={selected.appearance?.[props.previewState]?.color}
                  theme={props.data.theme}
                  handleChange={(value) =>
                    changeAppearance({ color: value || undefined })
                  }
                />
              </div>
              <label>
                Border style
                <select
                  className="container-cell"
                  name="borderStyle"
                  defaultValue={selected.borderStyle ?? "solid"}
                >
                  {["none", "solid", "dashed", "dotted", "double"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Border width
                <input
                  className="container-cell"
                  name="borderWidth"
                  type="number"
                  min="0"
                  max="100"
                  placeholder={selected.type === "text" ? "0" : "1"}
                  defaultValue={selected.borderWidth ?? ""}
                />
              </label>
              <div className="designer-color-row">
                <span>Border color</span>
                <DesignerColor
                  {...props}
                  title="Border"
                  name="borderColor"
                  value={
                    selected.appearance?.[props.previewState]?.[
                      "border-color"
                    ] ?? selected.borderColor
                  }
                  theme={props.data.theme}
                  handleChange={(value) =>
                    changeAppearance({ "border-color": value || undefined })
                  }
                />
              </div>
              <label>
                Radius
                <input
                  className="container-cell"
                  name="borderRadius"
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="Theme default"
                  defaultValue={selected.borderRadius ?? ""}
                />
              </label>
              {(
                [
                  [
                    "Borders",
                    [
                      "border-top",
                      "border-right",
                      "border-bottom",
                      "border-left",
                    ],
                  ],
                  [
                    "Corners",
                    [
                      "border-top-left-radius",
                      "border-top-right-radius",
                      "border-bottom-right-radius",
                      "border-bottom-left-radius",
                    ],
                  ],
                ] as const
              ).map(([title, fields]) => (
                <fieldset
                  key={`${selected.id}-${props.previewState}-${title}`}
                  className="designer-linked-fields"
                  onChange={(e) => e.stopPropagation()}
                >
                  <legend>{title}</legend>
                  <label>
                    All
                    <input
                      type="checkbox"
                      aria-label={`All ${title.toLowerCase()}`}
                      defaultChecked={
                        !fields.some(
                          (field) =>
                            selected.appearance?.[props.previewState]?.[field],
                        )
                      }
                      onChange={(e) => {
                        const area = e.currentTarget
                          .closest("fieldset")!
                          .querySelector<HTMLElement>("[data-separate]")!;
                        area.hidden = e.currentTarget.checked;
                        if (e.currentTarget.checked)
                          changeAppearance(
                            Object.fromEntries(
                              fields.map((field) => [field, undefined]),
                            ),
                          );
                      }}
                    />
                  </label>
                  <div
                    data-separate
                    hidden={
                      !fields.some(
                        (field) =>
                          selected.appearance?.[props.previewState]?.[field],
                      )
                    }
                  >
                    {fields.map((field) => {
                      const value =
                          selected.appearance?.[props.previewState]?.[field],
                        label = field
                          .replace("border-", "")
                          .replace("-radius", "");
                      const border = parseBorder(
                        value ??
                          `${selected.borderWidth ?? 1}px ${selected.borderStyle ?? "solid"} ${selected.borderColor ?? "var(--border-default)"}`,
                      );
                      const editBorder = (patch: Partial<typeof border>) => {
                        const next = { ...border, ...patch };
                        changeAppearance({
                          [field]: `${next.width}px ${next.style} ${next.color}`,
                        });
                      };
                      return title === "Corners" ? (
                        <label key={field}>
                          {label}
                          <input
                            className="container-cell"
                            aria-label={field}
                            type="number"
                            min="0"
                            max="5000"
                            defaultValue={
                              value
                                ? Number.parseFloat(value)
                                : (selected.borderRadius ?? 0)
                            }
                            onChange={(e) => {
                              if (
                                e.currentTarget.value !== "" &&
                                e.currentTarget.checkValidity()
                              )
                                changeAppearance({
                                  [field]: `${e.currentTarget.value}px`,
                                });
                            }}
                          />
                        </label>
                      ) : (
                        <div key={field} className="designer-border-side">
                          <strong>{label}</strong>
                          <div data-cols="2" data-gap="control">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="container-cell"
                              aria-label={`${label} border width`}
                              defaultValue={border.width}
                              onChange={(e) => {
                                if (
                                  e.currentTarget.value !== "" &&
                                  e.currentTarget.checkValidity()
                                )
                                  editBorder({
                                    width: Number(e.currentTarget.value),
                                  });
                              }}
                            />
                            <select
                              className="container-cell"
                              aria-label={`${label} border style`}
                              value={border.style}
                              onChange={(e) =>
                                editBorder({ style: e.currentTarget.value })
                              }
                            >
                              {[
                                "none",
                                "solid",
                                "dashed",
                                "dotted",
                                "double",
                              ].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <DesignerColor
                            {...props}
                            title={`${label} border`}
                            value={border.color}
                            theme={props.data.theme}
                            handleChange={(color) =>
                              editBorder({ color: color || "transparent" })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <h3>Effects</h3>
              <label>
                Shadow
                <select
                  className="container-cell"
                  name="boxShadow"
                  defaultValue={selected.boxShadow ?? "none"}
                >
                  <option value="none">None</option>
                  <option value="float">Drop shadow</option>
                  <option value="inset">Inner shadow</option>
                  <option value="custom" disabled>
                    Custom layers
                  </option>
                </select>
              </label>
              <label>
                Opacity (%)
                <input
                  className="container-cell"
                  name="opacity"
                  type="number"
                  min="0"
                  max="100"
                  required
                  defaultValue={(selected.opacity ?? 1) * 100}
                />
              </label>
            </div>
            <div className="designer-property-actions">
              {selected.type === "box" && (
                <button
                  type="button"
                  className="action-main"
                  onClick={() =>
                    props.handleChange(
                      {
                        ...props.data,
                        children: updateNodes(
                          props.data.children,
                          selected.id,
                          {
                            children: [
                              ...selected.children,
                              newElement("box", 16, 16, 160, 100),
                            ],
                          },
                        ),
                      },
                      "change",
                      { ...props },
                    )
                  }
                >
                  Add child
                </button>
              )}
              <button
                type="button"
                className="action-main"
                onClick={() => props.handleAction({}, "delete", { ...props })}
              >
                Delete
              </button>
            </div>
          </form>
        )}
        {selected && (
          <section
            ref={appearanceEditor}
            data-panel="appearance"
            hidden
            className="designer-properties"
            aria-label="CSS state styles"
          >
            <h3>CSS states</h3>
            <p className="container-cell-content-muted">
              Blank values inherit normal styling. CSS values and theme tokens
              are supported. Shadows accept multiple comma-separated layers.
            </p>
            <h3>Shadow layers</h3>
            {shadows.map((shadow, index) => (
              <div
                key={`${selected.id}-${props.previewState}-${index}`}
                className="designer-shadow-layer"
              >
                <DesignerShadow
                  {...props}
                  title={`Shadow ${index + 1}`}
                  value={shadow}
                  theme={props.data.theme}
                  handleChange={(value) => {
                    if (value === undefined) return;
                    const next = [...shadows];
                    next[index] = value;
                    changeAppearance({ "box-shadow": next.join(", ") });
                  }}
                />
                <div className="designer-property-actions">
                  <button
                    className="action-main"
                    disabled={index === 0}
                    aria-label={`Move shadow ${index + 1} up`}
                    onClick={() => {
                      const next = [...shadows];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      changeAppearance({ "box-shadow": next.join(", ") });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    className="action-main"
                    aria-label={`Remove shadow ${index + 1}`}
                    onClick={() =>
                      changeAppearance({
                        "box-shadow":
                          shadows.filter((_, i) => i !== index).join(", ") ||
                          "none",
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              className="action-main"
              onClick={() =>
                changeAppearance({
                  "box-shadow": [
                    ...shadows,
                    "0 4px 12px rgb(0 0 0 / 30%)",
                  ].join(", "),
                })
              }
            >
              Add shadow layer
            </button>
            {Object.entries(appearanceGroups).map(([group, fields]) => (
              <details key={group}>
                <summary>{group} CSS</summary>
                <form
                  key={`${selected.id}-${props.previewState}`}
                  onSubmit={(e) => e.preventDefault()}
                  onChange={(e) => {
                    const input = e.target;
                    if (!(input instanceof HTMLInputElement)) return;
                    const value = input.value.trim();
                    const valid =
                      !value ||
                      (validCSSValue(value) && CSS.supports(input.name, value));
                    input.setCustomValidity(
                      valid ? "" : "Enter a valid CSS value.",
                    );
                    if (!valid) {
                      input.reportValidity();
                      return;
                    }
                    const fields = {
                      ...selected.appearance?.[props.previewState],
                      [input.name]: value || undefined,
                    };
                    props.handleChange(
                      {
                        ...props.data,
                        children: updateNodes(
                          props.data.children,
                          selected.id,
                          {
                            appearance: {
                              ...selected.appearance,
                              [props.previewState]: fields,
                            },
                          },
                        ),
                      },
                      "change",
                      { ...props },
                    );
                  }}
                >
                  {fields.map((field) => (
                    <label key={field}>
                      {field}
                      <input
                        className="container-cell"
                        name={field}
                        aria-label={`${props.previewState} ${field}`}
                        defaultValue={
                          selected.appearance?.[props.previewState]?.[field] ??
                          ""
                        }
                        placeholder={
                          field === "box-shadow"
                            ? "0 8px 24px #0008"
                            : field === "filter"
                              ? "blur(2px) brightness(1.1)"
                              : "Inherit"
                        }
                      />
                    </label>
                  ))}
                </form>
              </details>
            ))}
          </section>
        )}
        <div
          id="designer-panel-theme"
          role="tabpanel"
          aria-labelledby="designer-tab-theme"
          data-panel="theme"
          hidden
        >
          <DesignerTheme {...props} />
        </div>
      </div>
      <div data-area="footer">
        <DesignerComposition {...props} />
      </div>
    </aside>
  );
};
