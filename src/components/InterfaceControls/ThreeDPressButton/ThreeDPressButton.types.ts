import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
export interface ThreeDPressButtonProps extends HouseKeys {
  label?: string; pressed?: boolean; stadium?: boolean; disabled?: boolean; size?: string; className?: string;
  handleClick?: HandlerKey<{ pressed: boolean }, "press-button", void, ThreeDPressButtonProps>;
}
