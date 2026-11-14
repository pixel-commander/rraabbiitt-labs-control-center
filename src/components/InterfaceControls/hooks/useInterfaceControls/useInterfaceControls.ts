import { useState } from "react";
export const useInterfaceControls = () => {
  const [value, setValue] = useState(40);
  const [pressed, setPressed] = useState(true);
  const [mode, setMode] = useState("mono");
  return { value, setValue, pressed, setPressed, mode, setMode };
};
