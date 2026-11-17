import { describe, expect, it, vi } from "vitest";
import "../../packages/components/src/radio-group/pds-radio-group";

describe("Radio group component", () => {
  it("renders a named fieldset with its choices", () => {
    const group = document.createElement("pds-radio-group");
    group.setAttribute("label", "Size");
    group.setAttribute("options", JSON.stringify([
      { label: "Small", value: "s" },
      { label: "Large", value: "l" }
    ]));
    document.body.append(group);

    expect(group.shadowRoot?.querySelector("legend")?.textContent).toBe("Size");
    expect(group.shadowRoot?.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  });

  it("updates selected value and emits change", () => {
    const group = document.createElement("pds-radio-group") as HTMLElement & {
      internals: ElementInternals & { formValue: FormDataEntryValue | null };
    };
    group.setAttribute("name", "size");
    group.setAttribute("options", JSON.stringify([
      { label: "Small", value: "s" },
      { label: "Large", value: "l" }
    ]));
    document.body.append(group);
    const radios = group.shadowRoot?.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    const onChange = vi.fn();
    group.addEventListener("change", onChange);
    radios?.[0]?.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true
    }));

    expect(group.internals.formValue).toBe("l");
    expect(onChange).toHaveBeenCalledOnce();
    expect(radios?.[1]?.tabIndex).toBe(0);
  });

  it("announces missing required selection", () => {
    const group = document.createElement("pds-radio-group") as HTMLElement & {
      internals: ElementInternals & { validityFlags: ValidityStateFlags };
    };
    group.setAttribute("required", "");
    group.setAttribute("options", JSON.stringify([
      { label: "A", value: "a" },
      { label: "B", value: "b" }
    ]));
    document.body.append(group);

    const fieldset = group.shadowRoot?.querySelector("fieldset");
    expect(group.internals.validityFlags.valueMissing).toBe(true);
    expect(fieldset?.getAttribute("aria-invalid")).toBe("true");
    expect(fieldset?.getAttribute("aria-describedby")).toBe(
      group.shadowRoot?.querySelector("[part=error]")?.id
    );
  });
});
