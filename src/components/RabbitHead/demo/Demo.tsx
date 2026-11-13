import { RabbitControls } from "../RabbitControls/RabbitControls";
import { useRabbitContext } from "../hooks/useRabbit/RabbitProvider";
export const Demo = () => {
  const state = useRabbitContext();
  return (
    <div className="rabbit-head-demo container-outline">
      <p>These controls update the shared shell head.</p>
      {!state.open && <button className="rabbit-head-demo-open action-outline" type="button" onClick={() => state.setOpen(true)}>Rabbit controls</button>}
      <RabbitControls />
    </div>
  );
};
