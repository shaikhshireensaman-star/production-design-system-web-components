
const alertStyles = new CSSStyleSheet();

alertStyles.replaceSync(`
  :host {
    display: block;
    font-family: inherit;
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--pds-spacing-3, 0.75rem);
    padding: var(--pds-spacing-4, 1rem);
    border: 1px solid transparent;
    border-radius: var(--pds-radius-md, 0.5rem);
    font-size: 14px;
    line-height: 1.5;
  }

  .icon {
    font-weight: 700;
    font-size: 16px;
  }

  .content {
    flex: 1;
  }

  .title {
    display: block;
    font-weight: 600;
    margin-bottom: 3px;
  }

  .message {
    margin: 0;
  }

  .success {
    color: var(--pds-color-success-700, #166534);
    background: var(--pds-color-success-50, #f0fdf4);
    border-color: var(--pds-color-success-100, #bbf7d0);
  }

  .warning {
    color: var(--pds-color-warning-700, #92400e);
    background: var(--pds-color-warning-50, #fffbeb);
    border-color: var(--pds-color-warning-100, #fde68a);
  }

  .danger {
    color: var(--pds-color-danger-700, #991b1b);
    background: var(--pds-color-danger-50, #fef2f2);
    border-color: var(--pds-color-danger-100, #fecaca);
  }

  .info {
    color: var(--pds-color-info-700, #1e40af);
    background: var(--pds-color-info-50, #eff6ff);
    border-color: var(--pds-color-info-100, #bfdbfe);
  }
`);

export class PdsAlert extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "title", "message"];
  }

  private alert: HTMLDivElement;
  private icon: HTMLSpanElement;
  private titleElement: HTMLSpanElement;
  private messageElement: HTMLParagraphElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [alertStyles];

    this.alert = document.createElement("div");
    this.alert.className = "alert";
    this.alert.setAttribute("part", "base");
    this.alert.setAttribute("role", "alert");

    this.icon = document.createElement("span");
    this.icon.className = "icon";
    this.icon.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "content";

    this.titleElement = document.createElement("span");
    this.titleElement.className = "title";
    this.titleElement.setAttribute("part", "title");

    this.messageElement = document.createElement("p");
    this.messageElement.className = "message";
    this.messageElement.setAttribute("part", "message");

    content.append(this.titleElement, this.messageElement);
    this.alert.append(this.icon, content);
    shadow.append(this.alert);
  }

  connectedCallback(): void {
    this.updateAlert();
  }

  attributeChangedCallback(): void {
    if (this.alert) {
      this.updateAlert();
    }
  }

  private updateAlert(): void {
    const variant = this.getAttribute("variant") || "info";

    const validVariants = [
      "success",
      "warning",
      "danger",
      "info"
    ];

    const safeVariant = validVariants.includes(variant)
      ? variant
      : "info";

    const icons: Record<string, string> = {
      success: "✓",
      warning: "!",
      danger: "×",
      info: "i"
    };

    this.alert.className = `alert ${safeVariant}`;
    this.icon.textContent = icons[safeVariant] || "i";

    this.titleElement.textContent =
      this.getAttribute("title") || "";

    this.titleElement.hidden = !this.getAttribute("title");

    this.messageElement.textContent =
      this.getAttribute("message") || this.textContent?.trim() || "";
  }
}

if (!customElements.get("pds-alert")) {
  customElements.define("pds-alert", PdsAlert);
}
