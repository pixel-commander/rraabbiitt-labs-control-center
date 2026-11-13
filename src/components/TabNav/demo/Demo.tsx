import { TabNav, STYLERS } from "../TabNav";
import { useState } from "react";
import "../../../atoms/actions/action-nav-alt/action-nav-alt.css";
import "../../../atoms/actions/action-outline/action-outline.css";
import "../../../atoms/containers/container-cell/container-cell.css";

export const Demo = () => {
  const [selected, setSelected] = useState("#search");
  return (
    <div className="demo">
      {Object.keys(STYLERS).map((name) => (
        <section key={name}>
          <h3>{name}</h3>
          <TabNav
            styler={name}
            items={[
              { id: 1, path: "#search", label: "Search", Icon: <span>⌕</span> },
              { id: 2, path: "#train", label: "Train" },
              { id: 3, path: "#about", label: "About" },
            ]}
            selected={selected}
            handleClick={(item) => {
              if (item) setSelected(item.path);
            }}
          />
        </section>
      ))}
      <p>Selected: {selected}</p>
    </div>
  );
};
