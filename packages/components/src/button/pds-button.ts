const buttonStyles = new CSSStyleSheet();

buttonStyles.replaceSync(`
  :host {
    display: inline-block;
    font-family: inherit;
  }

  button {
    font: inherit;
    cursor: pointer;
    border: 0;
    border-radius: var(--pds-radius-md, 8px);
    padding: var(--pds-spacing-3, 12px) var(--pds-spacing-4, 16px);
    transition: background-color 150ms ease, opacity 150ms ease;
  }

  button:focus-visible {
    outline: 3px solid var(--pds-focus-ring, var(--pds-color-brand-300, #a5b4fc));
    outline-offset: 3px;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .primary {
    background: var(--pds-primary, var(--pds-color-brand-600, #4f46e5));
    color: var(--pds-primary-text, white);
  }

  .secondary {
    background: var(--pds-color-neutral-100, #f1f5f9);
    color: var(--pds-color-neutral-900, #111827);
  }

  .danger {
    background: var(--pds-color-danger, #dc2626);
    color: white;
  }
`);

export class PdsButton extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["variant", "disabled", "type"];
  }

  private button: HTMLButtonElement;

  constructor() {
    super();

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [...(shadow.adoptedStyleSheets ?? []).filter(sheet => sheet !== buttonStyles), buttonStyles];
    const existingButton = shadow.querySelector("button");
    this.button = existingButton ?? document.createElement("button");
    if (!existingButton) {
      this.button.setAttribute("part", "button");
      this.button.append(document.createElement("slot"));
      shadow.append(this.button);
    }
  }

  connectedCallback(): void {
    this.updateButton();
  }

  attributeChangedCallback(): void {
    this.updateButton();
  }

  private updateButton(): void {
    if (!this.button) return;

    const variant = this.getAttribute("variant") || "primary";
    const allowedVariants = ["primary", "secondary", "danger"];

    this.button.className = allowedVariants.includes(variant)
      ? variant
      : "primary";

    this.button.disabled = this.hasAttribute("disabled");

    const type = this.getAttribute("type") || "button";
    this.button.type = ["button", "submit", "reset"].includes(type)
      ? type as "button" | "submit" | "reset"
      : "button";
  }
}

if (!customElements.get("pds-button")) {
  customElements.define("pds-button", PdsButton);
}
