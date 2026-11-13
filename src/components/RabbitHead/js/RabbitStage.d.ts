import type { ComponentType } from "react";
import type { RabbitHeadRendererProps, RabbitModel } from "../RabbitHead.types";

export type RabbitEffects = {
  strike: () => void;
  faceStrike: () => void;
  storm: (count: number, interval: number) => void;
  model: (name: RabbitModel) => void;
} & Record<string, (options: Record<string, string | number | boolean> | null) => void>;

export type RabbitStageProps = RabbitHeadRendererProps & {
  showChrome?: boolean;
  interactive?: boolean;
  onReady?: (effects: RabbitEffects | null) => void;
};

export const RabbitStage: ComponentType<RabbitStageProps>;
