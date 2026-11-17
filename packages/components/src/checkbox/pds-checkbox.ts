const checkboxStyles = new CSSStyleSheet();

checkboxStyles.replaceSync(`
  :host {
    display: inline-block;
    font-family: inherit;
  }

  .container {
    display: inline-flex;
    align-items: center;
    gap: var(--pds-spacing-2, 0.5rem);
    cursor: pointer;
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
    font-size: 14px;
  }

  input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--pds-color-brand-600, #4f46e5);
    cursor: pointer;
  }

  input:focus-visible {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 3px;
  }

  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .container:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }
`);

export class PdsCheckbox extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes(): string[] {
    return ["label", "name", "value", "checked", "disabled", "required"];
  }

  private internals: ElementInternals;
  private input: HTMLInputElement;
  private label: HTMLLabelElement;
  private formDisabled = false;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [checkboxStyles];

    this.label = document.createElement("label");
    this.label.className = "container";

    this.input = document.createElement("input");
    this.input.type = "checkbox";
    this.input.setAttribute("part", "input");

    const text = document.createElement("span");
    text.setAttribute("part", "label");

    this.label.append(this.input, text);
    shadow.append(this.label);

    this.input.addEventListener("change", () => {
      this.updateFormValue();

      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
    });
  }

  connectedCallback(): void {
    this.updateCheckbox();
  }

  attributeChangedCallback(): void {
    this.updateCheckbox();
  }

  private updateCheckbox(): void {
    if (!this.input) return;

    const text = this.label.querySelector("span");

    if (text) {
      text.textContent = this.getAttribute("label") || "Checkbox";
    }

    this.input.checked = this.hasAttribute("checked");
    this.input.disabled = this.formDisabled || this.hasAttribute("disabled");
    this.input.required = this.hasAttribute("required");

    this.input.value = this.getAttribute("value") || "on";

    this.updateFormValue();
  }

  private updateFormValue(): void {
    if (!this.input) return;

    const name = this.getAttribute("name");
    const disabled = this.formDisabled || this.hasAttribute("disabled");

    if (name && this.input.checked && !disabled) {
      this.internals.setFormValue(this.input.value);
    } else {
      this.internals.setFormValue(null);
    }

    if (this.input.required && !this.input.checked && !disabled) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please check this box.",
        this.input
      );
    } else {
      this.internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.input.checked = this.hasAttribute("checked");
    this.updateFormValue();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.input.disabled = disabled || this.hasAttribute("disabled");
    this.updateFormValue();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.input.checked = state === this.input.value;
    this.updateFormValue();
  }
}

if (!customElements.get("pds-checkbox")) {
  customElements.define("pds-checkbox", PdsCheckbox);
}
