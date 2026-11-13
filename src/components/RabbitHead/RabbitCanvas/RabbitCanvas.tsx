import "./css/rabbit-canvas.css";
import type { RabbitCanvasProps } from "./RabbitCanvas.types";

export const RabbitCanvas = ({
  canvasRef,
  className = "",
}: RabbitCanvasProps) => {
  return (
    <canvas
      ref={canvasRef}
      className={["rabbit-canvas", className].filter(Boolean).join(" ")}
    />
  );
};
