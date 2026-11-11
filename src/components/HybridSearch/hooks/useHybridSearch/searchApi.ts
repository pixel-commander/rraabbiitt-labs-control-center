import type { HouseKeys, PathsProps } from "../../../../HouseKeys.types";

export type SearchVote = "up" | "part" | "down";
export interface SearchRecord extends HouseKeys, PathsProps {
  id: number;
  name: string;
  record_key: string;
  instructions?: string;
  score?: number;
  ranking?: { rank: number; score: number; score_kind?: string };
}
export interface SearchResult {
  paths: SearchRecord[];
  return_type?: string;
  body?: string;
  mode?: string;
  feedback?: { record_key: string; field?: string; vote: SearchVote }[];
  summary?: { count?: number; total?: number };
}
const request = async <T>(path: string, settings: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const result = await response.json();
  if (!response.ok || result.status !== "complete")
    throw new Error(
      result.error ?? `Search request failed (${response.status}).`,
    );
  return { ...result.response, return_type: result.return_type } as T;
};
export const searchRecords = (query: string, message: number) =>
  request<SearchResult>("/api/search-records", { query, message });
export const saveSearchFeedback = (
  query: string,
  message: number,
  record: SearchRecord,
  vote: SearchVote,
) =>
  request<unknown>("/api/search-records/feedback", {
    query,
    message,
    id: record.id,
    path: record.record_key,
    name: "all",
    content: JSON.stringify({ vote }),
  });

export const saveSearchRephrase = (
  query: string,
  message: number,
  record: SearchRecord,
  source: { query: string; message: number; rank: number },
) =>
  request<unknown>("/api/search-records/rephrase", {
    query,
    message,
    id: record.id,
    path: record.record_key,
    name: "all",
    content: JSON.stringify({ vote: "up", rephrase: query, source }),
  });
