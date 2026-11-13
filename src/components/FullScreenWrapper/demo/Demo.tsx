import { useState } from "react";
import { FullScreenWrapper } from "../FullScreenWrapper";
export const Demo = () => {
  const [full, setFull] = useState(false);
  return (
    <FullScreenWrapper
      title="Document preview"
      full={full}
      handleChange={(data) => {
        if (data) setFull(data.full);
      }}
      actions={<span>Caller-owned actions </span>}
    >
      <h3>Reusable content shell</h3>
      <p>
        Use Fullscreen to expand this panel. Restore or Escape returns it to the
        page.
      </p>
      <p>
        The parent owns fullscreen state. This uses CSS positioning, without the
        browser fullscreen API.
      </p>
    </FullScreenWrapper>
  );
};
