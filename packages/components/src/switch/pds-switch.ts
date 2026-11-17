
const switchStyles = new CSSStyleSheet();

switchStyles.replaceSync(`
  :host {
    display: inline-block;
    font-family: inherit;
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
  }

  .container {
    display: inline-flex;
    align-items: center;
    gap: var(--pds-spacing-3, 0.75rem);
    cursor: pointer;
    font-size: 14px;
  }

  button {
    position: relative;
    width: 42px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: var(--pds-radius-full, 9999px);
    background: var(--pds-color-neutral-500, #64748b);
    cursor: pointer;
    transition: background 0.2s ease;
  }

  button[aria-checked="true"] {
    background: var(--pds-color-brand-600, #4f46e5);
  }

  button:focus-visible {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 3px;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s ease;
  }

  button[aria-checked="true"] .thumb {
    transform: translateX(18px);
  }

  .container:has(button:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }
`);

export class PdsSwitch extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes(): string[] {
    return [
      "label",
      "name",
      "value",
      "checked",
      "disabled",
      "required"
    ];
  }

  private internals: ElementInternals;
  private button: HTMLButtonElement;
  private label: HTMLSpanElement;
  private isChecked = false;
  private formDisabled = false;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [switchStyles];

    const container = document.createElement("div");
    container.className = "container";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.setAttribute("role", "switch");
    this.button.setAttribute("part", "control");

    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.setAttribute("part", "thumb");

    this.button.append(thumb);

    this.label = document.createElement("span");
    this.label.setAttribute("part", "label");

    container.append(this.button, this.label);
    shadow.append(container);

    this.button.addEventListener("click", () => {
      if (this.formDisabled || this.hasAttribute("disabled")) return;

      this.isChecked = !this.isChecked;
      this.toggleAttribute("checked", this.isChecked);
      this.updateSwitch();

      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
    });
  }

  connectedCallback(): void {
    this.isChecked = this.hasAttribute("checked");
    this.updateSwitch();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.button || oldValue === newValue) return;

    if (name === "checked") {
      this.isChecked = newValue !== null;
    }

    this.updateSwitch();
  }

  private updateSwitch(): void {
    if (!this.button) return;

    this.label.textContent = this.getAttribute("label") || "Switch";
    this.button.setAttribute("aria-label", this.label.textContent);
    this.button.setAttribute("aria-required", String(this.hasAttribute("required")));

    this.button.disabled = this.formDisabled || this.hasAttribute("disabled");
    this.button.setAttribute(
      "aria-checked",
      String(this.isChecked)
    );

    this.updateFormValue();
  }

  private updateFormValue(): void {
    const name = this.getAttribute("name");
    const disabled = this.formDisabled || this.hasAttribute("disabled");
    const value = this.getAttribute("value") || "on";

    if (name && this.isChecked && !disabled) {
      this.internals.setFormValue(value);
    } else {
      this.internals.setFormValue(null);
    }

    if (
      this.hasAttribute("required") &&
      !this.isChecked &&
      !disabled
    ) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please turn on this switch."
      );
    } else {
      this.internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.isChecked = this.hasAttribute("checked");
    this.updateSwitch();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.button.disabled = disabled || this.hasAttribute("disabled");
    this.updateFormValue();
  }

  formStateRestoreCallback(
    state: string | File | FormData | null
  ): void {
    this.isChecked = state === (this.getAttribute("value") || "on");
    this.updateSwitch();
  }
}

if (!customElements.get("pds-switch")) {
  customElements.define("pds-switch", PdsSwitch);
}
