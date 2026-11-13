import type { StateCellProps } from "./StateCell.types";
import "../../../../atoms/containers/container-cell/container-cell.css";
import "./css/state-cell.css";

export const StateCell = ({
  title,
  value,
  label,
  className,
  cell_class,
}: StateCellProps) => {
  return (
    <div className={["stat-cell", cell_class, className].filter(Boolean).join(" ")}>
      {title != null && <div className="stat-cell__title">{title}</div>}
      <div className="stat-cell__value">{value}</div>
      {label != null && <div className="stat-cell__label">{label}</div>}
    </div>
  );
};

