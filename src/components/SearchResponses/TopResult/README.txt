TopResult
=========

Composes component ID 1794404369434 for score, metadata, title, content and actions.
The outer grid has 5px side tracks, a 2px top track and a 3px bottom track.
Centered block pseudo-elements fill 50% of each side, 60% of the top and 20%
of the bottom. Corner cells are empty. The center uses pad-base.

result_type is top-result. title and children accept ReactNode.
name, type and id provide result metadata. score defaults to 0.
container_class defaults to container-main on the center card. An empty string
removes that skin. Legacy container_aton is used only when container_class is absent.
action_class defaults to action-outline for Rephrase. Hand buttons use the same
unoutlined controls as component ID 1794404369434.
color optionally overrides all four rails. className applies to the outer grid.
handleClick receives data, good-vote / ok-vote / bad-vote / rephrase, and the
complete original incoming TopResult props. Parent owns votes and saving.
The component does not use side. Theme tokens and parent CSS remain available.
The /style-guide demo labels this component and shows a custom rail color.

favorite defaults to false. The star at the footer right calls handleClick with
favorite and the complete props bag. Parent owns persistence and selected state.
All footer controls have shared tooltips.
