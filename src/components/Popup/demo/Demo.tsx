import { useState } from "react";
import { Popup } from "../Popup";
import type { PopupValue } from "../Popup.types";
export const Demo = () => {
  const [value, setValue] = useState<PopupValue>({
    mode: "docked",
    rect: { x: 0, y: 0, width: 300, height: 220 },
  });
  return (
    <div>
      <p>
        Drag the header to float. Drop over its seat or use Snap back to dock.
        Fullscreen is CSS only.
      </p>
      <Popup
        title="Reusable popup"
        value={value}
        handleChange={(next) => {
          if (next) setValue(next);
        }}
      >
        <p>Caller content, preserved between window modes.</p>
        <label>
          Draft <input placeholder="Try typing before moving" />
        </label>
      </Popup>
    </div>
  );
};
