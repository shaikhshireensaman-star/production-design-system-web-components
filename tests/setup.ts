import { afterEach } from "vitest";

type InternalsStub = ElementInternals & {
  formValue: FormDataEntryValue | null;
  formState: FormDataEntryValue | null;
  validityFlags: ValidityStateFlags;
  validationAnchor: HTMLElement | null;
};

Object.defineProperty(HTMLElement.prototype, "attachInternals", {
  configurable: true,
  value(this: HTMLElement): InternalsStub {
    const thisHost = this;
    let formValue: FormDataEntryValue | null = null;
    let formState: FormDataEntryValue | null = null;
    let validityFlags: ValidityStateFlags = {};
    let validationAnchor: HTMLElement | null = null;
    let validationMessage = "";
    const internals = {
      get formValue(): FormDataEntryValue | null { return formValue; },
      get formState(): FormDataEntryValue | null { return formState; },
      get validityFlags(): ValidityStateFlags { return validityFlags; },
      get validationAnchor(): HTMLElement | null { return validationAnchor; },
      get validationMessage(): string { return validationMessage; },
      willValidate: true,
      get form(): HTMLFormElement | null {
        return thisHost.closest("form");
      },
      get validity(): ValidityState {
        return {
          valid: Object.keys(internals.validityFlags).length === 0
        } as ValidityState;
      },
      setFormValue(value: FormDataEntryValue | null, state?: FormDataEntryValue | null): void {
        formValue = value;
        formState = state === undefined ? value : state;
      },
      setValidity(
        flags: ValidityStateFlags = {},
        message = "",
        anchor: HTMLElement | null = null
      ): void {
        validityFlags = flags;
        validationMessage = message;
        validationAnchor = anchor;
      },
      checkValidity(): boolean {
        return Object.keys(internals.validityFlags).length === 0;
      },
      reportValidity(): boolean {
        return Object.keys(internals.validityFlags).length === 0;
      }
    };
    return internals as unknown as InternalsStub;
  }
});

if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    this.open = true;
  };
}

if (typeof HTMLDialogElement.prototype.close !== "function") {
  HTMLDialogElement.prototype.close = function close(): void {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  document.body.replaceChildren();
});
