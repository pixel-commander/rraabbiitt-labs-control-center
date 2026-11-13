import { FloatWindow } from "../../FloatWindow/FloatWindow";
import { Slider } from "../../Slider/Slider";
import type { RabbitHeadRendererProps } from "../RabbitHead.types";
import type { RabbitControlsProps } from "./RabbitControls.types";
import "./css/rabbit-controls.css";

const groups: { title: string; rows: [keyof RabbitHeadRendererProps, string, number, number, number][] }[] = [
  { title: "Position", rows: [["zoom", "Size", 0.2, 2, 0.05], ["panX", "Horizontal", -1, 1, 0.02], ["panY", "Vertical", -1, 1, 0.02]] },
  { title: "Surface", rows: [["faceOpacity", "Fill", 0, 1, 0.01], ["lineOpacity", "Lines", 0, 1, 0.01], ["pointSize", "Nodes", 0, 3, 0.1], ["pointGlow", "Node glow", 0, 1, 0.05]] },
  { title: "Pulses", rows: [["pulseFreq", "Count", 0, 40, 1], ["pulseSize", "Size", 0.25, 4, 0.25], ["pulseTravel", "Travel", 1, 20, 1], ["pulseSpeed", "Speed", 0.1, 5, 0.1]] },
  { title: "Arcs", rows: [["circuitOpacity", "Opacity", 0, 1, 0.05], ["circuitGlow", "Glow", 0, 1, 0.05], ["circuitRate", "Count", 1, 20, 1], ["circuitJumps", "Reach", 1, 14, 1], ["circuitSpeed", "Speed", 0.25, 4, 0.25]] },
  { title: "Lightning / flood", rows: [["strikeIntensity", "Bolt strength", 0.25, 3, 0.05], ["floodIntensity", "Flood strength", 0.25, 3, 0.05]] },
];
const colors = [
  ["faceColor", "Fill"], ["lineColor", "Lines"], ["fxColor", "Pulses / sparks"],
  ["circuitColor", "Circuit traces"], ["circuitCoreColor", "Arc core"],
  ["circuitGlowColor", "Arc glow"], ["strikeColor", "Lightning"],
  ["floodColor", "Flood"], ["monoColor", "Mono color"],
] as const;
export const RabbitControls = (props: RabbitControlsProps) => {
  const { values, handleSlider, handleClick, className, ...windowProps } = props;
  return (
    <FloatWindow {...windowProps} title={props.title ?? "Rabbit controls"} className={["rabbit-controls", className].filter(Boolean).join(" ")}>
      <div className="rabbit-controls-actions">
        {["lightning", "flood", "arcs"].map(action => <button key={action} className="action-outline" type="button" onClick={() => handleClick(action, "rabbit-control", props)}>{action}</button>)}
      </div>
      <div className="rabbit-controls-actions">
        {([["showPulses", "Pulses"], ["showSparkles", "Sparkles"], ["autoMotion", "Motion"]] as const).map(([key, label]) => <button key={key} className="action-ghost" type="button" aria-pressed={Boolean(values[key])} onClick={() => handleClick(key, "rabbit-control", props)}>{label}</button>)}
      </div>
      <details className="rabbit-controls-colors" open>
        <summary>Colors</summary>
        <button className="action-ghost" type="button" aria-pressed={Boolean(values.useMono)} onClick={() => handleClick("useMono", "rabbit-control", props)}>Monochrome</button>
        <div className="rabbit-controls-swatches">
          {colors.map(([name, label]) => <label key={name}>
            <span>{label}</span>
            <input type="color" aria-label={label + " color"} value={values[name] ?? "#4dff88"}
              onChange={event => handleClick({ name, value: event.currentTarget.value }, "rabbit-control", props)} />
          </label>)}
        </div>
      </details>
      {groups.map(group => <fieldset key={group.title}><legend>{group.title}</legend>
        {group.rows.map(([name, label, min, max, step]) => <Slider key={name} name={name} label={label} min={min} max={max} step={step} value={Number(values[name] ?? min)} handleChange={handleSlider} />)}
      </fieldset>)}
      <button className="action-outline" type="button" onClick={() => handleClick("reset", "rabbit-control", props)}>Reset defaults</button>
    </FloatWindow>
  );
};
