import { useState } from "react";
import { StatusBar } from "../StatusBar";

export const Demo = () => {
  const [version, setVersion] = useState(0);
  return (
    <div>
      <button
        type="button"
        className="action-main"
        onClick={() => setVersion((value) => value + 1)}
      >
        Show status
      </button>
      <StatusBar
        key={version}
        status="Changes saved."
        is_open
        color="var(--accent-secondary)"
      />
    </div>
  );
};
