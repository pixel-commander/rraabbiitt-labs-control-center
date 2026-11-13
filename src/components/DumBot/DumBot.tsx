import type { DumBotProps } from './DumBot.types';
import './css/dum-bot.css';

export const DumBot = ({
  children,
  className = "",
}: DumBotProps) => {
  className = `dum-bot ${className}`;
  return (
    <div className={className}>
      {children}
    </div>
  );
};
