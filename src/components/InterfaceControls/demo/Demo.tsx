import { InterfaceControls } from "../InterfaceControls";
import { ThreeDDial } from "../ThreeDDial/ThreeDDial";
import { ThreeDPressButton } from "../ThreeDPressButton/ThreeDPressButton";
import { ThreeDToggleButtons } from "../ThreeDToggleButtons/ThreeDToggleButtons";
import { useInterfaceControls } from "../hooks/useInterfaceControls/useInterfaceControls";
const SizeDemo = ({ size, label }: { size: string; label: string }) => {
  const { value, setValue, pressed, setPressed, mode, setMode } = useInterfaceControls();
  return (
    <div className="interface-controls-demo__row">
      <strong>{label} · {size}</strong>
      <InterfaceControls size={size}>
        <ThreeDDial label="Tone" value={value} handleChange={data => { if (data) setValue(data.value); }} />
        <ThreeDDial label="Level" dark value={value} handleChange={data => { if (data) setValue(data.value); }} />
        <ThreeDPressButton pressed={pressed} handleClick={data => { if (data) setPressed(data.pressed); }} />
        <ThreeDToggleButtons value={mode} handleClick={data => { if (data) setMode(data.value); }} />
      </InterfaceControls>
    </div>
  );
};
export const Demo = () => (
  <div className="demo container-demos interface-controls-demo">
    <SizeDemo size="0.6em" label="Large" />
    <SizeDemo size="0.45em" label="Medium" />
    <SizeDemo size="0.3em" label="Small" />
  </div>
);
