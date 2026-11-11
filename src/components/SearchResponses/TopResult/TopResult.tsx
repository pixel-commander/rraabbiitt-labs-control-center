import type { CSSProperties } from "react";
import type { VoteType } from "../SearchResponses.types";
import type { TopResultProps } from "./TopResult.types";
import "./css/top-result.css";
export const TopResult = (props: TopResultProps) => {
  const {
    container_class = props.container_aton === undefined
      ? "container-side-rail"
      : props.container_aton,
    title,
    score,
    color,
    children,
    className = "",
  } = props;
  return (
    <article
      data-cols="1"
      className={[
        "top-result",
        "pad-base",
        "gap-base",
        container_class,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        color === undefined
          ? undefined
          : ({ "--container-side-rail-color": color } as CSSProperties)
      }
    >
      {(title !== undefined || score !== undefined) && (
        <header data-grid={score !== undefined ? "side-left" : undefined}
          data-cols={score === undefined ? "1" : undefined} data-gap="content"
          className="top-result-heading">
          {score !== undefined && (
            <div data-area="side" data-cols="1" className="top-result-score container-outline"
              aria-label={`Score ${score}`}>
              <strong>{score.toFixed(2)}</strong>
              <span>score</span>
            </div>
          )}
          {title !== undefined && <div data-area="main" className="top-result-title">{title}</div>}
        </header>
      )}
      <div className="top-result-content">{children}</div>
      <footer className="top-result-votes" aria-label="Rate response">
        {(
          [
            ["good-vote", "Good"],
            ["ok-vote", "OK"],
            ["bad-vote", "Bad"],
          ] as [VoteType, string][]
        ).map(([type, label]) => (
          <button
            type="button"
            className={["action-light", props.vote === type ? "is-active" : ""]
              .filter(Boolean)
              .join(" ")}
            key={type}
            disabled={props.disabled}
            aria-pressed={props.vote === type}
            onClick={() => props.handleClick?.(props.data, type, props)}
            aria-label={label + " response"}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="action-light"
          disabled={props.disabled}
          onClick={() => props.handleClick?.(props.data, "rephrase", props)}
        >
          Rephrase
        </button>
      </footer>
    </article>
  );
};
