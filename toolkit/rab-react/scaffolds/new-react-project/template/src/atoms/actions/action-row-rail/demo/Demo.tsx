import "../action-row-rail.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a
        className="action-row-rail is-active"
        href="#overview"
        aria-current="page"
      >
        Overview
      </a>
      <a className="action-row-rail" href="#details">
        Details
      </a>
    </nav>
  );
};
