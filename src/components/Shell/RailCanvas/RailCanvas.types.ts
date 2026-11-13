import type { HouseKeys } from "../../../HouseKeys.types";
export interface RailTube {
  color: string;
  top: number;
  height: number;
}

export interface RailLed {
  color: string;
  top: number;
  can_blink?: boolean;
}

export interface RailCorner {
  at?: "start" | "end";
  color: string;
  length?: number;
}

export interface RailCanvasProps extends HouseKeys {
  side?: "left" | "right" | "top" | "bottom";
  corner?: RailCorner;
  tubes?: RailTube[];
  leds?: RailLed[];
  joints?: number[];
  can_animate?: boolean;
  className?: string;
}
