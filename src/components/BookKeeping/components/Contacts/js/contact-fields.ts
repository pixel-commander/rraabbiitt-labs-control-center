export const fields = ["label", "name", "phones", "email", "website", "address", "tags", "color", "icon", "description"] as const;
export const list = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map((part) => part.trim()).filter(Boolean);


