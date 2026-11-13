import type { StatelesssFormProps } from "./StatelesssForm.types";
import "./css/statelesss-form.css";

export const StatelesssForm = ({
  children,
  className = "",
}: StatelesssFormProps) => {
  return (
    <div
      className={["statelesss-form", "", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
};
