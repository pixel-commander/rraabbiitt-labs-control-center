import type { FloatWindowProps } from "../../FloatWindow/FloatWindow.types";
import type { SliderProps } from "../../Slider/Slider.types";
import type { RabbitHeadRendererProps } from "../RabbitHead.types";
import type { HandlerKey } from "../../../HouseKeys.types";
export interface RabbitControlsProps extends Omit<FloatWindowProps, "rect"> {
  rect?: FloatWindowProps["rect"];
  values?: RabbitHeadRendererProps;
  handleSlider?: SliderProps["handleChange"];
  handleClick?: HandlerKey<string | { name: keyof RabbitHeadRendererProps; value: string }, "rabbit-control", void, RabbitControlsProps>;
}
