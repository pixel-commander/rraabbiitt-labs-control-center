import { useRef } from "react";
import { CodeViewPopupLink } from "../CodeViewPopupLink";
export const Demo = () => {
  const draft = useRef("export const greeting = () => { return 'Hello from the style guide'; };\n");
  const path = "src/components/CodeViewPopupLink";
  const file = "CodeViewPopupLink.tsx";
  return (
    <div
      className="demo container-demos"
      style={{ position: "relative", height: "100%", minHeight: 0 }}
    >
      <CodeViewPopupLink
        path={path}
        file={file}
        handleLoad={() => draft.current}
        handleSave={(data) => { if (data) draft.current = data.code; }}
      />
      <CodeViewPopupLink file="World icon" type="world" code="{}" />
      <CodeViewPopupLink file="Beacon icon" type="beacon" code="{}" />
      <CodeViewPopupLink file="Settings icon" type="settings" code="{}" />
      <CodeViewPopupLink file="Disabled example.tsx" disabled />
      <CodeViewPopupLink
        file="Load error example.tsx"
        handleLoad={() => {
          throw new Error("Demo load failure");
        }}
      />
    </div>
  );
};
