type Row = Record<string, string | number | boolean | null>;
type WorkerRequest = { type: "set-rows"; rows: Row[] } | { type: "query"; id: number; filter: string; sortKey: string; direction: "asc" | "desc" };
type WorkerResponse = { type: "result"; id: number; rows: Row[]; total: number } | { type: "error"; id: number; message: string };
const MAX_ROWS = 50_000;
const MAX_FIELDS = 100;
const MAX_STRING_LENGTH = 8_192;
const MAX_LINE_LENGTH = 64 * 1_024;
const MAX_FILTER_LENGTH = 256;

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

function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!isRecord(value)) return false;
  if (value.type === "error") {
    return Number.isSafeInteger(value.id) && typeof value.message === "string" && value.message.length <= 500;
  }
  return value.type === "result" && Number.isSafeInteger(value.id) && (value.id as number) >= 0 &&
    Number.isSafeInteger(value.total) && (value.total as number) >= 0 &&
    Array.isArray(value.rows) && value.rows.length <= 100 && value.rows.every(isRow) &&
    (value.total as number) >= value.rows.length;
}

const styles = new CSSStyleSheet();
styles.replaceSync(`:host{display:block;color:var(--pds-text,#0f172a);font:inherit}.toolbar{display:flex;gap:.5rem;align-items:center;margin-bottom:.75rem}input,button{font:inherit;padding:.45rem .65rem;border:1px solid var(--pds-border,#cbd5e1);border-radius:.35rem;background:var(--pds-surface,#fff);color:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:2px solid var(--pds-focus-ring,#4f46e5);outline-offset:2px}.viewport{min-height:20rem;max-height:32rem;overflow:auto;border:1px solid var(--pds-border,#cbd5e1);border-radius:.5rem}table{border-collapse:collapse;width:100%;text-align:left}th,td{padding:.65rem .8rem;border-bottom:1px solid var(--pds-border,#cbd5e1);white-space:nowrap}th{background:var(--pds-surface,#f8fafc)}th button{border:0;padding:0;background:transparent;font-weight:700}.row-link{border:0;padding:0;background:transparent;color:var(--pds-link,var(--pds-primary,#4f46e5));font-weight:650;text-decoration:underline;text-underline-offset:2px}tbody tr:last-child td{border-bottom:0}.status{min-height:1.5em;color:var(--pds-text-muted,#64748b)}`);

export class PdsDataTable extends HTMLElement {
  static observedAttributes = ["src"];
  private root: ShadowRoot; private body: HTMLTableSectionElement; private head: HTMLTableSectionElement; private status: HTMLParagraphElement; private filterInput: HTMLInputElement; private worker: Worker | undefined; private controller: AbortController | undefined; private rows: Row[] = []; private columns: string[] = []; private sortKey = ""; private direction: "asc" | "desc" = "asc"; private queryId = 0;
  constructor() {
    super(); this.root = this.attachShadow({ mode: "open" }); this.root.adoptedStyleSheets = [styles];
    const toolbar = document.createElement("div"); toolbar.className = "toolbar";
    this.filterInput = document.createElement("input"); this.filterInput.type = "search"; this.filterInput.placeholder = "Filter rows"; this.filterInput.maxLength = MAX_FILTER_LENGTH; this.filterInput.setAttribute("aria-label", "Filter table rows"); this.filterInput.addEventListener("input", () => this.query());
    const load = document.createElement("button"); load.type = "button"; load.textContent = "Load data"; load.addEventListener("click", () => void this.load());
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "Cancel"; cancel.addEventListener("click", () => this.cancel());
    toolbar.append(this.filterInput, load, cancel);
    this.status = document.createElement("p"); this.status.className = "status"; this.status.setAttribute("role", "status");
    const viewport = document.createElement("div"); viewport.className = "viewport"; const table = document.createElement("table"); table.setAttribute("part", "table"); this.head = document.createElement("thead"); this.body = document.createElement("tbody"); table.append(this.head, this.body); viewport.append(table); this.root.append(toolbar, this.status, viewport);
  }
  connectedCallback(): void { this.ensureWorker(); if (this.hasAttribute("src")) void this.load(); }
  attributeChangedCallback(): void { if (this.isConnected && this.hasAttribute("src")) void this.load(); }
  disconnectedCallback(): void { this.cancel(); this.worker?.terminate(); this.worker = undefined; }
  private ensureWorker(): void { if (this.worker) return; try { this.worker = new Worker(new URL("./pds-data-table.worker.js", import.meta.url), { type: "module" }); this.worker.addEventListener("message", (event: MessageEvent<unknown>) => this.onWorkerMessage(event.data)); this.worker.addEventListener("error", () => { this.status.textContent = "Table worker failed. Reload the data to try again."; this.worker?.terminate(); this.worker = undefined; }); } catch { this.status.textContent = "This browser could not start the table worker."; } }
  async load(): Promise<void> {
    const src = this.getAttribute("src"); if (!src) { this.status.textContent = "Set a src URL to load newline-delimited JSON."; return; }
    let endpoint: URL;
    try { endpoint = new URL(src, document.baseURI); } catch { this.status.textContent = "The data URL is invalid."; return; }
    if (!(endpoint.protocol === "https:" || endpoint.protocol === "http:") || endpoint.username || endpoint.password) { this.status.textContent = "The data URL must use HTTP or HTTPS without embedded credentials."; return; }
    this.cancel(); this.ensureWorker(); this.controller = new AbortController(); const signal = this.controller.signal; this.rows = []; this.columns = []; this.body.replaceChildren(); this.head.replaceChildren(); this.status.textContent = "Loading rows…";
    try {
      const response = await fetch(endpoint, { signal }); if (!response.ok) throw new Error(`Request failed (${response.status})`); if (!response.body) throw new Error("Streaming response body is unavailable");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; pending += decoder.decode(value, { stream: true }); const lines = pending.split(/\r?\n/); pending = lines.pop() ?? ""; if (pending.length > MAX_LINE_LENGTH) { pending = ""; this.status.textContent = "Skipped oversized data row."; } for (const line of lines) this.acceptLine(line); }
      pending += decoder.decode(); if (pending.trim()) this.acceptLine(pending);
      if (!this.rows.length) { this.status.textContent = "No rows available."; return; }
      this.publishRows(); this.query();
    } catch (error) { if (signal.aborted) this.status.textContent = `Loading cancelled. ${this.rows.length} rows received.`; else this.status.textContent = error instanceof Error ? `Unable to load data: ${error.message}` : "Unable to load data."; }
    finally { if (this.controller?.signal === signal) this.controller = undefined; }
  }
  cancel(): void { if (!this.controller) return; this.controller.abort(); this.controller = undefined; }
  private acceptLine(line: string): void {
    if (!line.trim()) return;
    if (line.length > MAX_LINE_LENGTH) { this.status.textContent = "Skipped oversized data row."; return; }
    if (this.rows.length >= MAX_ROWS) { this.status.textContent = `Row limit of ${MAX_ROWS} reached.`; return; }
    let value: unknown; try { value = JSON.parse(line); } catch { this.status.textContent = "Skipped malformed data row."; return; }
    if (!isRow(value)) { this.status.textContent = "Skipped invalid data row."; return; }
    const row = Object.assign(Object.create(null), value) as Row;
    if (!this.columns.length) { this.columns = Object.keys(row); this.renderHeader(); }
    this.rows.push(row);
    if (this.rows.length % 100 === 0) this.status.textContent = `Loaded ${this.rows.length} rows…`;
    if (this.rows.length % 5_000 === 0) { this.publishRows(); this.query(); }
  }
  private renderHeader(): void { const row = document.createElement("tr"); for (const key of this.columns) { const th = document.createElement("th"); th.scope = "col"; const button = document.createElement("button"); button.type = "button"; button.textContent = key; button.addEventListener("click", () => { this.direction = this.sortKey === key && this.direction === "asc" ? "desc" : "asc"; this.sortKey = key; this.query(); }); th.append(button); row.append(th); } this.head.replaceChildren(row); }
  private query(): void { if (!this.worker || !this.rows.length) return; const id = ++this.queryId; this.worker.postMessage({ type: "query", id, filter: this.filterInput.value.slice(0, MAX_FILTER_LENGTH), sortKey: this.sortKey || this.columns[0] || "", direction: this.direction } satisfies WorkerRequest); }
  private publishRows(): void { this.worker?.postMessage({ type: "set-rows", rows: this.rows } satisfies WorkerRequest); }
  private onWorkerMessage(value: unknown): void { if (!isWorkerResponse(value)) { this.status.textContent = "The table worker returned an invalid response."; this.worker?.terminate(); this.worker = undefined; return; } const message = value; if (message.type === "error") { this.status.textContent = message.message; return; } if (message.id !== this.queryId) return; this.body.replaceChildren(); for (const row of message.rows) { const tr = document.createElement("tr"); for (const [index, key] of this.columns.entries()) { const td = document.createElement("td"); if (index === 0) { const view = document.createElement("button"); view.type = "button"; view.className = "row-link"; view.textContent = String(row[key] ?? ""); view.setAttribute("aria-label", `View ${String(row[key] ?? "row")}`); view.addEventListener("click", () => this.dispatchEvent(new CustomEvent("pds-row-select", { detail: { row }, bubbles: true, composed: true }))); td.append(view); } else td.textContent = String(row[key] ?? ""); tr.append(td); } this.body.append(tr); } this.status.textContent = message.total ? `${message.total} matching rows${message.total > 100 ? " (first 100 shown)" : ""}.` : "No matching rows."; }
}
if (!customElements.get("pds-data-table")) customElements.define("pds-data-table", PdsDataTable);
