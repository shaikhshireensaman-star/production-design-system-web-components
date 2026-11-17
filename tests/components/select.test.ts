import { describe, expect, it } from "vitest";
import "../../packages/components/src/select/pds-select";

describe("Select component", () => {
  it("renders labeled options and submits the selected value", () => {
    const select = document.createElement("pds-select") as HTMLElement & {
      internals: ElementInternals & { formValue: FormDataEntryValue | null };
    };
    select.setAttribute("label", "Plan");
    select.setAttribute("name", "plan");
    select.setAttribute("options", JSON.stringify([
      { label: "Starter", value: "starter" },
      { label: "Pro", value: "pro" }
    ]));
    document.body.append(select);

    const nativeSelect = select.shadowRoot?.querySelector("select");
    expect(select.shadowRoot?.querySelector("label")?.textContent).toBe("Plan");
    expect(nativeSelect?.options).toHaveLength(3);
    expect(select.shadowRoot?.querySelector("label")?.htmlFor).toBe(nativeSelect?.id);
    if (!nativeSelect) throw new Error("Expected the select control to render");
    nativeSelect.value = "pro";
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(select.internals.formValue).toBe("pro");
    select.setAttribute("placeholder", "Pick a plan");
    expect(nativeSelect.value).toBe("pro");
  });

  it("reflects required validity and disabled state", () => {
    const select = document.createElement("pds-select") as HTMLElement & {
      internals: ElementInternals & { validityFlags: ValidityStateFlags };
    };
    select.setAttribute("required", "");
    document.body.append(select);
    const nativeSelect = select.shadowRoot?.querySelector("select");
    nativeSelect?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(nativeSelect?.required).toBe(true);
    expect(select.internals.validityFlags.valueMissing).toBe(true);
    expect(nativeSelect?.getAttribute("aria-invalid")).toBe("true");
    expect(nativeSelect?.getAttribute("aria-describedby")).toBe(`${nativeSelect?.id}-error`);
    select.setAttribute("disabled", "");
    expect(nativeSelect?.disabled).toBe(true);
  });
});
