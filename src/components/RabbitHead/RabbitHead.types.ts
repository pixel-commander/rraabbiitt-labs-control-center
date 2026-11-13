import type { CSSProperties } from "react";
import type { HandlerKey, HouseKeys } from "../../HouseKeys.types";
import type { RabbitEffects } from "./js/RabbitStage.jsx";

export type RabbitHeadColor = string;
export type RabbitModel =
  | "rabbit-lo"
  | "rabbit"
  | "rabbit-hi"
  | "rabbit-pro"
  | "skull"
  | "robot"
  | "brain"
  | `custom:${number}`;

export interface RabbitPulsesSettings {
  on?: boolean;
  freq?: number;
  size?: number;
  travel?: number;
  speed?: number;
}

export interface RabbitSparklesSettings {
  on?: boolean;
  freq?: number;
  size?: number;
  travel?: number;
  speed?: number;
  amount?: number;
}

export interface RabbitDustSettings {
  amount?: number;
  size?: number;
}

export interface RabbitCircuitsSettings {
  coreColor?: RabbitHeadColor;
  glowColor?: RabbitHeadColor;
  on?: boolean;
  density?: number;
  count?: number;
  length?: number;
  opacity?: number;
  speed?: number;
  auto?: boolean;
  rate?: number;
  glow?: number;
  jumps?: number;
  hold?: number;
  dir?: number;
  step?: number;
}

export interface RabbitLightningSettings {
  auto?: boolean;
  rate?: number;
  arms?: number;
  hops?: number;
  speed?: number;
  intensity?: number;
  fade?: number;
}

export interface RabbitFloodSettings {
  auto?: boolean;
  rate?: number;
  hops?: number;
  speed?: number;
  intensity?: number;
  fade?: number;
}

export interface RabbitHoverSettings {
  glow?: boolean;
  sparks?: boolean;
  pulse?: boolean;
  circuit?: boolean;
  strike?: boolean;
  flood?: boolean;
  radius?: number;
  strength?: number;
  rate?: number;
}

export interface RabbitColorsSettings {
  mono?: boolean | RabbitHeadColor;
  monoColor?: RabbitHeadColor;
  line?: RabbitHeadColor;
  face?: RabbitHeadColor;
  fx?: RabbitHeadColor;
  circuit?: RabbitHeadColor;
  strike?: RabbitHeadColor;
  flood?: RabbitHeadColor;
}

export interface RabbitSurfaceSettings {
  faceOpacity?: number;
  lineOpacity?: number;
  glitch?: number;
  glitchDuration?: number;
  glitchInterval?: number;
  autoGlitch?: boolean;
  pointSize?: number;
  pointGlow?: number;
  showPoints?: boolean;
}

export interface RabbitViewSettings {
  zoom?: number;
  panX?: number;
  panY?: number;
}

/** Every visual and effect setting accepted by RabbitHead. */
export interface RabbitHeadSettings {
  pulses?: RabbitPulsesSettings;
  sparkles?: RabbitSparklesSettings;
  dust?: RabbitDustSettings;
  circuits?: RabbitCircuitsSettings;
  lightning?: RabbitLightningSettings;
  flood?: RabbitFloodSettings;
  hover?: RabbitHoverSettings;
  colors?: RabbitColorsSettings;
  surface?: RabbitSurfaceSettings;
  view?: RabbitViewSettings;
}

/** Flat renderer settings consumed by RabbitStage. */
export interface RabbitHeadRendererProps {
  model?: RabbitModel;
  transparentBg?: boolean;
  motion?: "full" | "calm";
  wheelZoom?: boolean;
  autoMotion?: boolean;
  followMouse?: boolean;
  followX?: number;
  followY?: number;
  shading?: "smooth" | "flat";
  showPulses?: boolean;
  pulseFreq?: number;
  pulseSize?: number;
  pulseTravel?: number;
  pulseSpeed?: number;
  showSparkles?: boolean;
  sparkleFreq?: number;
  sparkleSize?: number;
  sparkleTravel?: number;
  sparkleSpeed?: number;
  dustAmount?: number;
  dustSize?: number;
  showCircuits?: boolean;
  circuitDensity?: number;
  circuitCount?: number;
  circuitLength?: number;
  circuitOpacity?: number;
  circuitSpeed?: number;
  autoCircuits?: boolean;
  circuitRate?: number;
  circuitGlow?: number;
  circuitCoreColor?: RabbitHeadColor;
  circuitGlowColor?: RabbitHeadColor;
  circuitJumps?: number;
  circuitHold?: number;
  circuitDir?: number;
  circuitStep?: number;
  autoStrike?: boolean;
  strikeRate?: number;
  strikeArms?: number;
  strikeSpread?: number;
  strikeSpeed?: number;
  strikeIntensity?: number;
  strikeLength?: number;
  autoFlood?: boolean;
  floodRate?: number;
  floodTravel?: number;
  floodSpeed?: number;
  floodIntensity?: number;
  floodLength?: number;
  hoverGlow?: boolean;
  hoverSparks?: boolean;
  hoverPulse?: boolean;
  hoverCircuit?: boolean;
  hoverStrike?: boolean;
  hoverFlood?: boolean;
  hoverRadius?: number;
  hoverStrength?: number;
  hoverRate?: number;
  useMono?: boolean;
  monoColor?: RabbitHeadColor;
  lineColor?: RabbitHeadColor;
  faceColor?: RabbitHeadColor;
  fxColor?: RabbitHeadColor;
  circuitColor?: RabbitHeadColor;
  strikeColor?: RabbitHeadColor;
  floodColor?: RabbitHeadColor;
  faceOpacity?: number;
  lineOpacity?: number;
  glitch?: number;
  glitchDuration?: number;
  glitchInterval?: number;
  autoGlitch?: boolean;
  pointSize?: number;
  pointGlow?: number;
  showPoints?: boolean;
  zoom?: number;
  panX?: number;
  panY?: number;
}

export interface RabbitHeadProps extends HouseKeys, RabbitHeadRendererProps {
  /** Nested, partial settings. Missing values use the renderer defaults. */
  settings?: RabbitHeadSettings;
  /** Enable pointer and wheel interaction. Defaults to true. */
  interactive?: boolean;
  /** CSS styles for the component root. */
  style?: CSSProperties;
  className?: string;
  /** Receives the effects API, event type, and complete incoming props bag. */
  handleReady?: HandlerKey<RabbitEffects | null, "rabbit-head", void, RabbitHeadProps>;
}
