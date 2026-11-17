import { describe, expect, it, vi } from "vitest";
import "../../packages/components/src/checkbox/pds-checkbox";

describe("Checkbox component", () => {
  it("renders an accessible label and maintains required validity", () => {
    const checkbox = document.createElement("pds-checkbox") as HTMLElement & {
      internals: ElementInternals & { validityFlags: ValidityStateFlags };
    };
    checkbox.setAttribute("label", "Accept terms");
    checkbox.setAttribute("required", "");
    document.body.append(checkbox);
    const input = checkbox.shadowRoot?.querySelector("input");

    expect(checkbox.shadowRoot?.textContent).toContain("Accept terms");
    expect(checkbox.internals.validityFlags.valueMissing).toBe(true);
    input!.checked = true;
    input!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(checkbox.internals.validityFlags.valueMissing).toBeUndefined();
  });

  it("submits only checked values and emits change", () => {
    const checkbox = document.createElement("pds-checkbox") as HTMLElement & {
      internals: ElementInternals & { formValue: FormDataEntryValue | null };
    };
    checkbox.setAttribute("name", "terms");
    checkbox.setAttribute("value", "accepted");
    document.body.append(checkbox);
    const input = checkbox.shadowRoot?.querySelector("input");
    const onChange = vi.fn();
    checkbox.addEventListener("change", onChange);
    input!.click();

    expect(checkbox.internals.formValue).toBe("accepted");
    expect(onChange).toHaveBeenCalledOnce();
    checkbox.setAttribute("disabled", "");
    expect(input?.disabled).toBe(true);
  });
});
