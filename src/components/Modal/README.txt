Modal

Centered native modal dialog with a backdrop and scrollable content.
Props: open (default false), title (ReactNode), footer (ReactNode), children,
className, closeOnBackdrop (default true), and handleClick.
Close, Escape through useKeypress, and outside clicks through useClickOutside
emit handleClick({}, "close-modal"). The caller sets open to false.
Native showModal provides focus containment and restores focus on close.
