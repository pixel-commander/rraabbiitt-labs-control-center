import { Stylers } from "../Stylers";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { StylerValue } from "../Stylers.types";
import { gridTypes } from "../../GridLayoutDisplay/GridLayoutDisplay.types";
import type { GridType } from "../../GridLayoutDisplay/GridLayoutDisplay.types";

export const Demo = () => {
  const [values, setValues] = useState<Record<string, StylerValue>>({ container: "container-main", action: "action-light", color: "var(--color-primary)" });
  const padding = values.padding === "0" ? 0 : values.padding ? `var(--space-${values.padding})` : undefined;
  const radius = values.radius === "0" ? 0 : values.radius ? `var(--radius-${values.radius})` : undefined;
  return (
    <div className="demo" data-cols="1" data-gap="content" style={{ maxWidth: "28rem" }}>
      <Stylers types={["color", "container", "action", "effect", "grid", "layout"]} values={values}
        handleChange={change => { if (change) setValues(current => ({ ...current, [change.name]: change.value })); }} />
      <div className={[values.container, values.effect, "pad"].filter(Boolean).join(" ")}
        data-grid={values.grid || undefined} style={{ color: values.color, padding, borderRadius: radius, display: values.display,
          justifyItems: values.horizontalAlign, alignItems: values.verticalAlign } as CSSProperties}>
        {(gridTypes[values.grid as GridType] ?? ["main"]).map(area =>
          <div key={area} data-area={area}><p>Live styler preview</p><button type="button" className={String(values.action || "action-light")}>Example action</button></div>)}
      </div>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(values, null, 2)}</pre>
    </div>
  )
};
