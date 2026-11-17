const textFieldStyles = new CSSStyleSheet();
let nextTextFieldId = 0;

textFieldStyles.replaceSync(`
  :host {
    display: block;
    font-family: inherit;
    width: 100%;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--pds-spacing-2, 0.5rem);
  }

  label {
    font-size: var(--pds-typography-font-size-sm, 0.875rem);
    font-weight: 600;
    color: var(--pds-text, var(--pds-color-neutral-900, #111827));
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--pds-spacing-3, 0.75rem) var(--pds-spacing-4, 1rem);
    border: 1px solid var(--pds-color-neutral-300, #d1d5db);
    border-radius: var(--pds-radius-md, 0.5rem);
    font: inherit;
    background: var(--pds-surface, var(--pds-color-neutral-0, #fff));
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
  }

  input:focus {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 2px;
  }

  input:focus-visible {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 2px;
  }

  input:disabled {
    background: var(--pds-color-neutral-100, #f1f5f9);
    cursor: not-allowed;
  }

  .error {
    color: var(--pds-error-text, var(--pds-color-danger-700, #991b1b));
    font-size: var(--pds-typography-font-size-xs, 0.75rem);
  }
`);

export class PdsTextField extends HTMLElement {
  static formAssociated = true;

  private internals: ElementInternals;
  private input: HTMLInputElement;
  private label: HTMLLabelElement;
  private error: HTMLSpanElement;
  private formDisabled = false;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [textFieldStyles];

    const field = document.createElement("div");
    field.className = "field";

    this.label = document.createElement("label");
    this.label.htmlFor = `pds-text-field-${++nextTextFieldId}`;

    this.input = document.createElement("input");
    this.input.id = this.label.htmlFor;
    this.input.setAttribute("part", "input");

    this.error = document.createElement("span");
    this.error.className = "error";
    this.error.id = `${this.input.id}-error`;
    this.error.setAttribute("part", "error");

    field.append(this.label, this.input, this.error);
    shadow.append(field);

    this.input.addEventListener("input", () => {
      this.validate();
      this.updateFormValue();
    });

    this.input.addEventListener("change", () => {
      this.updateFormValue();
    });
  }

  connectedCallback(): void {
    this.updateField();
    this.updateFormValue();
  }

  static get observedAttributes(): string[] {
    return ["label", "placeholder", "type", "name", "required", "disabled", "value"];
  }

  attributeChangedCallback(): void {
    this.updateField();
  }

  private updateField(): void {
    if (!this.input) return;

    this.label.textContent = this.getAttribute("label") || "";

    this.input.type = ["text", "email", "password", "number"].includes(
      this.getAttribute("type") || "text"
    )
      ? this.getAttribute("type") || "text"
      : "text";

    this.input.placeholder = this.getAttribute("placeholder") || "";
    this.input.required = this.hasAttribute("required");
    this.input.disabled = this.formDisabled || this.hasAttribute("disabled");
    this.input.name = this.getAttribute("name") || "";
    this.input.defaultValue = this.getAttribute("value") || "";

    this.validate();

    this.updateFormValue();
  }

  private updateFormValue(): void {
    if (!this.input) return;

    const name = this.getAttribute("name");

    if (name) {
    this.internals.setFormValue(this.input.disabled ? null : this.input.value, this.input.value);
    } else {
      this.internals.setFormValue(null);
    }
  }

  private validate(): void {
    if (!this.input) return;

    if (this.input.validity.valid) {
      this.error.textContent = "";
      this.internals.setValidity({});
      this.input.removeAttribute("aria-invalid");
      this.input.removeAttribute("aria-describedby");
    } else {
      this.error.textContent = this.input.validationMessage;
      this.input.setAttribute("aria-invalid", "true");
      this.input.setAttribute("aria-describedby", this.error.id);

      this.internals.setValidity(
        { customError: true },
        this.input.validationMessage,
        this.input
      );
    }
  }

  formResetCallback(): void {
    this.input.value = this.input.defaultValue;
    this.error.textContent = "";
    this.validate();
    this.updateFormValue();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.input.disabled = disabled || this.hasAttribute("disabled");
    this.updateFormValue();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.input.value = state;
      this.updateFormValue();
    }
  }
}

if (!customElements.get("pds-text-field")) {
  customElements.define("pds-text-field", PdsTextField);
}
