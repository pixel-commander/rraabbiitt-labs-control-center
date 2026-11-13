import type {
  HouseKeys,
  HouseIdProps,
  HandlerKey,
} from "../../HouseKeys.types";
export type TrackMode = "1fr" | "auto" | "manual";
export interface Track {
  mode: TrackMode;
  manual: string;
}
export interface GridBox extends HouseKeys {
  id: HouseIdProps;
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  area?: string;
}
export interface GridState {
  rows: number;
  cols: number;
  rowTracks: Track[];
  colTracks: Track[];
  boxes: GridBox[];
}
export interface GridSave extends HouseKeys {
  name: string;
  data: GridState;
  css: string;
}
export interface GridDesignerProps extends HouseKeys {
  data: GridState;
  selected?: HouseIdProps;
  className?: string;
  container_class?: string;
  cell_class?: string;
  action_class?: string;
  disabled?: boolean;
  handleChange?: HandlerKey<
    GridState,
    "grid-designer",
    void,
    GridDesignerProps
  >;
  handleSelect?: HandlerKey<HouseIdProps, "grid-box", void, GridDesignerProps>;
  handleSave?: HandlerKey<
    GridSave,
    "grid-designer",
    void | Promise<void>,
    GridDesignerProps
  >;
}
