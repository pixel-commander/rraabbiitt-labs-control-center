import { useState } from "react";
import { LoginBox } from "../LoginBox";
import type { LoginView } from "../LoginBox.types";
export const Demo = () => {
  const [selected, setSelected] = useState<LoginView>("login"),
    [status, setStatus] = useState(
      "Demo only — no authentication service connected.",
    ),
    [disabled, setDisabled] = useState(false);
  return (
    <div data-cols="1" style={{ maxWidth: "28rem", gap: "1em" }}>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(e) => setDisabled(e.target.checked)}
        />{" "}
        Disabled
      </label>
      <LoginBox
        selected={selected}
        disabled={disabled}
        status={status}
        handleSelect={(view) => {
          if (view) setSelected(view);
        }}
        handleSubmit={(_data, type) =>
          setStatus(
            `Received ${type} request. Demo only; no authentication performed.`,
          )
        }
      />
    </div>
  );
};
