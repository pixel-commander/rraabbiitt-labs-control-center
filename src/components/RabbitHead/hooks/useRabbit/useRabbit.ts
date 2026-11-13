import { glitchDefaults } from "../../js/glitch";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RabbitHeadProps, RabbitHeadRendererProps } from "../../RabbitHead.types";
import type { RabbitControlsProps } from "../../RabbitControls/RabbitControls.types";
import type { RabbitEffects } from "../../js/RabbitStage.jsx";
import type { WindowRect } from "../../../../hooks/useWindowGesture/useWindowGesture";

export const rabbitDefaults: RabbitHeadRendererProps = {
  followX: 0.7, followY: 0.35, glitch: glitchDefaults.amount, glitchDuration: glitchDefaults.duration, glitchInterval: glitchDefaults.interval, autoGlitch: false,
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

export interface UseRabbitProps {
  /** Partial flat renderer props, including every RabbitControls value. */
  values?: RabbitHeadRendererProps;
  rect?: WindowRect;
  open?: boolean;
}

const definedValues = (values: RabbitHeadRendererProps) => {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as RabbitHeadRendererProps;
};

/** Own one head's settings, effects API and optional controls popup state. */
export const useRabbit = (props: UseRabbitProps = {}) => {
  const effects = useRef<RabbitEffects | null>(null);
  const arcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [defaults] = useState(() => ({ ...rabbitDefaults, ...definedValues(props.values ?? {}) }));
  const [values, setValues] = useState(defaults);
  const [rect, setRect] = useState(props.rect ?? { x: 8, y: 8, width: 288, height: 360 });
  const [open, setOpen] = useState(props.open ?? true);

  const clearArcTimer = useCallback(() => {
    if (arcTimer.current !== null) clearTimeout(arcTimer.current);
    arcTimer.current = null;
  }, []);
  useEffect(() => () => { clearArcTimer(); }, [clearArcTimer]);

  const handleReady = useCallback<NonNullable<RabbitHeadProps["handleReady"]>>((api) => {
    effects.current = api ?? null;
  }, []);
  const handleSettings = useCallback((patch?: RabbitHeadRendererProps) => {
    if (patch === undefined) return;
    setValues(current => ({ ...current, ...definedValues(patch) }));
  }, []);
  const handleReset = useCallback(() => {
    clearArcTimer();
    effects.current?.glitch(null);
    for (const group of ["pulses", "sparkles", "dust", "circuits", "lightning", "flood", "hover", "colors", "surface", "view"]) {
      effects.current?.[group](null);
    }
    setValues(defaults);
  }, [clearArcTimer, defaults]);
  const handleSlider = useCallback<NonNullable<RabbitControlsProps["handleSlider"]>>((value, _type, bag) => {
    if (value === undefined || !bag?.name) return;
    handleSettings({ [bag.name]: value });
  }, [handleSettings]);
  const handleClick = useCallback<NonNullable<RabbitControlsProps["handleClick"]>>((action) => {
    if (action && typeof action === "object") handleSettings({ [action.name]: action.value });
    else if (action === "lightning") effects.current?.strike();
    else if (action === "glitch") effects.current?.glitch();
    else if (action === "flood") effects.current?.faceStrike();
    else if (action === "arcs") {
      effects.current?.circuits({ auto: true });
      clearArcTimer();
      const api = effects.current;
      arcTimer.current = setTimeout(() => { api?.circuits(null); arcTimer.current = null; }, 1800);
    } else if (action === "reset") handleReset();
    else if (action === "showPulses" || action === "showSparkles" || action === "autoMotion" || action === "useMono" || action === "autoGlitch") {
      setValues(current => ({ ...current, [action]: !current[action] }));
    }
  }, [clearArcTimer, handleReset, handleSettings]);

  return { effects, values, setValues, rect, setRect, open, setOpen, handleReady, handleSettings, handleReset, handleSlider, handleClick };
};
