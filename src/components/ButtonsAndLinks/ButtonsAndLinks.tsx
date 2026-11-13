import type { ButtonsAndLinksProps } from "./ButtonsAndLinks.types";
import "./css/buttons-and-links.css";

export const ButtonsAndLinks = ({
  children,
  className = "",
}: ButtonsAndLinksProps) => {
  return (
    <div
      className={["buttons-and-links", "", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
};
