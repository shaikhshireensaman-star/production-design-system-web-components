const styles = new CSSStyleSheet();
styles.replaceSync(`:host{display:inline-flex;gap:.15rem}button{font:inherit;font-size:1.5rem;color:var(--pds-rating-color,#a16207);background:none;border:0;padding:.1rem;cursor:pointer}button:focus-visible{outline:2px solid var(--pds-focus-ring,#4f46e5);outline-offset:2px}`);

export class PdsRating extends HTMLElement {
  static observedAttributes = ["value", "max", "label", "readonly", "disabled"];
  private root: ShadowRoot;
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.adoptedStyleSheets = [styles];
  }
  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.root) this.render(); }
  get value(): number { return Number(this.getAttribute("value") ?? 0); }
  set value(value: number) { this.setAttribute("value", String(value)); }
  private render(): void {
    const max = Math.min(10, Math.max(1, Number(this.getAttribute("max") ?? 5) || 5));
    const value = Math.max(0, Math.min(max, this.value));
    this.root.replaceChildren();
    this.setAttribute("role", "group");
    this.setAttribute("aria-label", this.getAttribute("label") ?? "Rating");
    for (let score = 1; score <= max; score++) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = score <= value ? "★" : "☆";
      button.setAttribute("aria-label", `${score} of ${max} stars`);
      button.setAttribute("aria-pressed", String(score === value));
      button.disabled = this.hasAttribute("disabled") || this.hasAttribute("readonly");
      button.addEventListener("click", () => {
        this.value = score;
        this.dispatchEvent(new CustomEvent("pds-change", { detail: { value: score }, bubbles: true, composed: true }));
      });
      this.root.append(button);
    }
  }
}
if (!customElements.get("pds-rating")) customElements.define("pds-rating", PdsRating);
