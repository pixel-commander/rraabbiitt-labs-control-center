import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
export interface ThreeDToggleButtonsProps extends HouseKeys {
  label?: string; value?: string; options?: { name: string; label: string }[];
  disabled?: boolean; size?: string; className?: string;
  handleClick?: HandlerKey<{ value: string }, "toggle-buttons", void, ThreeDToggleButtonsProps>;
}
