import "../action-outline.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a
        className="action-outline is-active"
        href="#overview"
        aria-current="page"
      >
        Overview
      </a>
      <a className="action-outline" href="#details">
        Details
      </a>
    </nav>
  );
};
