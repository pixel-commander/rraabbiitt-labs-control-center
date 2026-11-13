import "./css/rabbit-head.css";
import { RabbitStage } from "./js/RabbitStage.jsx";
import type { RabbitHeadProps, RabbitHeadSettings, RabbitHeadRendererProps } from "./RabbitHead.types";

const rendererKeys: (keyof RabbitHeadRendererProps)[] = [
  "model", "transparentBg", "motion", "wheelZoom", "autoMotion", "followMouse", "followX", "followY", "shading",
  "showPulses", "pulseFreq", "pulseSize", "pulseTravel", "pulseSpeed",
  "showSparkles", "sparkleFreq", "sparkleSize", "sparkleTravel", "sparkleSpeed", "dustAmount", "dustSize",
  "showCircuits", "circuitDensity", "circuitCount", "circuitLength", "circuitOpacity", "circuitSpeed", "autoCircuits",
  "circuitRate", "circuitGlow", "circuitCoreColor", "circuitGlowColor", "circuitJumps", "circuitHold", "circuitDir", "circuitStep",
  "autoStrike", "strikeRate", "strikeArms", "strikeSpread", "strikeSpeed", "strikeIntensity", "strikeLength",
  "autoFlood", "floodRate", "floodTravel", "floodSpeed", "floodIntensity", "floodLength",
  "hoverGlow", "hoverSparks", "hoverPulse", "hoverCircuit", "hoverStrike", "hoverFlood", "hoverRadius", "hoverStrength", "hoverRate",
  "useMono", "monoColor", "lineColor", "faceColor", "fxColor", "circuitColor", "strikeColor", "floodColor",
  "faceOpacity", "lineOpacity", "glitch", "glitchDuration", "glitchInterval", "autoGlitch", "pointSize", "pointGlow", "showPoints", "zoom", "panX", "panY",
];

const mapSettings = (settings: RabbitHeadSettings = {}): Partial<RabbitHeadRendererProps> => ({
  showPulses: settings.pulses?.on,
  pulseFreq: settings.pulses?.freq,
  pulseSize: settings.pulses?.size,
  pulseTravel: settings.pulses?.travel,
  pulseSpeed: settings.pulses?.speed,
  showSparkles: settings.sparkles?.on,
  sparkleFreq: settings.sparkles?.freq,
  sparkleSize: settings.sparkles?.size,
  sparkleTravel: settings.sparkles?.travel,
  sparkleSpeed: settings.sparkles?.speed,
  dustAmount: settings.dust?.amount ?? settings.sparkles?.amount,
  dustSize: settings.dust?.size,
  showCircuits: settings.circuits?.on,
  circuitDensity: settings.circuits?.density,
  circuitCount: settings.circuits?.count,
  circuitLength: settings.circuits?.length,
  circuitOpacity: settings.circuits?.opacity,
  circuitSpeed: settings.circuits?.speed,
  autoCircuits: settings.circuits?.auto,
  circuitRate: settings.circuits?.rate,
  circuitGlow: settings.circuits?.glow,
  circuitCoreColor: settings.circuits?.coreColor,
  circuitGlowColor: settings.circuits?.glowColor,
  circuitJumps: settings.circuits?.jumps,
  circuitHold: settings.circuits?.hold,
  circuitDir: settings.circuits?.dir,
  circuitStep: settings.circuits?.step,
  autoStrike: settings.lightning?.auto,
  strikeRate: settings.lightning?.rate,
  strikeArms: settings.lightning?.arms,
  strikeSpread: settings.lightning?.hops,
  strikeSpeed: settings.lightning?.speed,
  strikeIntensity: settings.lightning?.intensity,
  strikeLength: settings.lightning?.fade,
  autoFlood: settings.flood?.auto,
  floodRate: settings.flood?.rate,
  floodTravel: settings.flood?.hops,
  floodSpeed: settings.flood?.speed,
  floodIntensity: settings.flood?.intensity,
  floodLength: settings.flood?.fade,
  hoverGlow: settings.hover?.glow,
  hoverSparks: settings.hover?.sparks,
  hoverPulse: settings.hover?.pulse,
  hoverCircuit: settings.hover?.circuit,
  hoverStrike: settings.hover?.strike,
  hoverFlood: settings.hover?.flood,
  hoverRadius: settings.hover?.radius,
  hoverStrength: settings.hover?.strength,
  hoverRate: settings.hover?.rate,
  useMono: typeof settings.colors?.mono === "string" ? true : settings.colors?.mono,
  monoColor: settings.colors?.monoColor ?? (typeof settings.colors?.mono === "string" ? settings.colors.mono : undefined),
  lineColor: settings.colors?.line,
  faceColor: settings.colors?.face,
  fxColor: settings.colors?.fx,
  circuitColor: settings.colors?.circuit,
  strikeColor: settings.colors?.strike,
  floodColor: settings.colors?.flood,
  faceOpacity: settings.surface?.faceOpacity,
  lineOpacity: settings.surface?.lineOpacity,
  glitch: settings.surface?.glitch,
  glitchDuration: settings.surface?.glitchDuration,
  glitchInterval: settings.surface?.glitchInterval,
  autoGlitch: settings.surface?.autoGlitch,
  pointSize: settings.surface?.pointSize,
  pointGlow: settings.surface?.pointGlow,
  showPoints: settings.surface?.showPoints,
  zoom: settings.view?.zoom,
  panX: settings.view?.panX,
  panY: settings.view?.panY,
});

const pickRendererProps = (props: RabbitHeadProps): Partial<RabbitHeadRendererProps> => {
  const picked: Partial<RabbitHeadRendererProps> = {};
  rendererKeys.forEach((key) => {
    if (props[key] !== undefined) picked[key] = props[key] as never;
  });
  return picked;
};

export const RabbitHead = (props: RabbitHeadProps) => {
  const {
    className = "",
    style,
    interactive = true,
    settings,
    handleReady,
  } = props;
  const rendererProps = {
    ...mapSettings(settings),
    ...pickRendererProps(props),
  };

  return (
    <div className={["rabbit-head", className].filter(Boolean).join(" ")} style={style}>
      <RabbitStage
        {...rendererProps}
        showChrome={false}
        interactive={interactive}
        onReady={(effects) => handleReady?.(effects, "rabbit-head", props)}
      />
    </div>
  );
};
