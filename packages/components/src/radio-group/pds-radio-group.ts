
interface RadioOption {
  label: string;
  value: string;
}

let nextRadioGroupId = 0;

const radioGroupStyles = new CSSStyleSheet();

radioGroupStyles.replaceSync(`
  :host {
    display: block;
    font-family: inherit;
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
  }

  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
  }

  legend {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--pds-spacing-3, 0.75rem);
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: var(--pds-spacing-2, 0.5rem);
    font-size: 14px;
    cursor: pointer;
  }

  input {
    width: 17px;
    height: 17px;
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

  label:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }

  [part="error"] {
    color: var(--pds-error-text, var(--pds-color-danger-700, #991b1b));
    font-size: var(--pds-typography-font-size-xs, 0.75rem);
  }
`);

export class PdsRadioGroup extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes(): string[] {
    return [
      "label",
      "name",
      "options",
      "value",
      "required",
      "disabled"
    ];
  }

  private internals: ElementInternals;
  private fieldset: HTMLFieldSetElement;
  private legend: HTMLLegendElement;
  private optionsContainer: HTMLDivElement;
  private error: HTMLSpanElement;
  private selectedValue = "";
  private formDisabled = false;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [radioGroupStyles];

    this.fieldset = document.createElement("fieldset");

    this.legend = document.createElement("legend");
    this.legend.setAttribute("part", "label");

    this.optionsContainer = document.createElement("div");
    this.optionsContainer.className = "options";
    this.optionsContainer.setAttribute("part", "options");

    this.error = document.createElement("span");
    this.error.id = `pds-radio-group-${++nextRadioGroupId}-error`;
    this.error.setAttribute("part", "error");
    this.error.setAttribute("aria-live", "polite");

    this.fieldset.append(this.legend, this.optionsContainer, this.error);
    shadow.append(this.fieldset);
  }

  connectedCallback(): void {
    this.updateRadioGroup();
  }

  attributeChangedCallback(): void {
    if (this.fieldset) {
      this.updateRadioGroup();
    }
  }

  private getOptions(): RadioOption[] {
    const rawOptions = this.getAttribute("options");

    if (!rawOptions) return [];

    try {
      const parsed: unknown = JSON.parse(rawOptions);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is RadioOption =>
          typeof item === "object" &&
          item !== null &&
          "label" in item &&
          "value" in item &&
          typeof item.label === "string" &&
          typeof item.value === "string"
      );
    } catch {
      return [];
    }
  }

  private updateRadioGroup(): void {
    this.legend.textContent = this.getAttribute("label") || "Choose an option";
    this.fieldset.disabled = this.formDisabled || this.hasAttribute("disabled");

    const options = this.getOptions();
    const attributeValue = this.getAttribute("value");

    if (attributeValue !== null) {
      this.selectedValue = attributeValue;
    }

    this.optionsContainer.replaceChildren();

    options.forEach((option, index) => {
      const label = document.createElement("label");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = this.getAttribute("name") || "radio-group";
      input.value = option.value;
      input.checked = option.value === this.selectedValue;
      input.disabled = this.formDisabled || this.hasAttribute("disabled");
      input.required = this.hasAttribute("required");
      input.setAttribute("part", "input");

      const text = document.createElement("span");
      text.textContent = option.label;

      label.append(input, text);
      this.optionsContainer.append(label);

      input.addEventListener("change", () => {
        if (!input.checked) return;

        this.selectedValue = input.value;
        this.optionsContainer.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
          radio.tabIndex = radio.checked ? 0 : -1;
        });
        this.updateFormValue();

        this.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
      });

      input.tabIndex = option.value === this.selectedValue ||
        (!this.selectedValue && index === 0) ? 0 : -1;

      input.addEventListener("keydown", (event: KeyboardEvent) => {
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
        if (!direction) return;

        event.preventDefault();
        const radios = Array.from(
          this.optionsContainer.querySelectorAll<HTMLInputElement>('input[type="radio"]')
        );
        const currentIndex = radios.indexOf(input);
        const targetIndex = (currentIndex + direction + radios.length) % radios.length;
        radios[targetIndex]?.click();
        radios[targetIndex]?.focus();
      });
    });

    this.updateFormValue();
  }

  private updateFormValue(): void {
    const disabled = this.formDisabled || this.hasAttribute("disabled");
    const required = this.hasAttribute("required");

    if (this.selectedValue && !disabled) {
      this.internals.setFormValue(this.selectedValue);
    } else {
      this.internals.setFormValue(null);
    }

    const selectedOptionExists = this.getOptions().some(
      (option) => option.value === this.selectedValue
    );

    if (required && !this.selectedValue && !disabled) {
      this.error.textContent = "Please select an option.";
      this.fieldset.setAttribute("aria-invalid", "true");
      this.fieldset.setAttribute("aria-describedby", this.error.id);
      this.internals.setValidity(
        { valueMissing: true },
        this.error.textContent
      );
    } else if (
      this.selectedValue &&
      !selectedOptionExists &&
      !disabled
    ) {
      this.error.textContent = "Please select a valid option.";
      this.fieldset.setAttribute("aria-invalid", "true");
      this.fieldset.setAttribute("aria-describedby", this.error.id);
      this.internals.setValidity(
        { customError: true },
        this.error.textContent
      );
    } else {
      this.error.textContent = "";
      this.fieldset.removeAttribute("aria-invalid");
      this.fieldset.removeAttribute("aria-describedby");
      this.internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.selectedValue = this.getAttribute("value") || "";
    this.updateRadioGroup();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.fieldset.disabled = disabled || this.hasAttribute("disabled");
    this.updateFormValue();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.selectedValue = typeof state === "string" ? state : "";
    this.updateRadioGroup();
  }
}

if (!customElements.get("pds-radio-group")) {
  customElements.define("pds-radio-group", PdsRadioGroup);
}
