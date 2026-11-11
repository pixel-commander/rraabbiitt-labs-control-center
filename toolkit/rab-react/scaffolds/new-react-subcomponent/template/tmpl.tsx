import "./css/__COMPONENT_CLASS__.css";
import type { __COMPONENT_NAME__Props } from "./__COMPONENT_NAME__.types";

export const __COMPONENT_NAME__ = ({
  children = __DEFAULT_CHILDREN__,
  className = "",
}: __COMPONENT_NAME__Props) => {
  className = `__ROOT_CLASS__ ${className}`;
  return (
    <div__GRID_ATTRIBUTE__ className={className}>
      {children}
    </div>
  );
};
