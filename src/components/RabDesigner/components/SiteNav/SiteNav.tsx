import type { HTMLAttributes, MouseEvent } from "react";
export type NavRow = { id: string | number; name: string; path: string };
type SiteNavProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  rows?: readonly NavRow[];
  selected?: string | number;
  handleClick?: (row: NavRow) => void;
  activeHref?: string;
  linkClassName?: string;
  label?: string;
};
const defaultRows: readonly NavRow[] = [
  { id: "RABDesigner", name: "RABDesigner", path: "/" },
];
export const SiteNav = ({
  rows = defaultRows,
  selected,
  handleClick,
  activeHref,
  linkClassName,
  label = "Main navigation",
  className,
}: SiteNavProps) => {
  const onRowClick = (event: MouseEvent<HTMLAnchorElement>, row: NavRow) => {
    if (!handleClick) return;
    event.preventDefault();
    handleClick(row);
  };
  return (
    <nav
      aria-label={label}
      className={["site-nav", className].filter(Boolean).join(" ")}
    >
      {rows.map((row) => {
        const is_active =
          selected !== undefined
            ? String(selected) === String(row.id)
            : activeHref === row.path;
        return (
          <a
            key={row.id}
            href={row.path}
            onClick={(event) => onRowClick(event, row)}
            className={[linkClassName, is_active && "is-selected"]
              .filter(Boolean)
              .join(" ")}
            aria-current={is_active ? "page" : undefined}
          >
            {row.name}
          </a>
        );
      })}
    </nav>
  );
};
