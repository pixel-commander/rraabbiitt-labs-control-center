import "../action-filled.css";

export const Demo = () => {
  return (
    <div className="atom-demo" style={{ display: "grid", gap: "1em" }}>
      <button type="button" className="action-filled">
        Normal
      </button>
      <button
        type="button"
        className="action-filled is-active"
        aria-pressed="true"
      >
        Active
      </button>
    </div>
  );
};
