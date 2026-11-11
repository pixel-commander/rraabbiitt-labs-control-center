import { useState } from "react";
import { FloatWindow } from "../FloatWindow";
export const Demo = () => {
  const [rect, setRect] = useState({ x: 16, y: 16, width: 280, height: 180 });
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        className="action-main pad"
        type="button"
        onClick={() => setOpen(true)}
      >
        Open window
      </button>
      <div
        className="container-inset"
        style={{ position: "relative", height: "24rem", overflow: "hidden" }}
      >
        <FloatWindow
          title="Floating preview"
          rect={rect}
          open={open}
          handleClose={() => setOpen(false)}
          handleChange={(value) => {
            if (value) setRect(value);
          }}
        >
          <p>
            Drag the header or resize from the bottom corner. Bounds stay inside
            this panel.
          </p>
          <input
            aria-label="Preview input"
            placeholder="Your content stays mounted"
          />
        </FloatWindow>
      </div>
    </div>
  );
};
