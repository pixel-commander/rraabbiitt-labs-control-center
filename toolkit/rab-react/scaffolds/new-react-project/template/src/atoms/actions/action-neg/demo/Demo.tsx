import "../action-neg.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a className="action-neg is-active" href="#overview" aria-current="page">
        Overview
      </a>
      <a className="action-neg" href="#details">
        Details
      </a>
    </nav>
  );
};
