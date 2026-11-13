import type { DesignerShadowProps } from "./DesignerShadow.types";
import "./css/designer-shadow.css";
import { DesignerColor } from "../DesignerColor/DesignerColor";
import { useDesignerShadow } from "../../hooks/useDesignerShadow";
import { shadowValue } from "../../js/shadows";

export const DesignerShadow = (props: DesignerShadowProps) => {
  const { root, shadow } = useDesignerShadow(props.value);
  const change = (patch: Partial<typeof shadow>) =>
    props.handleChange(shadowValue({ ...shadow, ...patch }), "change", {
      ...props,
    });
  return (
    <div ref={root} className="designer-shadow container-cell">
      <header>
        <strong>{props.title}</strong>
        <label>
          Inset
          <input
            data-shadow-field="inset"
            aria-label={`${props.title} inset`}
            type="checkbox"
            defaultChecked={shadow.inset}
            onChange={(e) => change({ inset: e.currentTarget.checked })}
          />
        </label>
      </header>
      <div data-cols="2" data-gap="control">
        {(["x", "y", "blur", "spread"] as const).map((key) => (
          <label key={key}>
            {key === "x" ? "X" : key === "y" ? "Y" : key}
            <input
              data-shadow-field={key}
              aria-label={`${props.title} ${key}`}
              className="container-cell"
              type="number"
              min={key === "blur" ? 0 : -1000}
              max="1000"
              defaultValue={shadow[key]}
              onChange={(e) => {
                if (
                  e.currentTarget.value !== "" &&
                  e.currentTarget.checkValidity()
                )
                  change({ [key]: Number(e.currentTarget.value) });
              }}
            />
          </label>
        ))}
      </div>
      <div className="designer-color-row">
        <span>Color</span>
        <DesignerColor
          {...props}
          title={`${props.title} color`}
          value={shadow.color}
          handleChange={(value) => change({ color: value || "transparent" })}
        />
      </div>
    </div>
  );
};
