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
  raw_return?: unknown;
  reply?: string;
  contract?: { id: number; values: Record<string, unknown>; next: string | null; phase?: "filling" | "confirming" | "confirmed" | "cancelled" | "complete" | "failed"; token?: string; action?: string; type?: string };
  paths: SearchRecord[];
  return_type?: string;
  body?: string;
  mode?: string;
  feedback?: { record_key: string; field?: string; vote: SearchVote }[];
  summary?: { count?: number; total?: number };
}
const request = async <T>(path: string, settings: unknown, includeRaw = false): Promise<T> => {
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
  return { ...result.response, return_type: result.return_type, ...(includeRaw ? { raw_return: result } : {}) } as T;
};
export const searchDumbot = (query: string, message: number, contract?: unknown, select?: number) =>
  request<SearchResult>("/api/search-records/dumbot", { query, message, contract, select }, true);
export const searchRecords = (query: string, message: number) =>
  request<SearchResult>("/api/search-records", { query, message }, true);
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

export const getFavorites = async (): Promise<number[]> => {
  const response = await fetch("/api/favorites/get");
  const result = await response.json();
  if (!response.ok || result.status !== "complete") throw Error(result.error ?? "Cannot load favorites.");
  return result.response.paths.map((row: {id: number}) => row.id);
};
export const saveFavorite = async (id: number, favorite: boolean) => {
  const response = await fetch(favorite ? "/api/favorites/set" : `/api/favorites/delete?id=${id}`, {
    method: favorite ? "POST" : "DELETE",
    ...(favorite ? {headers: {"Content-Type": "application/json"}, body: JSON.stringify({id})} : {}),
  });
  const result = await response.json();
  if (!response.ok || result.status !== "complete") throw Error(result.error ?? "Cannot save favorite.");
  return result.response as {id: number; favorite: boolean};
};
