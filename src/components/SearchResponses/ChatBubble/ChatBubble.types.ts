import type { ReactNode } from "react";
import type { HouseKeys, HouseTimestampFormat } from "../../../HouseKeys.types";
export interface ChatBubbleBaseProps extends Omit<HouseKeys, "title"> {
  date: HouseTimestampFormat;
  title?: ReactNode;
  children: ReactNode;
  Footer?: ReactNode;
  user_class?: string;
  model_class?: string;
  className?: string;
}
export type ChatBubbleProps = ChatBubbleBaseProps &
  (
    | { side?: "left"; status?: "sent" | "read" }
    | { side: "right"; date: HouseTimestampFormat; status?: never }
  );
