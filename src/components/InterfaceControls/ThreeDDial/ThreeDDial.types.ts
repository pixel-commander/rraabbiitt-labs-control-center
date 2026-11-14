import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
export interface ThreeDDialProps extends HouseKeys {
  label?: string; value?: number; dark?: boolean; disabled?: boolean; size?: string; className?: string;
  handleChange?: HandlerKey<{ value: number }, "dial", void, ThreeDDialProps>;
}
