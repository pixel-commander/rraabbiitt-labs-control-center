import "../action-light.css";

export const Demo = () => {
  return (
    <div className="atom-demo" style={{ display: "grid", gap: "1em" }}>
      <button type="button" className="action-light">
        Normal
      </button>
      <button
        type="button"
        className="action-light is-active"
        aria-pressed="true"
      >
        Active
      </button>
    </div>
  );
};
