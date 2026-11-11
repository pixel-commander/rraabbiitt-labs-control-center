import "./css/response-and-ranking-card.css";
import type {
  ResponseAndRankingAction,
  ResponseAndRankingCardProps,
} from "./ResponseAndRankingCard.types";

const actions: {
  type: ResponseAndRankingAction;
  label: string;
  content: string;
}[] = [
  { type: "good-vote", label: "Good response", content: "👍" },
  { type: "ok-vote", label: "OK response", content: "👌" },
  { type: "bad-vote", label: "Bad response", content: "👎" },
  { type: "rephrase", label: "Rephrase", content: "Rephrase" },
];

export const ResponseAndRankingCard = (props: ResponseAndRankingCardProps) => {
  const {
    score = 0,
    name,
    type,
    id,
    title = name,
    action_class = "action-outline",
    className = "",
  } = props;

  console.log({props})
  return (
    <article
      className={[
        "response-and-ranking-card",
        "container-side-rail",
        "pad-base",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-cols="1"
      data-gap="content"
    >
      <div data-area="main" data-grid="main-footer" data-gap="content">
        <header
          data-area="main"
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
                {type} | {name}
              </span>
              {id !== undefined && <span> | id: {id}</span>}
            </div>
            <div className="response-and-ranking-card-title">{title}</div>
          </div>
        </header>
        <footer
          data-area="footer"
          data-gap="control"
          className="response-and-ranking-card-actions"
          aria-label="Response actions"
        >
          {actions.map(({ type, label, content }) => (
            <button
              key={type}
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
          ))}
        </footer>
      </div>
    </article>
  );
};
