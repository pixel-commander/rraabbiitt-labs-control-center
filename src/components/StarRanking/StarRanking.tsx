import type { StarRankingProps } from "./StarRanking.types";
import "./css/star-ranking.css";
export const StarRanking = (props: StarRankingProps) => {
  const {
    criteria = [],
    scores = {},
    max = 5,
    disabled = false,
    readOnly = false,
    showTotal = true,
    className = "",
    title,
    children,
    handleChange,
  } = props;
  const limit = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 5;
  const score = (name: string) =>
    Number.isFinite(scores[name])
      ? Math.max(0, Math.min(limit, Math.floor(scores[name])))
      : 0;
  const total = criteria.reduce(
    (sum, criterion) => sum + score(criterion.name),
    0,
  );
  return (
    <div
      className={["star-ranking", className].filter(Boolean).join(" ")}
      aria-label={title ?? "Star ranking"}
    >
      <div>
        {criteria.map((criterion) => {
          const value = score(criterion.name);
          return (
            <div
              key={criterion.id ?? criterion.name}
              data-grid="side-right"
              data-gap="control"
              className="star-ranking__row"
            >
              <div data-area="main">
                <div>{criterion.title ?? criterion.name}</div>
              </div>
              <div data-area="side">
                <div
                  role="group"
                  aria-label={criterion.title ?? criterion.name}
                >
                  {Array.from({ length: limit }, (_, index) => {
                    const star = index + 1;
                    const active = star <= value;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`action-star${active ? " is-active" : ""}`}
                        aria-label={`${criterion.title ?? criterion.name}: ${star} of ${limit}`}
                        aria-pressed={active}
                        disabled={disabled || readOnly}
                        onClick={() => {
                          const next = value === star ? 0 : star;
                          handleChange?.(
                            {
                              criterion,
                              value: next,
                              total: total - value + next,
                            },
                            "star-ranking",
                            { ...props },
                          );
                        }}
                      >
                        <svg
                          className="star-ranking__icon"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M8 1.6l1.9 4 4.4.6-3.2 3 .8 4.3L8 11.5 4.1 13.5l.8-4.3-3.2-3 4.4-.6z"
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showTotal && (
        <div className="star-ranking__total" aria-live="polite">
          Total: {total} / {criteria.length * limit}
        </div>
      )}
      {children}
    </div>
  );
};
