import { RabbitHead } from "../RabbitHead/RabbitHead";
import { SearchMessageBox } from "./SearchMessageBox/SearchMessageBox";
import { Fragment } from "react";
import { SearchResponseBubble } from "./SearchResponseBubble/SearchResponseBubble";
import {
  ModelTile,
  StatusLabel,
  PageHeader,
  IconButton,
} from "../UiElements/UiElements";
import { SearchResponses } from "../SearchResponses/SearchResponses";
import { ResponseAndRankingCard } from "../SearchResponses/ResponseAndRankingCard/ResponseAndRankingCard";
import { ToolCol } from "../../pages/WorldSearch/ToolCol/ToolCol";
import { useHybridSearch } from "./hooks/useHybridSearch/useHybridSearch";
import "../../pages/WorldSearch/css/world-search.css";
import "./css/hybrid-search.css";
import type { HybridSearchProps } from "./HybridSearch.types";
export const HybridSearch = (props: HybridSearchProps) => {
  const isDumbot = props.mode === "dumbot";
  const {
    state,
    handleChange,
    handleSubmit,
    handleClick,
    handleReset,
    handleRephrase,
    messagesRef,
    handleScroll,
    handleSelect,
  } = useHybridSearch(props);
  return (
    <div
      className={["hybrid-search world-search", props.className].filter(Boolean).join(" ")}
      data-grid="header-main"
      data-gap="section"
    >
      {!isDumbot && <div className="world-search-background" aria-hidden="true">
        <RabbitHead transparentBg interactive={false} followMouse autoMotion={false} wheelZoom={false} zoom={2} panX={0.75} panY={-0.45} />
      </div>}
      <div data-area="header">
        <PageHeader
          className="world-search-heading"
          label={isDumbot ? "LOCAL INTELLIGENCE / DUMBOT" : "LOCAL INTELLIGENCE / WORLD SEARCH"}
          Headline={<h1>{isDumbot ? "DumBot" : "World Search"}</h1>}
          Right={
            <>
              <StatusLabel
                status={state.error ? "error" : "success"}
                label={state.mode.toUpperCase()}
              />
              <p className="world-search-muted">LOCAL / DATABASE SEARCH</p>
            </>
          }
        />
      </div>
      <div
        data-area="main"
        data-grid="side-cols"
        data-gap="container"
        className="world-search-columns"
      >
        {isDumbot ? (
          <aside data-area="left" className="dum-bot-placeholder" aria-label="DumBot placeholder" data-cols="1" data-rows="1">
            <RabbitHead transparentBg interactive={false} followMouse autoMotion={false} wheelZoom={false} zoom={1.25} panX={0} panY={0.1} />
          </aside>
        ) : (<aside
          data-area="left"
          className="container-main world-search-panel world-search-models pad-xs"
          data-cols="1"
        >
          <div className="pad-xs scroll-y">
            <h2>MODEL MATRIX / LOCAL</h2>
            <div className="world-search-model-list" data-cols="1">
              {(isDumbot ? ["DumBot"] : ["Qwen3-Coder 30B", "qwen2.5:14b", "rraabbiitt:latest"]).map(
                (model) => (
                  <button
                    key={model}
                    type="button"
                    className={[
                      "action-ghost",
                      "world-search-model",
                      state.model === model ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={state.model === model}
                    onClick={() => handleChange("model", model)}
                  >
                    <ModelTile title={model} label={isDumbot ? "DB PAIRS / SLOTS" : "OLLAMA / DEMO"} />
                  </button>
                ),
              )}
              {!isDumbot && <button
                type="button"
                className="action-ghost world-search-model"
                disabled
              >
                <ModelTile
                  title="Hermes 4 14B"
                  label="UNAVAILABLE"
                  status_color="var(--color-muted)"
                  label_color="var(--color-muted)"
                />
              </button>}
            </div>
            <IconButton
              type="add"
              action_atom="action-outline"
              className="world-search-new"
              handleClick={handleReset}
            >
              New search
            </IconButton>
          </div>
          <section className="world-search-return" data-grid="header-main" aria-label="Full search return">
            <h2 data-area="header">Search return</h2>
            <div data-area="main" className="scroll-y" tabIndex={0}>
              <pre className="world-search-return-json">{state.raw_return == null
                ? "Submit a search to view its return."
                : JSON.stringify(state.raw_return, null, 2)}</pre>
            </div>
          </section>
        </aside>)}
        <section
          data-area="main"
          className="world-search-panel world-search-conversation"
          data-grid={isDumbot ? "main-footer" : "shell"}
          data-gap="section"
          aria-label={isDumbot ? "DumBot conversation" : "World Search conversation"}
        >
          {!isDumbot && <header data-area="header" className="world-search-result-header">
            {state.top_result && (
              <SearchResponses
                result_type="top-result"
                show_actions={!isDumbot}
                className="world-search-current-result"
                id={state.top_result.id}
                name={state.top_result.name}
                type={state.top_result.type}
                title={state.top_result.title}
                score={state.top_result.ranking?.score ?? state.top_result.score ?? 0}
                data={state.top_result}
                handleClick={handleClick}
                disabled={state.searching || state.saving || state.favorites_loading}
                vote={state.feedback[state.top_result.id]}
                favorite={state.favorites[state.top_result.id] ?? false}
              >
                {state.skill_text !== null ? (
                  <pre className="world-search-skill-instructions">
                    {state.skill_text}
                  </pre>
                ) : (
                  state.top_result.description
                )}
              </SearchResponses>
            )}
          </header>}
          <div data-area="main" className="world-search-messages">
            <div
              className="world-search-messages-scroll scroll-y"
              ref={messagesRef}
              onScroll={handleScroll}
            >
              {state.messages.map((message) => (
                <Fragment key={message.id}>
                  <SearchResponseBubble side="right" date={message.date}>
                    {message.text}
                  </SearchResponseBubble>
                  <SearchResponseBubble
                    side="left"
                    title={message.model}
                    date={message.date}
                    status={message.answer ? "read" : "sent"}
                  >
                    {message.failed ? "Search failed." : "Searching…"}
                  </SearchResponseBubble>
                  {message.answer && (
                    <SearchResponseBubble
                      side="left"
                      title={message.model}
                      date={message.answer.date}
                      status="read"
                    >
                      {message.answer.text}
                    </SearchResponseBubble>
                  )}
                </Fragment>
              ))}
              {state.error && (
                <p role="alert" className="world-search-error">
                  {state.error}
                </p>
              )}
              {state.notice && (
                <SearchResponseBubble
                  side="left"
                  title={state.model}
                  date={state.notice_date || state.submitted_at}
                  status={state.saving ? "sent" : "read"}
                >
                  <span role="status" aria-live="polite">
                    {state.notice}
                  </span>
                </SearchResponseBubble>
              )}
            </div>
          </div>
          <footer
            data-area="footer"
            data-cols="1"
            className="world-search-conversation-footer"
          >
            <SearchMessageBox
              title={
                state.rephrase
                  ? "Question for selected result"
                  : "Search your world"
              }
              place_holder={
                state.rephrase
                  ? "Write a question this result answers correctly…"
                  : undefined
              }
              value={state.query}
              handleChange={(text) => handleChange("query", text ?? "")}
              handleSubmit={handleSubmit}
              handleClick={isDumbot ? handleRephrase : undefined}
            >
              {isDumbot && <button type="button" className="action-outline" disabled={state.searching} onClick={handleReset}>New search</button>}
              {state.rephrase && (
                <div data-cols="1" data-gap="control">
                  <span>
                    Teach:{" "}
                    {state.rephrase.record.title ?? state.rephrase.record.name}
                  </span>
                  <button
                    type="button"
                    className="action-text-link"
                    disabled={state.searching}
                    onClick={() => handleChange("rephrase", null)}
                  >
                    Cancel rephrase
                  </button>
                </div>
              )}
              <button
                type="button"
                className="action-light world-search-tools"
                aria-pressed={state.tools}
                onClick={() => handleChange("tools", !state.tools)}
              >
                ⌁ Tools {state.tools ? "on" : "off"}
              </button>
            </SearchMessageBox>
          </footer>
        </section>
        <ToolCol is_open className="world-search-tool-col">
          <div
            className="world-search-tool-tiles pad-xs"
            data-cols="1"
            data-gap="content"
          >
            <h2>{isDumbot ? "SEARCH RETURN" : "OTHER RANKED RESULTS"}</h2>
            {isDumbot && <details className="dum-bot-raw-return">
              <summary>Full return</summary>
              <pre className="world-search-return-json">{state.raw_return == null ? "Submit a search to view its return." : JSON.stringify(state.raw_return, null, 2)}</pre>
            </details>}
            {(isDumbot ? state.results : state.results.slice(1)).map((record, index) => (
              <ResponseAndRankingCard
                key={record.id}
                show_actions={!isDumbot}
                id={record.id}
                name={record.name}
                type={record.type}
                title={record.title ?? record.name}
                rank={record.ranking?.rank ?? index + 2}
                score={record.ranking?.score ?? record.score ?? 0}
                data={record}
                handleClick={handleClick}
                disabled={state.searching || state.saving || state.favorites_loading}
                vote={state.feedback[record.id]}
                favorite={state.favorites[record.id] ?? false}
              >
                {isDumbot && <><p>{record.description}</p><button className="action-outline" disabled={state.searching} onClick={() => void handleSelect(record)}>Select result</button></>}
              </ResponseAndRankingCard>
            ))}
            {!state.searching && state.results.length < 2 && (
              <p className="world-search-muted">
                Remaining results appear here after a search.
              </p>
            )}
          </div>
        </ToolCol>
      </div>
    </div>
  );
};
