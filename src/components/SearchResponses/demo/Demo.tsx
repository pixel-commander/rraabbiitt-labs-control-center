import { useState } from "react";
import { SearchResponses } from "../SearchResponses";
import { ResponseAndRankingCard } from "../ResponseAndRankingCard/ResponseAndRankingCard";
export const Demo = () => {
  const [favorite, setFavorite] = useState(false);
  const [vote, setVote] = useState("No vote yet");
  return (
    <>
      <h3>ResponseAndRankingCard</h3>
      <div style={{ maxInlineSize: "32rem" }}>
        <ResponseAndRankingCard
          rank={1}
          name="inspect-ranking-attention"
          id={1793225821360}
          title="inspect-ranking-attention"
          score={0.08}
          data={{ name: "ranking-demo" }}
          favorite={favorite}
          handleClick={(_, type) => type === "favorite" ? setFavorite(value => !value) : setVote(type ?? "")}
        />
      </div>
      <h3>TopResult</h3>
      <SearchResponses
        result_type="top-result"
        name="search-world"
        type="tool"
        score={0.92}
        title="QWEN3-CODER 30B"
        data={{ name: "demo" }}
        favorite={favorite}
          handleClick={(_, type) => type === "favorite" ? setFavorite(value => !value) : setVote(type ?? "")}
      >
        The current world settings have been retrieved.
      </SearchResponses>
      <output aria-live="polite">{vote}</output>
      <SearchResponses
        result_type="top-result"
        title={<strong>Custom rail color</strong>}
        color="var(--status-error)"
        data={{ name: "rail-override" }}
        favorite={favorite}
          handleClick={(_, type) => type === "favorite" ? setFavorite(value => !value) : setVote(type ?? "")}
      >
        The optional color overrides the rail using a theme token.
      </SearchResponses>
      <SearchResponses
        result_type="search-response"
        side="left"
        date={Date.UTC(2026, 10, 11, 11, 29)}
        title="Model"
        Footer={<span>Model footer</span>}
      >
        A left-side model response.
      </SearchResponses>
      <SearchResponses
        result_type="search-response"
        side="right"
        date={Date.UTC(2026, 10, 11, 11, 30)}
        Footer={<span>User footer</span>}
      >
        A right-side user message.
      </SearchResponses>
    </>
  );
};
export default Demo;
