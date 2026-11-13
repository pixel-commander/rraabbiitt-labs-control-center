import { HelpIcon } from "../HelpIcon";

export const Demo = () => {
  return (
    <div className="help-icon-demo" style={{ padding: "2rem" }}>
      <label style={{ display: "inline-grid", gridTemplateColumns: "auto auto", gap: "0.4rem", alignItems: "center" }}>
        Temperature
        <HelpIcon content="Controls how varied the response is." />
      </label>
    </div>
  );
};
