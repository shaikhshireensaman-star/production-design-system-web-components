

const badgeStyles = new CSSStyleSheet();

badgeStyles.replaceSync(`
  :host {
    display: inline-block;
    font-family: inherit;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: var(--pds-spacing-1, 0.25rem) var(--pds-spacing-3, 0.75rem);
    border-radius: var(--pds-radius-full, 9999px);
    font-size: var(--pds-typography-font-size-xs, 0.75rem);
    font-weight: 600;
    line-height: 1.4;
    border: 1px solid transparent;
  }

  .success {
    color: var(--pds-color-success-700, #166534);
    background: var(--pds-color-success-100, #dcfce7);
    border-color: var(--pds-color-success-100, #bbf7d0);
  }

  .warning {
    color: var(--pds-color-warning-700, #92400e);
    background: var(--pds-color-warning-100, #fef3c7);
    border-color: var(--pds-color-warning-100, #fde68a);
  }

  .danger {
    color: var(--pds-color-danger-700, #991b1b);
    background: var(--pds-color-danger-100, #fee2e2);
    border-color: var(--pds-color-danger-100, #fecaca);
  }

  .info {
    color: var(--pds-color-info-700, #1e40af);
    background: var(--pds-color-info-100, #dbeafe);
    border-color: var(--pds-color-info-100, #bfdbfe);
  }

  .neutral {
    color: var(--pds-color-neutral-700, #334155);
    background: var(--pds-color-neutral-100, #f1f5f9);
    border-color: var(--pds-color-neutral-200, #e2e8f0);
  }
`);

export class PdsBadge extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "label"];
  }

  private badge: HTMLSpanElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [badgeStyles];

    this.badge = document.createElement("span");
    this.badge.className = "badge";
    this.badge.setAttribute("part", "base");

    shadow.append(this.badge);
  }

  connectedCallback(): void {
    this.updateBadge();
  }

  attributeChangedCallback(): void {
    if (this.badge) {
      this.updateBadge();
    }
  }

  private updateBadge(): void {
    const variant = this.getAttribute("variant") || "neutral";

    const validVariants = [
      "success",
      "warning",
      "danger",
      "info",
      "neutral"
    ];

    const safeVariant = validVariants.includes(variant)
      ? variant
      : "neutral";

    this.badge.className = `badge ${safeVariant}`;
    this.badge.textContent =
      this.getAttribute("label") || this.textContent?.trim() || "Badge";
  }
}

if (!customElements.get("pds-badge")) {
  customElements.define("pds-badge", PdsBadge);
}
