import { createRef, Fragment, useRef } from "react";
import { Tooltip } from "../../Tooltip/Tooltip";
import { ICONS, ICON_TYPES } from "../../UiElements/IconButton/IconButton";
import "./css/response-and-ranking-card.css";
import type {
  ResponseAndRankingAction,
  ResponseAndRankingCardProps,
} from "./ResponseAndRankingCard.types";

const actions: {
  type: ResponseAndRankingAction;
  label: string;
  content: string;
  tooltip: string;
}[] = [
  { type: "good-vote", label: "Good response", tooltip: "Correct answer for your message. Save positive feedback to rank this result higher for similar questions.", content: "👍" },
  { type: "ok-vote", label: "OK response", tooltip: "Partly correct for your message. Save partial-match feedback and refresh the ranking.", content: "👌" },
  { type: "bad-vote", label: "Bad response", tooltip: "Wrong answer for your message. Save negative feedback to rank this result lower for similar questions.", content: "👎" },
  { type: "rephrase", label: "Rephrase", tooltip: "Edit your question so this result is the correct answer. Submit it to save a new message and positive feedback for this result.", content: "Rephrase" },
];

export const ResponseAndRankingCard = (props: ResponseAndRankingCardProps) => {
  const {
    score = 0,
    name,
    type,
    id,
    title = name,
    action_class = "action-outline",
    container_class = "container-side-rail",
    children,
    favorite = false,
    className = "",
  } = props;

  const targets = useRef({
    "good-vote": createRef<HTMLButtonElement>(),
    "ok-vote": createRef<HTMLButtonElement>(),
    "bad-vote": createRef<HTMLButtonElement>(),
    rephrase: createRef<HTMLButtonElement>(),
    favorite: createRef<HTMLButtonElement>(),
  }).current;
  const favoriteLabel = favorite ? "Remove from favorites" : "Add to favorites";
  const typeIcon = type !== undefined && Object.hasOwn(ICONS, type)
    ? ICONS[type as keyof typeof ICONS]
    : undefined;
  return (
    <article
      className={[
        "response-and-ranking-card",
        "effect-float",
        container_class,
        "--bg-filter",
        "pad-base",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-cols="1"
      data-gap="content"
    >
      <div data-cols="1" data-gap="content">
        <header
          data-grid="side-left"
          data-gap="content"
          className="response-and-ranking-card-heading"
        >
          <div
            data-area="side"
            data-cols="1"
            className="response-and-ranking-card-score container-outline"
            aria-label={`Score ${score}`}
          >
            <strong>{score.toFixed(2)}</strong>
            <span>score</span>
          </div>
          <div data-area="main" data-cols="1" data-gap="control">
            <div className="response-and-ranking-card-meta">
              <span className="response-and-ranking-card-name">
                {typeIcon && <span className="response-and-ranking-card-type-icon" aria-hidden="true">{typeIcon}</span>}
                {type}{type !== undefined && name !== undefined ? " | " : ""}{name}
              </span>
              {id !== undefined && <span> | id: {id}</span>}
            </div>
            <div className="response-and-ranking-card-title">{title}</div>
          </div>
        </header>
        {children !== undefined && (
          <div className="response-and-ranking-card-content">{children}</div>
        )}
        <footer
          data-grid="side-right"
          data-gap="control"
          className="response-and-ranking-card-actions"
          aria-label="Response actions"
        >
          <div data-area="main" className="response-and-ranking-card-votes" data-gap="control">
          {actions.map(({ type, label, content, tooltip }) => (
            <Fragment key={type}>
            <button
              ref={targets[type]}
              type="button"
              className={[
                type === "rephrase"
                  ? action_class
                  : "response-and-ranking-card-vote",
                props.vote === type ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={props.disabled}
              aria-pressed={
                type === "rephrase" ? undefined : props.vote === type
              }
              aria-label={label}
              onClick={() => props.handleClick?.(props.data, type, props)}
            >
              {content}
            </button>
            <Tooltip targetRef={targets[type]} title={label} content={tooltip} placement="above" className="ranking-tooltip effect-float" />
            </Fragment>
          ))}
          </div>
          <button
            ref={targets.favorite}
            data-area="side"
            type="button"
            className={["response-and-ranking-card-vote", "response-and-ranking-card-favorite", favorite ? "is-selected" : ""].filter(Boolean).join(" ")}
            aria-label={favoriteLabel}
            aria-pressed={favorite}
            disabled={props.disabled}
            onClick={() => props.handleClick?.(props.data, "favorite", props)}
          >
            {ICON_TYPES.favorite}
          </button>
          <Tooltip targetRef={targets.favorite} content={favorite ? "Remove from favorites list" : "Add to favorites list"} placement="above" />
        </footer>
      </div>
    </article>
  );
};
