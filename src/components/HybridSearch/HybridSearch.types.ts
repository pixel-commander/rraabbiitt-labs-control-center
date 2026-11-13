import type { HouseKeys } from "../../HouseKeys.types";
import type { RefObject } from "react";
import type { RabbitEffects } from "../RabbitHead/js/RabbitStage.jsx";
export interface HybridSearchProps extends HouseKeys { mode?: "hybrid" | "dumbot"; className?: string; rabbitEffects?: RefObject<RabbitEffects | null>; }
