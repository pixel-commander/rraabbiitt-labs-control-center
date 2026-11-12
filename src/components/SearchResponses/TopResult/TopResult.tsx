import type { CSSProperties } from "react";
import { ResponseAndRankingCard } from "../ResponseAndRankingCard/ResponseAndRankingCard";
import type { TopResultProps } from "./TopResult.types";
import "./css/top-result.css";

export const TopResult = (props: TopResultProps) => {
  const {
    container_class = props.container_aton === undefined
      ? "container-main"
      : props.container_aton,
    color,
    className = "",
  } = props;

  return (
    <article
      className={["top-result", className].filter(Boolean).join(" ")}
      style={color === undefined ? undefined : (
        { "--container-side-rail-color": color } as CSSProperties
      )}
    >
      <div className="top-result-rail top-result-rail-top" aria-hidden="true" />
      <div className="top-result-rail top-result-rail-left" aria-hidden="true" />
      <ResponseAndRankingCard
        {...props}
        container_class={container_class}
        className="top-result-main"
        handleClick={(data, type) => props.handleClick?.(data, type, props)}
      />
      <div className="top-result-rail top-result-rail-right" aria-hidden="true" />
      <div className="top-result-rail top-result-rail-bottom" aria-hidden="true" />
    </article>
  );
};
