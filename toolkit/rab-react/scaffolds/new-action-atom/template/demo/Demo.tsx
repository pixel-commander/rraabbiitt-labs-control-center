import "../__ATOM_NAME__.css";

export const Demo = () => {
  return (
    <div className="atom-demo" style={{ display: "grid", gap: "1em" }}>
      <button type="button" className="__ATOM_NAME__">Normal</button>
      <button type="button" className="__ATOM_NAME__ is-active" aria-pressed="true">Active</button>
    </div>
  );
};
