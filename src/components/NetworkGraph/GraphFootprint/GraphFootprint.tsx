import type { GraphFootprintProps } from "./GraphFootprint.types";
import "./css/graph-footprint.css";

export const GraphFootprint = ({
  className = "",
  data,
  title = "Graph footprint",
}: GraphFootprintProps) => {
  return (
    <section
      className={["graph-footprint", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <h3>{title}</h3>
      <dl data-cols="2" data-gap="control">
        {data.map((metric) => (
          <div key={metric.id ?? metric.name}>
            <dt>{metric.title ?? metric.name}</dt>
            <dd>{metric.value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
