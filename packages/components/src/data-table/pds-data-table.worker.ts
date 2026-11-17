type Row = Record<string, string | number | boolean | null>;
type RequestMessage =
  | { type: "set-rows"; rows: Row[] }
  | { type: "query"; id: number; filter: string; sortKey: string; direction: "asc" | "desc" };
type ResponseMessage =
  | { type: "result"; id: number; rows: Row[]; total: number }
  | { type: "error"; id: number; message: string };

const MAX_ROWS = 50_000;
const MAX_FIELDS = 100;
const MAX_STRING_LENGTH = 8_192;
const MAX_FILTER_LENGTH = 256;
let rows: Row[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRow(value: unknown): value is Row {
  if (!isRecord(value)) return false;
  const fields = Object.entries(value);
  return fields.length > 0 && fields.length <= MAX_FIELDS && fields.every(([key, field]) =>
    /^[\w-]{1,80}$/.test(key) &&
    (field === null || typeof field === "boolean" ||
      (typeof field === "string" && field.length <= MAX_STRING_LENGTH) ||
      (typeof field === "number" && Number.isFinite(field)))
  );
}

function postError(id: number, message: string): void {
  const response: ResponseMessage = { type: "error", id, message };
  self.postMessage(response);
}

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  const message = event.data;
  if (!isRecord(message)) {
    postError(-1, "Invalid table worker request.");
    return;
  }

  if (message.type === "set-rows") {
    if (!Array.isArray(message.rows) || message.rows.length > MAX_ROWS || !message.rows.every(isRow)) {
      postError(-1, "Invalid table rows received by the worker.");
      return;
    }
    rows = message.rows;
    return;
  }

  if (message.type !== "query" || !Number.isSafeInteger(message.id) || (message.id as number) < 0 ||
      typeof message.filter !== "string" || message.filter.length > MAX_FILTER_LENGTH ||
      typeof message.sortKey !== "string" || !/^[\w-]{0,80}$/.test(message.sortKey) ||
      (message.direction !== "asc" && message.direction !== "desc")) {
    postError(Number.isSafeInteger(message.id) && (message.id as number) >= 0 ? message.id as number : -1,
      "Invalid table worker query.");
    return;
  }

  const query = message as RequestMessage & { type: "query" };
  try {
    const needle = query.filter.toLocaleLowerCase();
    const filtered = rows.filter(row => Object.values(row).some(value => String(value ?? "").toLocaleLowerCase().includes(needle)));
    filtered.sort((a, b) => {
      const left = a[query.sortKey];
      const right = b[query.sortKey];
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return query.direction === "asc" ? result : -result;
    });
    const response: ResponseMessage = { type: "result", id: query.id, rows: filtered.slice(0, 100), total: filtered.length };
    self.postMessage(response);
  } catch {
    postError(query.id, "Unable to process table rows.");
  }
});
