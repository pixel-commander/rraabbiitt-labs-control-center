import type { HouseIdProps } from "../../../../HouseKeys.types";

export interface MessageRecord {
  id: HouseIdProps;
  name: string | null;
  title: string | null;
  type: string | null;
  description: string | null;
  tags: unknown[] | null;
  file: string | null;
  path: string | null;
  paths: unknown[] | null;
}

type MessageFields = Partial<Omit<MessageRecord, "id">>;

const requestMessage = async (
  action: "set" | "get" | "edit" | "delete",
  id: HouseIdProps,
  fields: MessageFields = {},
): Promise<MessageRecord | { id: HouseIdProps }> => {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A positive numeric message ID is required.");
  }
  const method = { set: "POST", get: "GET", edit: "PATCH", delete: "DELETE" }[action];
  const hasBody = action === "set" || action === "edit";
  const response = await fetch(
    `/api/messages/${action}${hasBody ? "" : `?id=${id}`}`,
    {
      method,
      ...(hasBody
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, id }) }
        : {}),
    },
  );
  const result = await response.json();
  if (!response.ok || result.status !== "complete") {
    throw new Error(result.error ?? `Message ${action} failed (${response.status}).`);
  }
  if (!result.response || result.response.id !== id) {
    throw new Error("The message API returned a different or missing ID.");
  }
  return result.response;
};

/** Call once on submission. Keep the returned ID with search and feedback. */
export const saveSearchMessage = async (message: string, id: HouseIdProps = Date.now()) => {
  const query = message.trim();
  if (!query) throw new Error("Message text is required.");
  const record = await requestMessage("set", id, { type: "user", description: query }) as MessageRecord;
  return { id: record.id, query: record.description ?? query, date: id, record };
};

export const getSearchMessage = async (id: HouseIdProps) => {
  return await requestMessage("get", id) as MessageRecord;
};

export const editSearchMessage = async (id: HouseIdProps, fields: MessageFields) => {
  return await requestMessage("edit", id, fields) as MessageRecord;
};

export const deleteSearchMessage = async (id: HouseIdProps) => {
  return await requestMessage("delete", id) as { id: HouseIdProps };
};
