import type { StylerProps, TabNavProps } from "./TabNav.types";
import "./css/tab-nav.css";



/**
 * CODING STYLE BEFORE CODE REVIEW
 *

export const STYLERS = {
  main: {
    container_class: "container-cell container-cell--inset",
    action_class: "action-nav",
  },
  tabs: {
    container_class: "",
    action_class: "action-nav-alt",
  },
  pill: {
    container_class: "container-cell container-cell--inset",
    action_class: "action-outline",
  },
} as const;

export const TabNav = (props: TabNavProps) => {
  const {
    data = [],
    selected,
    className = "",
    container_class = "",
    action_class = "",
  } = props;
  const hasSelected = data.some((item) => item.path === selected);
  return (
    <nav
      className={[
        "tab-nav",
        props.full ? "tab-nav--full" : "",
        container_class,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {data.map((item) => (
        <a
          key={item.id}
          href={item.path}
          className={[
            "tab-nav__action",
            action_class,
            selected === item.path
              ? "is-selected"
              : hasSelected
                ? "is-not-selected"
                : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-current={selected === item.path ? "page" : undefined}
          onClick={(event) => {
            if (
              !props.handleSelect ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            props.handleSelect(item, "tab-nav", props);
          }}
        >
          {item.Icon != null && (
            <span className="tab-nav__icon" aria-hidden="true">
              {item.Icon}
            </span>
          )}
          <span className="tab-nav__label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

*/

//
// AFTER PROPS
//

export const STYLERS: StylerProps  = {
  'main': {
    container_class: "container-cell container-cell--inset",
    action_class: "action-nav",
  },
  tabs: {
    action_class: "action-nav-alt",
  },
  pill: {
    container_class: "container-cell container-cell--inset",
    action_class: "action-outline",
  },
}

export const TabNav = ({
  items,
  selected,
  container_class,
  action_class,
  full,
  pad,
  gap,
  styler = 'main', // use a preset styler
  className = '',
  handleClick
}: TabNavProps) => {  

  // check her for missing props for easier ai usage
  if (styler && (container_class || action_class)) console.warn('either pick a styler or user classes')
  if (styler && !STYLERS?.[styler]) console.warn('invalid styler')

  // check for incoming styler and is valid
  const style = STYLERS?.[styler || '']

  // determine class outside of the return easier reading
  if (container_class !== undefined) className += ` ${container_class}`
  else if (style?.container_class !== undefined) className += ` ${style.container_class}`
    
  if (full) className += ` tab-nav--full`
  if (pad) className += ` pad-${pad}`
  if (gap !== undefined) className += ` gap-${gap}`

  // assign component className at the end
  className += ` tab-nav`
 
  return (
    <nav className={className}>
      {items?.map(({ id, path, label, Icon}, i) => {

        // assign class name outside of loop for easier reading
        let item_class = action_class || STYLERS?.[styler]?.action_class
        if (selected && selected === path) item_class += ` is-selected`

        item_class += ` tab-nav-item`
        return (
          <a href='#' className={item_class} key={id || i} data-grid='side-left' onClick={e => {
            e.preventDefault()
            return handleClick?.({id, path, label, Icon}, 'tab-nav')
          }}>

            {Icon && 
            <span className='nav-item-icon'>{Icon}</span>}

            {label &&
            <span data-area='main' className='nav-item-label'>{label}</span>}

          </a>
        )
        
      })}
            
    </nav>
  );
};

