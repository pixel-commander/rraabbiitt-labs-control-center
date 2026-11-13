import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
import type { SmartTooltipPlacement } from "../SmartTooltip/SmartTooltip.types";

export interface HelpIconProps extends HouseKeys {
  /** Tooltip body. React content is supported; strings are included for assistive technology. */
  content?: ReactNode;
  /** Accessible name for the question mark trigger. Defaults to "Help". */
  label?: string;
  /** Preferred SmartTooltip placement. Defaults to above. */
  placement?: SmartTooltipPlacement;
  /** Additional class applied to the trigger. */
  className?: string;
}
