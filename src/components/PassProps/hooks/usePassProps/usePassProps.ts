import { useEffect, useRef } from "react";
import type { PassPropsProps } from "../../PassProps.types";

export const usePassProps = (props: PassPropsProps) => {
  const warned = useRef(false);
  const hasRef = Object.hasOwn(props, "ref");
  useEffect(() => {
    if (hasRef && !warned.current) {
      warned.current = true;
      console.warn(
        "PassProps: received a prop named 'ref'. If this is a data prop, rename it to 'forwardedRef' or 'elementRef' to distinguish it from React's ref behavior.",
      );
    }
  }, [hasRef]);
};
