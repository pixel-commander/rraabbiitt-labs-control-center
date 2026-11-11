import "../action-text-link.css";
export const Demo = () => {
  return (
    <p>
      Use an{" "}
      <a className="action-text-link" href="#ui-elements">
        inline link
      </a>{" "}
      or a <span className="action-text-link">colored text span</span> within a
      sentence.
    </p>
  );
};
