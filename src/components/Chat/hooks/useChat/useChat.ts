import { useEffect, useLayoutEffect, useRef } from "react";
import type { UIEvent } from "react";
import type { ChatMessage } from "../../Chat.types";
import { dragScroll } from "../../../../js/drag-scroll/drag-scroll.js";

export const useChat = (messages: ChatMessage[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  useEffect(() => dragScroll(scrollRef), []);
  useLayoutEffect(() => {
    if (follow.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    follow.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 24;
  };
  return { scrollRef, onScroll };
};
