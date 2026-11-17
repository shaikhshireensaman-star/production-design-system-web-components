const styles = new CSSStyleSheet();
styles.replaceSync(`:host{display:block} [role=tablist]{display:flex;gap:.25rem;border-bottom:1px solid var(--pds-border,#cbd5e1)}[role=tab]{font:inherit;background:none;border:0;padding:.65rem 1rem;cursor:pointer;color:inherit;border-bottom:2px solid transparent}[role=tab][aria-selected=true]{border-color:var(--pds-primary,#4f46e5);font-weight:600}[role=tab]:focus-visible{outline:2px solid var(--pds-focus-ring,#4f46e5);outline-offset:2px}[role=tabpanel]{padding:1rem 0}`);
export class PdsTabs extends HTMLElement {
  static observedAttributes = ["selected"];
  private root: ShadowRoot;
  private tabs: HTMLButtonElement[] = [];
  private panels: HTMLElement[] = [];
  constructor() { super(); this.root = this.attachShadow({ mode: "open" }); this.root.adoptedStyleSheets = [styles]; }
  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.root) this.render(); }
  private render(): void {
    const labels = [...this.querySelectorAll<HTMLElement>("[slot=tab]")];
    const contents = [...this.querySelectorAll<HTMLElement>("[slot=panel]")];
    this.root.replaceChildren();
    const list = document.createElement("div"); list.setAttribute("role", "tablist");
    const selected = Math.min(Math.max(0, Number(this.getAttribute("selected") ?? 0)), Math.max(0, labels.length - 1));
    this.tabs = []; this.panels = [];
    labels.forEach((label, i) => {
      const tab = document.createElement("button"); tab.type = "button"; tab.id = `tab-${i}`; tab.setAttribute("role", "tab"); tab.setAttribute("aria-controls", `panel-${i}`); tab.setAttribute("aria-selected", String(i === selected)); tab.tabIndex = i === selected ? 0 : -1; tab.textContent = label.textContent;
      tab.addEventListener("click", () => this.select(i));
      tab.addEventListener("keydown", e => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return; e.preventDefault(); const next = e.key === "Home" ? 0 : e.key === "End" ? this.tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + this.tabs.length) % this.tabs.length; this.select(next); this.tabs[next]?.focus(); });
      this.tabs.push(tab); list.append(tab);
    });
    this.root.append(list);
    contents.forEach((content, i) => { const panel = document.createElement("section"); panel.id = `panel-${i}`; panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", `tab-${i}`); panel.hidden = i !== selected; panel.append(document.createElement("slot")); (panel.firstElementChild as HTMLSlotElement).name = `panel-${i}`; this.panels.push(panel); this.root.append(panel); });
  }
  private select(index: number): void { this.setAttribute("selected", String(index)); this.dispatchEvent(new CustomEvent("pds-tab-change", { detail: { index }, bubbles: true, composed: true })); }
}
if (!customElements.get("pds-tabs")) customElements.define("pds-tabs", PdsTabs);
