const styles = new CSSStyleSheet();
styles.replaceSync(`:host{display:block}.toast{display:flex;align-items:start;gap:1rem;padding:1rem;border:1px solid var(--pds-border,#cbd5e1);border-radius:.5rem;background:var(--pds-surface,#fff);color:var(--pds-text,#0f172a);box-shadow:0 4px 12px #0002}.toast[hidden]{display:none}button{font:inherit;border:0;background:none;color:inherit;cursor:pointer}.message{flex:1}`);
export class PdsToast extends HTMLElement {
  static observedAttributes = ["open", "message", "duration", "type"];
  private root: ShadowRoot; private box: HTMLDivElement; private message: HTMLSpanElement; private timer: number | undefined;
  constructor() { super(); this.root = this.attachShadow({ mode: "open" }); this.root.adoptedStyleSheets = [styles]; this.box = document.createElement("div"); this.box.className = "toast"; this.box.setAttribute("role", "status"); this.message = document.createElement("span"); this.message.className = "message"; this.message.setAttribute("part", "message"); const close = document.createElement("button"); close.type = "button"; close.textContent = "Dismiss"; close.setAttribute("aria-label", "Dismiss notification"); close.addEventListener("click", () => this.dismiss()); this.box.append(this.message, close); this.root.append(this.box); }
  connectedCallback(): void { this.sync(); }
  attributeChangedCallback(): void { if (this.box) this.sync(); }
  show(): void { this.setAttribute("open", ""); }
  dismiss(): void { this.removeAttribute("open"); this.dispatchEvent(new Event("pds-dismiss", { bubbles: true, composed: true })); }
  private sync(): void { const isOpen = this.hasAttribute("open"); this.box.hidden = !isOpen; this.message.textContent = this.getAttribute("message") ?? this.textContent?.trim() ?? ""; this.box.setAttribute("role", this.getAttribute("type") === "alert" ? "alert" : "status"); if (this.timer !== undefined) window.clearTimeout(this.timer); if (isOpen && Number(this.getAttribute("duration")) > 0) this.timer = window.setTimeout(() => this.dismiss(), Number(this.getAttribute("duration"))); }
  disconnectedCallback(): void { if (this.timer !== undefined) window.clearTimeout(this.timer); }
}
if (!customElements.get("pds-toast")) customElements.define("pds-toast", PdsToast);
