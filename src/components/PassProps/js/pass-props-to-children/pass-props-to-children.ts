import { Children, cloneElement, isValidElement, Fragment } from "react";
import type { ReactNode } from "react";

export const passPropsToChildren = (
  children: ReactNode,
  props: Record<string, unknown>,
): ReactNode => {
  return Children.map(children, (child) => {
    if (
      !isValidElement<Record<string, unknown>>(child) ||
      typeof child.type === "string" ||
      child.type === Fragment
    )
      return child;
    const supplied = Object.fromEntries(
      Object.entries(child.props).filter(([, value]) => value !== undefined),
    );
    return cloneElement(child, { ...props, ...supplied });
  });
};
