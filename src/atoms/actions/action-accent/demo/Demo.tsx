import "../action-accent.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a
        className="action-accent is-active"
        href="#overview"
        aria-current="page"
      >
        Overview
      </a>
      <a className="action-accent" href="#details">
        Details
      </a>
    </nav>
  );
};
