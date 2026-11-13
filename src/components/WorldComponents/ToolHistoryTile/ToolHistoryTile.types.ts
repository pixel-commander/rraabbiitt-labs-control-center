import type { ToggleSectionProps } from "../../ToggleSection/ToggleSection.types";

export interface ToolHistoryTileProps extends ToggleSectionProps {
  run: {
    id?: number;
    name?: string;
    type?: string;
    return_type?: string;
    status: string;
    date_start?: number;
    date_end?: number;
    error?: string;
    time: string;
    response?: unknown;
    settings?: Record<string, unknown>;
    lookup?: { query?: string; id?: number };
  };
}

