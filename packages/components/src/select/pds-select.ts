const selectStyles = new CSSStyleSheet();

selectStyles.replaceSync(`
  :host {
    display: block;
    width: 100%;
    font-family: inherit;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--pds-spacing-2, 0.5rem);
  }

  label {
    font-size: 14px;
    font-weight: 600;
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
  }

  select {
    width: 100%;
    box-sizing: border-box;
    padding: var(--pds-spacing-3, 0.75rem) var(--pds-spacing-4, 1rem);
    border: 1px solid var(--pds-color-neutral-300, #cbd5e1);
    border-radius: var(--pds-radius-md, 0.5rem);
    background: var(--pds-surface, var(--pds-color-neutral-0, #fff));
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
    font: inherit;
    cursor: pointer;
  }

  select:focus-visible {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 2px;
  }

  select:disabled {
    background: var(--pds-color-neutral-100, #f1f5f9);
    cursor: not-allowed;
  }

  .error {
    color: var(--pds-error-text, var(--pds-color-danger-700, #991b1b));
    font-size: 12px;
  }
`);

type SelectOption = {
  label: string;
  value: string;
};

let nextSelectId = 0;

export class PdsSelect extends HTMLElement {
  static formAssociated = true;

  private internals: ElementInternals;
  private select: HTMLSelectElement;
  private label: HTMLLabelElement;
  private error: HTMLSpanElement;
  private formDisabled = false;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [selectStyles];

    const field = document.createElement("div");
    field.className = "field";

    this.label = document.createElement("label");
    this.label.htmlFor = `pds-select-${++nextSelectId}`;
    this.label.setAttribute("part", "label");

    this.select = document.createElement("select");
    this.select.id = this.label.htmlFor;
    this.select.setAttribute("part", "select");

    this.error = document.createElement("span");
    this.error.className = "error";
    this.error.id = `${this.select.id}-error`;
    this.error.setAttribute("part", "error");

    field.append(this.label, this.select, this.error);
    shadow.append(field);

    this.select.addEventListener("change", () => {
      this.updateFormValue();
      this.validate();

      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
    });
  }

  static get observedAttributes(): string[] {
    return [
      "label",
      "name",
      "placeholder",
      "options",
      "required",
      "disabled"
    ];
  }

  connectedCallback(): void {
    this.updateField();
  }

  attributeChangedCallback(): void {
    this.updateField();
  }

  private updateField(): void {
    if (!this.select) return;

    this.label.textContent = this.getAttribute("label") || "";

    this.select.disabled = this.formDisabled || this.hasAttribute("disabled");
    this.select.required = this.hasAttribute("required");

    const placeholder = this.getAttribute("placeholder") || "Select an option";
    const previousValue = this.select.value;

    this.select.replaceChildren();

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = placeholder;
    firstOption.disabled = true;
    firstOption.selected = true;

    this.select.append(firstOption);

    try {
      const options: SelectOption[] = JSON.parse(
        this.getAttribute("options") || "[]"
      );

      for (const option of options) {
        if (
          typeof option.label !== "string" ||
          typeof option.value !== "string"
        ) {
          continue;
        }

        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;

        this.select.append(element);
      }
    } catch {
      console.error("PDS Select: Invalid options JSON.");
    }

    if (previousValue && Array.from(this.select.options).some((option) => option.value === previousValue)) {
      this.select.value = previousValue;
    }

    this.validate();
    this.updateFormValue();
  }

  private updateFormValue(): void {
    const name = this.getAttribute("name");

    this.internals.setFormValue(
      name && !this.select.disabled && !this.formDisabled
        ? this.select.value
        : null
    );
  }

  private validate(): void {
    if (!this.select) return;

    if (this.select.validity.valid || this.select.disabled) {
      this.error.textContent = "";
      this.select.removeAttribute("aria-invalid");
      this.select.removeAttribute("aria-describedby");
      this.internals.setValidity({});
      return;
    }

    const message = this.select.validationMessage;

    this.error.textContent = message;
    this.select.setAttribute("aria-invalid", "true");
    this.select.setAttribute("aria-describedby", this.error.id);

    this.internals.setValidity(
      { valueMissing: true },
      message,
      this.select
    );
  }

  formResetCallback(): void {
    this.select.selectedIndex = 0;
    this.validate();
    this.updateFormValue();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.select.disabled = disabled || this.hasAttribute("disabled");
    this.validate();
    this.updateFormValue();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.select.value = state;
      this.updateFormValue();
    }
  }
}

if (!customElements.get("pds-select")) {
  customElements.define("pds-select", PdsSelect);
}
