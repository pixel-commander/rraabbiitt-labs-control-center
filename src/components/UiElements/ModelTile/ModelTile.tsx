import type { ModelTileProps } from "./ModelTile.types";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import "./css/model-tile.css";
export const ModelTile = (props: ModelTileProps) => {
  return (
    <div className={["model-tile", props.className].filter(Boolean).join(" ")}>
      <div className="model-tile-title font-alt">{props.title}</div>
      <StatusLabel {...props} className="model-tile-status" />
    </div>
  );
};
