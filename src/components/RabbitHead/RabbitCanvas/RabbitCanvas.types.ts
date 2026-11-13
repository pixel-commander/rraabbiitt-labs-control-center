import type { Ref } from "react";
import type { HouseKeys } from "../../../HouseKeys.types";

export interface RabbitCanvasProps extends HouseKeys {
  canvasRef: Ref<HTMLCanvasElement>;
  className?: string;
}
