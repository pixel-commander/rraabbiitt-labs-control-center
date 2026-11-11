import "../action-row.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a className="action-row is-active" href="#overview" aria-current="page">
        Overview
      </a>
      <a className="action-row" href="#details">
        Details
      </a>
    </nav>
  );
};
