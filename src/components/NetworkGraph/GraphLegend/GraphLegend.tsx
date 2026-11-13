import type { GraphLegendProps } from "./GraphLegend.types";
import "./css/graph-legend.css";
export const GraphLegend = ({
  className = "",
  data,
  title = "Legend",
}: GraphLegendProps) => {
  return (
    <div
      className={["graph-legend", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      {data.map((item) => (
        <span key={item.id ?? item.name} className="graph-legend__item">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
            fill="currentColor"
          >
            {item.shape === "square" ? (
              <rect x="2" y="2" width="8" height="8" />
            ) : (
              <circle cx="6" cy="6" r="4" />
            )}
          </svg>{" "}
          {item.title ?? item.name}
        </span>
      ))}
    </div>
  );
};
