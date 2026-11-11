import { useState } from "react";
import type { MessageProviderProps } from "./useMessageProvider.types";

export const useMessageProvider = (props: MessageProviderProps) => {
  const [draft, setDraft] = useState("");
  const message = props.value === undefined ? draft : props.value;
  const handleChange: NonNullable<MessageProviderProps["handleChange"]> = (
    data,
    type = "message-box",
    bag = props,
  ) => {
    const next = data === undefined ? "" : data;
    if (props.value === undefined) setDraft(next);
    props.handleChange?.(next, type, bag);
  };
  const handleSubmit: MessageProviderProps["handleSubmit"] = (
    data,
    type = "message-box",
    bag = props,
  ) => {
    const text = (data === undefined ? message : data).trim();
    if (!text) return;
    props.handleSubmit(text, type, bag);
    if (props.value === undefined) setDraft("");
  };
  return { message, handleChange, handleSubmit };
};
