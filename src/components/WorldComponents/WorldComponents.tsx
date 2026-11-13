import type { WorldComponentsProps } from './WorldComponents.types';
import './css/world-components.css';
import { RefreshSystemButton } from "./RefreshSystemButton/RefreshSystemButton";
import { RescanWorldStatusWindow } from "./RefreshSystemButton/RescanWorldStatusWindow/RescanWorldStatusWindow";
import { useWorldComponents } from "./hooks/useWorldComponents/useWorldComponents";

export const WorldComponents = ({
  children,
  className = "",
}: WorldComponentsProps) => {
  const state = useWorldComponents();
  className = `world-components ${className}`;
  return (
    <div className={className}>
      <RefreshSystemButton status={state.status} message={state.message} handleClick={state.handleClick}>
        <RescanWorldStatusWindow status={state.status} message={state.message} report={state.report} container_class="" />
      </RefreshSystemButton>
      {children}
    </div>
  );
};
