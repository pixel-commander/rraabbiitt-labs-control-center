import { useRef } from "react";
import { Tooltip } from "../Tooltip";
export const Demo = () => {
  const basic = useRef<HTMLButtonElement>(null);
  const skinned = useRef<HTMLButtonElement>(null);
  const disabled = useRef<HTMLButtonElement>(null);
  return (
    <div data-cols="3" data-collapse="2" data-gap="content">
      <button className="action-outline pad" type="button" ref={basic}>
        Default tooltip
      </button>
      <Tooltip targetRef={basic} title="Default tooltip" placement="above">
        <span>
          Shared SmartTooltip with <strong>React content</strong>.
        </span>
      </Tooltip>
      <button className="action-outline pad" type="button" ref={skinned}>
        Container tooltip
      </button>
      <Tooltip
        targetRef={skinned}
        container_class="container-alt"
        title="Container tooltip"
        placement="below"
      >
        This tooltip uses the container-alt atom.
      </Tooltip>
      <button className="action-outline pad" type="button" ref={disabled}>
        Tooltip disabled
      </button>
      <Tooltip targetRef={disabled} disabled content="This must not appear." />
    </div>
  );
};
export default Demo;
