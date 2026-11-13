import { GridCell, STYLERS } from "../GridCell";
import "../../../atoms/containers/container-ghost/container-ghost.css";
import "../../../atoms/containers/container-metal/container-metal.css";

export const Demo = () => {
  return (
    <div data-cols="1" data-gap="content">
      {(Object.keys(STYLERS) as (keyof typeof STYLERS)[]).map((name, index) => (
        <section key={name}>
          <h3>{name}</h3>
          <div data-cols="1" data-rows="1" style={{ height: "180px" }}>
            <GridCell
              styler={name}
              padding={index === 4 ? "10px" : "sm"}
              scroll="y"
            >
              {Array.from({ length: 12 }, (_, row) => (
                <p key={row}>
                  {name} � content row {row + 1}
                </p>
              ))}
            </GridCell>
          </div>
        </section>
      ))}
    </div>
  );
};
