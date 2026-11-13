TabNav
STYLERS is exported from TabNav.tsx with three class presets:
main: container-cell container-cell--inset / action-nav (AppHeader navigation skin).
tabs: no container class / action-nav-alt.
pill: container-cell container-cell--inset / action-outline.
Apply with <TabNav {...STYLERS.tabs} ... />. Import the chosen atom CSS in the host.
Controlled navigation. No internal selection state or routing. Uses flex layout.

Props extend HouseKeys:
pad and gap optionally apply pad-* and gap-* classes to the nav wrapper.
Both accept xs, sm, md, lg, and xl.
gap also accepts numeric 0.
full?: boolean (default false). False uses max-content width; true uses 100%.
data: TabNavItem[] (default []). Each item extends HouseKeys and requires numeric
id, path: string, and label: ReactNode. Icon?: ReactNode accepts Icon: <SomeIcon />.
selected?: string is the active path; sets is-active and aria-current="page".
handleSelect?: HandlerKey<TabNavItem, "tab-nav", void, TabNavProps>.
Callback receives (clickedItem, "tab-nav", completeIncomingProps).
When supplied, normal clicks are delegated to the caller, which owns navigation
and selection. Without a handler, anchors follow their paths normally. Modified
clicks retain native browser behavior. Enter activates the focused link.
className is appended to tab-nav on the nav wrapper.
container_class is applied to the nav; action_class to each anchor. Both default
to empty strings. Supply existing atoms or custom classes for skin.

Override styling through theme tokens, supplied class props, or parent/external CSS.
Tokens: --tab-nav-gap, --tab-nav-icon-gap, --tab-nav-action-padding.
Icon is decorative; label supplies the link's accessible name.
Demo owns selected state and shows an icon, text-only items, and supplied atoms.
