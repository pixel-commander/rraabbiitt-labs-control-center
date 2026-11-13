import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useRabbit } from "./useRabbit";
import type { UseRabbitProps } from "./useRabbit";

const RabbitContext = createContext<ReturnType<typeof useRabbit> | null>(null);

export const RabbitProvider = ({ children, ...props }: UseRabbitProps & { children: ReactNode }) => {
  const rabbit = useRabbit(props);
  return <RabbitContext.Provider value={rabbit}>{children}</RabbitContext.Provider>;
};

export const useOptionalRabbitContext = () => { return useContext(RabbitContext); };

/** Access the shell head rather than creating an independent head controller. */
export const useRabbitContext = () => {
  const rabbit = useContext(RabbitContext);
  if (rabbit === null) throw new Error("useRabbitContext requires RabbitProvider.");
  return rabbit;
};
