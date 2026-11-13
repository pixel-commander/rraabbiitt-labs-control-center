import { ComponentFactory } from "../ComponentFactory";
import layout from "./layout.json";
import { theme } from "./theme";

export const Demo = () => {
  return (
    <div className="demo container-demos" data-rows="1" data-cols="1">
      <ComponentFactory theme_tokens={theme} layout_tokens={layout} />
    </div>
  );
};
