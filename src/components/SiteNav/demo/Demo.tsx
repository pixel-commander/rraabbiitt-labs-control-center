import { SiteNav } from "../SiteNav";
import type { SiteNavItem } from "../SiteNav.types";
import { useURL } from "../../../hooks/useURL/useURL";
import { StatusLabel } from "../../UiElements/UiElements";
const itemIds = [
  1794396160930, 1794396160931, 1794396160932, 1794396160933, 1794396160934,
  1794396160935, 1794396160936,
];
export const Demo = () => {
  const [{ url_vars }, handleURL] = useURL();
  const items: SiteNavItem[] = [
    "Sessions",
    "Chat",
    "Evaluations",
    "Training Set",
    "MCP",
    "World Search",
    "Run Factory",
  ].map((label, index) => ({
    id: itemIds[index],
    label,
    title: label,
    path: "/" + label.toLowerCase().replaceAll(" ", "-"),
  }));
  const selected = url_vars["site-nav.selected"] ?? "/chat";
  return (
    <div data-cols="1" data-gap="content">
      <SiteNav
        Logo={<span aria-hidden="true">◧</span>}
        name={
          <span>
            <strong>morrow</strong> model lab
          </span>
        }
        Right={
          <>
            <span className="container-outline site-nav-demo-status">
              <StatusLabel label="Available" />
            </span>
            <span className="container-outline site-nav-demo-status">
              <StatusLabel label="MCP connected" />
            </span>
          </>
        }
        nav_items={items}
        selected={selected}
        handleClick={(item) =>
          handleURL({ "site-nav.selected": item?.path }, "update-var")
        }
      />
      <SiteNav
        title="Custom rendered navigation"
        name={<strong>Custom render</strong>}
        nav_items={items.slice(0, 2)}
        selected={selected}
        render={(item, type) => (
          <span data-render-type={type}>↗ {item.label}</span>
        )}
        handleClick={(item) =>
          handleURL({ "site-nav.selected": item?.path }, "update-var")
        }
      />
    </div>
  );
};
export default Demo;
