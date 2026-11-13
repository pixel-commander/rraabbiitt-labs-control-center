import { useEffect } from "react";

interface UseKeypressOptions {
  key: string;
  callback: (event: KeyboardEvent) => void;
}

export const useKeypress = ({ key, callback }: UseKeypressOptions) => {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === key) callback(event);
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [key, callback]);
};
