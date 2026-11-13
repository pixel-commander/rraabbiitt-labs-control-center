import { ComponentFactory } from "../ComponentFactory";
import layout from "./layout.json";
import { theme } from "./theme";
import design from "./design.json";

export const Demo = () => {
  return (
    <div className="demo container-demos" data-rows="1" data-cols="1" style={{ blockSize: "44rem", minBlockSize: 0, overflow: "hidden" }}>
      <ComponentFactory json={JSON.stringify(design)} theme_tokens={theme} layout_tokens={layout} />
    </div>
  );
};
