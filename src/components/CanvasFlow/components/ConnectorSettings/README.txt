Pass the current edge. ConnectorSettings emits an updated edge through handleChange
and requests deletion through handleClick. Both callbacks receive the full props bag.
className adds caller styling. The caller owns the edge and panel placement.
Route and Effect each show sliders below their dropdown when the selection
has tuning options. Values are stored on the edge in routeSettings and
effectSettings. Changing a route or effect resets its tuning to defaults.
