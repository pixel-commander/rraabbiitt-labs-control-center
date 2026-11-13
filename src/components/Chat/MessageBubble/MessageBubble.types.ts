import type { HouseKeys } from "../../../HouseKeys.types";
import type { ReactNode } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
export interface MessageBubbleProps extends HouseKeys {
  side?: "left" | "right";
  name: string;
  message: ReactNode;
  status?: "sent" | "read";
  date?: number;
  handleClick?: HandlerKey<
    { name: string; message: ReactNode; side: "left" | "right" },
    "message-click",
    void
  >;
  className?: string;
  container_class?: string;
}
