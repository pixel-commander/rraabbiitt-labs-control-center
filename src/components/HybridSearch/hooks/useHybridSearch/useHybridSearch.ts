import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMessageProvider } from "../../../MessageBox/hooks/useMessageProvider/useMessageProvider";
import type { VoteType } from "../../../SearchResponses/SearchResponses.types";
import type { ResponseAndRankingAction } from "../../../SearchResponses/ResponseAndRankingCard/ResponseAndRankingCard.types";
import { saveSearchMessage } from "./messagesApi";
import {
  searchRecords,
  saveSearchFeedback,
  saveSearchRephrase,
  type SearchRecord,
  type SearchResult,
  type SearchVote,
} from "./searchApi";

const votes: Record<VoteType, SearchVote> = {
  "good-vote": "up",
  "ok-vote": "part",
  "bad-vote": "down",
};
const voteTypes: Record<SearchVote, VoteType> = {
  up: "good-vote",
  part: "ok-vote",
  down: "bad-vote",
};
const savedVotes = (response: SearchResult) => {
  const result: Record<number, VoteType> = {};
  for (const record of response.paths) {
    const rows =
      response.feedback?.filter(
        (row) => row.record_key === record.record_key,
      ) ?? [];
    if (rows.length && rows.every((row) => row.vote === rows[0].vote))
      result[record.id] = voteTypes[rows[0].vote];
  }
  return result;
};

export const useHybridSearch = () => {
  const [searchState, setState] = useState({
    model: "Qwen3-Coder 30B",
    submitted: "",
    submitted_at: 0,
    messages: [] as {
      id: number;
      text: string;
      date: number;
      model: string;
      answer?: { text: string; date: number };
      failed?: boolean;
    }[],
    top_result: null as SearchRecord | null,
    skill_text: null as string | null,
    results: [] as SearchRecord[],
    feedback: {} as Record<number, VoteType>,
    searching: false,
    saving: false,
    rephrase: null as {
      record: SearchRecord;
      query: string;
      message: number;
      rank: number;
    } | null,
    mode: "hybrid",
    error: "",
    notice: "",
    notice_date: 0,
    vote: "",
    tools: true,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    persona:
      "Be a practical coding partner. Match my casual tone, stay useful, and answer the task directly.",
    saved: true,
  });
  const inFlight = useRef(false);
  const request = useRef(0);
  const draft = useRef("");
  const context = useRef<{ id: number; query: string } | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const provider = useMessageProvider({
    handleSubmit: (text) => {
      if (text) void submitMessage(text);
    },
  });

  async function submitMessage(text: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    draft.current = "";
    let submittedMessageId: number | undefined;
    let lessonSaved = false;
    const rephrase = searchState.rephrase;
    const version = ++request.current;
    setState((current) => ({
      ...current,
      searching: true,
      error: "",
      notice: "",
      top_result: null,
      skill_text: null,
      results: [],
      feedback: {},
    }));
    try {
      const saved = await saveSearchMessage(text);
      submittedMessageId = saved.id;
      if (version !== request.current) return;
      if (rephrase) {
        await saveSearchRephrase(saved.query, saved.id, rephrase.record, {
          query: rephrase.query,
          message: rephrase.message,
          rank: rephrase.rank,
        });
        lessonSaved = true;
        if (version !== request.current) return;
      }
      context.current = { id: saved.id, query: saved.query };
      setState((current) => ({
        ...current,
        submitted: saved.query,
        submitted_at: saved.date,
        messages: [
          ...current.messages,
          {
            id: saved.id,
            text: saved.query,
            date: saved.date,
            model: current.model,
          },
        ],
        rephrase: null,
        notice: "",
      }));
      const response = await searchRecords(saved.query, saved.id);
      if (version !== request.current) return;
      setState((current) => ({
        ...current,
        results: response.paths,
        top_result: response.paths[0] ?? null,
        feedback: savedVotes(response),
        mode: response.mode ?? "hybrid",
        skill_text:
          response.return_type === "skill" ? (response.body ?? "") : null,
        messages: current.messages.map((message) =>
          message.id === saved.id
            ? {
                ...message,
                answer: {
                  text: response.paths.length
                    ? "I found a top result."
                    : "I didn't find a result.",
                  date: Date.now(),
                },
              }
            : message,
        ),
        notice: "",
      }));
    } catch (error) {
      if (version === request.current) {
        if (!draft.current) provider.handleChange(text);
        setState((current) => ({
          ...current,
          error: `${lessonSaved ? "Rephrase lesson saved, but search failed: " : ""}${error instanceof Error ? error.message : String(error)}`,
          messages: current.messages.map((message) =>
            message.id === submittedMessageId
              ? { ...message, failed: true }
              : message,
          ),
          notice: "",
        }));
      }
    } finally {
      inFlight.current = false;
      if (version === request.current)
        setState((current) => ({ ...current, searching: false }));
    }
  }

  const handleClick = async (
    data: unknown,
    type?: ResponseAndRankingAction,
  ) => {
    const current = context.current;
    if (!current || inFlight.current || !type) return;
    const record = data as SearchRecord | undefined;
    if (
      !record ||
      !Number.isSafeInteger(record.id) ||
      typeof record.record_key !== "string"
    )
      return;
    if (type === "rephrase") {
      provider.handleChange(current.query);
      draft.current = current.query;
      setState((value) => ({
        ...value,
        rephrase: {
          record,
          ...current,
          message: current.id,
          rank: value.results.findIndex((item) => item.id === record.id) + 1,
        },
        notice:
          "Write a question that this selected result answers correctly. Submit to save and teach it.",
      }));
      return;
    }
    inFlight.current = true;
    const version = request.current;
    let lessonSaved = false;
    setState((value) => ({
      ...value,
      saving: true,
      error: "",
      notice: "Saving whole-result feedback…",
      notice_date: Date.now(),
    }));
    try {
      await saveSearchFeedback(current.query, current.id, record, votes[type]);
      lessonSaved = true;
      setState((value) => ({
        ...value,
        feedback: { ...value.feedback, [record.id]: type },
        notice: "Feedback saved · refreshing ranking…",
        notice_date: Date.now(),
      }));
      const response = await searchRecords(current.query, current.id);
      if (version !== request.current) return;
      setState((value) => ({
        ...value,
        results: response.paths,
        top_result: response.paths[0] ?? null,
        feedback: { ...value.feedback, ...savedVotes(response) },
        mode: response.mode ?? "hybrid",
        skill_text:
          response.return_type === "skill" ? (response.body ?? "") : null,
        notice: "Feedback saved · ranking refreshed.",
        notice_date: Date.now(),
      }));
    } catch (error) {
      if (version === request.current)
        setState((value) => ({
          ...value,
          error: `${lessonSaved ? "Feedback saved, but search failed: " : ""}${error instanceof Error ? error.message : String(error)}`,
          notice: "",
        }));
    } finally {
      inFlight.current = false;
      if (version === request.current)
        setState((value) => ({ ...value, saving: false }));
    }
  };
  const state = { ...searchState, query: provider.message };
  const handleChange = <K extends keyof typeof state>(
    key: K,
    value: (typeof state)[K],
  ) => {
    if (key === "query") {
      draft.current = value as string;
      provider.handleChange(value as string);
      return;
    }
    setState((current) => ({
      ...current,
      [key]: value,
      ...(key === "persona" ? { saved: false } : {}),
      ...(key === "rephrase" && value === null ? { notice: "" } : {}),
    }));
  };
  const handleReset = () => {
    if (inFlight.current) return;
    ++request.current;
    context.current = null;
    draft.current = "";
    nearBottomRef.current = true;
    provider.handleChange("");
    setState((current) => ({
      ...current,
      submitted: "",
      submitted_at: 0,
      messages: [],
      top_result: null,
      skill_text: null,
      results: [],
      feedback: {},
      rephrase: null,
      vote: "",
      error: "",
      notice: "",
    }));
  };
  const handleScroll = () => {
    const region = messagesRef.current;
    if (region)
      nearBottomRef.current =
        region.scrollHeight - region.clientHeight - region.scrollTop <= 48;
  };
  useLayoutEffect(() => {
    const region = messagesRef.current;
    if (region && nearBottomRef.current) region.scrollTop = region.scrollHeight;
  }, [state.messages, state.top_result, state.notice, state.error]);
  useEffect(() => {
    const region = messagesRef.current;
    if (!region || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) region.scrollTop = region.scrollHeight;
    });
    observer.observe(region);
    return () => observer.disconnect();
  }, []);
  useEffect(
    () => () => {
      ++request.current;
    },
    [],
  );
  return {
    state,
    message: provider.message,
    handleChange,
    handleSubmit: (...args: Parameters<typeof provider.handleSubmit>) => {
      if (!inFlight.current) provider.handleSubmit(...args);
    },
    handleClick,
    handleReset,
    messagesRef,
    handleScroll,
  };
};
