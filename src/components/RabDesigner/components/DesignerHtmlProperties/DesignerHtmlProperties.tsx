import type { DesignerHtmlPropertiesProps } from "./DesignerHtmlProperties.types";
import { useDesignerHtmlProperties } from "../../hooks/useDesignerHtmlProperties";
import { layoutOptions, layoutLengths, allowsWidth } from "../../js/htmlModel";
import { newElement, updateNodes } from "../../js/document";
export const DesignerHtmlProperties = (props: DesignerHtmlPropertiesProps) => {
  const { form, status, values, apply, showField } =
      useDesignerHtmlProperties(props),
    node = props.node;
  return (
    <form
      ref={form}
      className="designer-properties"
      aria-label="HTML element properties"
      data-canvas-controls
      onChange={apply}
      onSubmit={(e) => e.preventDefault()}
    >
      <h3>
        {props.data.mode === "dev" ? "Reusable component" : "HTML element"}
      </h3>
      <label>
        Name
        <input
          name="title"
          className="container-cell"
          defaultValue={node.title}
          maxLength={200}
        />
      </label>
      <label>
        Class
        <input
          name="className"
          aria-label="CSS class name"
          className="container-cell"
          defaultValue={node.className}
          maxLength={80}
          pattern="[a-z][a-z0-9]*(-[a-z0-9]+)*"
          title="Lowercase kebab-case, for example info-card"
        />
      </label>
      {props.data.mode === "dev" && (
        <p className="container-cell-content-muted">
          Appearance and layout update every instance of this class. Text stays
          local to each instance.
        </p>
      )}
      <label>
        Text
        <textarea
          name="content"
          aria-label="Element text"
          className="container-cell"
          defaultValue={node.content}
          maxLength={5000}
        />
      </label>
      <h3>Layout</h3>
      {Object.entries(layoutOptions)
        .filter(([key]) => showField(key))
        .map(([key, options]) => (
          <label key={key}>
            {key.replace(/[A-Z]/g, (c) => " " + c.toLowerCase())}
            <select
              name={key}
              aria-label={key}
              className="container-cell"
              defaultValue={String(values[key as keyof typeof values])}
            >
              {options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ))}
      {layoutLengths
        .filter(
          (key) =>
            allowsWidth(props.data.mode, node) ||
            !["width", "minWidth", "maxWidth"].includes(key),
        )
        .map((key) => (
          <label key={key}>
            {key.replace(/[A-Z]/g, (c) => " " + c.toLowerCase())}
            <input
              name={key}
              aria-label={key}
              className="container-cell"
              defaultValue={String(values[key as keyof typeof values])}
              placeholder="Default"
            />
          </label>
        ))}
      {(
        [
          ["cols", "Columns", 1, 12],
          ["gap", "Gap", 0, 1000],
          ["padding", "Padding", 0, 1000],
          ["flexGrow", "Flex grow", 0, 100],
          ["flexShrink", "Flex shrink", 0, 100],
          ["fontSize", "Font size", 8, 120],
        ] as const
      )
        .filter(([key]) => showField(key))
        .map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              className="container-cell"
              type="number"
              min={min}
              max={max}
              defaultValue={Number(values[key])}
            />
          </label>
        ))}
      <label>
        Weight
        <select
          name="fontWeight"
          className="container-cell"
          defaultValue={values.fontWeight}
        >
          {[400, 500, 600, 700].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <div className="designer-property-actions">
        <button
          type="button"
          className="action-main"
          onClick={() => {
            const child = newElement("box", 0, 0, 120, 80);
            props.handleChange(
              {
                ...props.data,
                children: updateNodes(props.data.children, node.id, {
                  children: [...node.children, child],
                }),
              },
              "change",
              { ...props },
            );
            props.handleClick({ id: child.id }, "select", { ...props });
          }}
        >
          Add div inside
        </button>
        <button
          type="button"
          className="action-main"
          onClick={() => props.handleAction({}, "delete", { ...props })}
        >
          Delete
        </button>
      </div>
      <output ref={status} aria-live="polite" />
    </form>
  );
};
