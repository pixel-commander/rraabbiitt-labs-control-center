import type { PassPropsProps } from "./PassProps.types";
import { passPropsToChildren } from "./js/pass-props-to-children/pass-props-to-children";
import "./css/pass-props.css";
import { usePassProps } from "./hooks/usePassProps/usePassProps";

export const PassProps = ({
  children,
  className = "",
  ...props
}: PassPropsProps) => {
  usePassProps(props);
  return (
    <div className={["pass-props", className].filter(Boolean).join(" ")}>
      {passPropsToChildren(children, props)}
    </div>
  );
};
