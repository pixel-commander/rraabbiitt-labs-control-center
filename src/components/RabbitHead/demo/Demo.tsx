import { useEffect, useRef, useState } from "react";
import { RabbitHead } from "../RabbitHead";
import { RabbitControls } from "../RabbitControls/RabbitControls";
import type { RabbitControlsProps } from "../RabbitControls/RabbitControls.types";
import type { RabbitHeadRendererProps } from "../RabbitHead.types";
import type { RabbitEffects } from "../js/RabbitStage.jsx";

const defaults: RabbitHeadRendererProps = {
  zoom: 1, panX: 0.35, panY: 0, faceOpacity: 0.1, lineOpacity: 0.15,
  pointSize: 0.3, pointGlow: 0, showSparkles: false, dustAmount: 0,
  showPulses: false, autoMotion: false, circuitOpacity: 0.3, circuitGlow: 0.35,
  pulseFreq: 14, pulseSize: 1, pulseTravel: 3, pulseSpeed: 1,
  circuitRate: 7, circuitJumps: 6, circuitSpeed: 1, strikeIntensity: 0.3,
  strikeArms: 1, strikeSpread: 12, strikeLength: 600, floodIntensity: 0.3,
  faceColor: "#39e28e", lineColor: "#4dff88", fxColor: "#4dff88",
  circuitColor: "#4dff88", circuitCoreColor: "#ffffff", circuitGlowColor: "#2684ff",
  strikeColor: "#4dff88", floodColor: "#4dff88", monoColor: "#4dff88", useMono: false,
};
const useRabbitDemo = () => {
  const effects = useRef<RabbitEffects | null>(null);
  const arcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState(defaults);
  const [rect, setRect] = useState({ x: 8, y: 8, width: 288, height: 360 });
  const [open, setOpen] = useState(true);
  useEffect(() => () => { if (arcTimer.current !== null) clearTimeout(arcTimer.current); }, []);
  const handleSlider: RabbitControlsProps["handleSlider"] = (value, _type, bag) => {
    if (value === undefined || !bag?.name) return;
    setValues(current => ({ ...current, [bag.name!]: value }));
  };
  const handleClick: RabbitControlsProps["handleClick"] = action => {
    if (action && typeof action === "object") setValues(current => ({ ...current, [action.name]: action.value }));
    else if (action === "lightning") effects.current?.strike();
    else if (action === "flood") effects.current?.faceStrike();
    else if (action === "arcs") {
      effects.current?.circuits({ auto: true });
      if (arcTimer.current !== null) clearTimeout(arcTimer.current);
      arcTimer.current = setTimeout(() => effects.current?.circuits(null), 1800);
    } else if (action === "reset") {
      if (arcTimer.current !== null) clearTimeout(arcTimer.current);
      effects.current?.circuits(null);
      setValues(defaults);
    } else if (action === "showPulses" || action === "showSparkles" || action === "autoMotion" || action === "useMono") {
      setValues(current => ({ ...current, [action]: !current[action] }));
    }
  };
  return { effects, values: { ...defaults, ...values }, rect, setRect, open, setOpen, handleSlider, handleClick };
};
export const Demo = () => {
  const state = useRabbitDemo();
  return (
    <div className="rabbit-head-demo container-outline">
      <RabbitHead {...state.values} transparentBg interactive={false} followMouse wheelZoom={false}
        handleReady={effects => { state.effects.current = effects ?? null; }} />
      {!state.open && <button className="rabbit-head-demo-open action-outline" type="button" onClick={() => state.setOpen(true)}>Rabbit controls</button>}
      <RabbitControls values={state.values} rect={state.rect} open={state.open}
        handleChange={rect => { if (rect) state.setRect(rect); }}
        handleClose={() => state.setOpen(false)} handleSlider={state.handleSlider} handleClick={state.handleClick} />
    </div>
  );
};
