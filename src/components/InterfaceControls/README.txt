InterfaceControls
=================
Scaffolded with new-react-component; children scaffolded with new-react-subcomponent.
Styles adapted from hardware-panel.html, scoped to these components. No global
body styles are installed. Physical dimensions, gaps, padding, radii and shadows
use em. size sets font-size (for example "0.6em", "0.8em", "1em").

Children can be used independently; each imports the shared material variables.
ThreeDDial: controlled value 0–100; handleChange({value}, "dial", props).
Supports vertical pointer drag, Shift fine drag, wheel, arrows, Home and End.
ThreeDPressButton: controlled pressed; handleClick({pressed}, "press-button", props).
Supports stadium and round shapes. Lamp, lit housing and aria-pressed follow pressed.
ThreeDToggleButtons: controlled value; handleClick({value}, "toggle-buttons", props).
Options are {name,label}; defaults to mono/stereo. All controls support disabled.

Use React names ThreeDDial, ThreeDPressButton and ThreeDToggleButtons because
JavaScript identifiers cannot begin with a digit.

Style guide: /style-guide#interface-controls. Demo shows three sizes.
