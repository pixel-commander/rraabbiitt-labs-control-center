ToggleSection (1794538905696)
Props: title ReactNode, title_class, container_class (default container-dropdown), children, className and HouseKeys.
Grid: 1fr auto columns, auto auto rows. Title at top left, chevron at top right.
Main spans both columns with pad and overflow hidden. Inner scroll-y wrapper is height: max-content.
Click toggles is-open/is-closed on the main ref; no state or HTML details/summary.
CSS transitions max-height from 0 to --toggle-section-max-height (24rem default) and padding.
Hidden content is inert and aria-hidden. Reduced motion removes animation.
