StatusLabel extends HouseKeys. label is ReactNode; status_color and label_color are optional CSS colors. Columns are 20px 1fr, vertically centered and left aligned.
status accepts success, warn, error or waiting. The default is success.
When status_color is falsy, the wrapper gets a status modifier class.
waiting maps to status-waiting. Other values map to status-success, status-warn and status-error.
The component CSS uses theme status tokens for the dot and label defaults.
A supplied status_color suppresses the modifier. label_color overrides the label color.
Override through theme tokens, incoming className or parent CSS. No custom props are spread to DOM. No I/O or internal business state.
