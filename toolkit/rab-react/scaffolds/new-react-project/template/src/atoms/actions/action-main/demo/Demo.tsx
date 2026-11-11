import "../action-main.css";

export const Demo = () => {
  return (
    <nav className="atom-demo" aria-label="Action skin example">
      <a className="action-main is-active" href="#overview" aria-current="page">
        Overview
      </a>
      <a className="action-main" href="#details">
        Details
      </a>
    </nav>
  );
};
