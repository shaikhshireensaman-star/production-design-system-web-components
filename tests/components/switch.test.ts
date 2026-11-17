import { describe, expect, it, vi } from "vitest";
import "../../packages/components/src/switch/pds-switch";

describe("Switch component", () => {
  it("has a named switch control and reflects checked state", () => {
    const control = document.createElement("pds-switch");
    control.setAttribute("label", "Notifications");
    control.setAttribute("required", "");
    document.body.append(control);
    const button = control.shadowRoot?.querySelector("button");

    expect(button?.getAttribute("role")).toBe("switch");
    expect(button?.getAttribute("aria-checked")).toBe("false");
    expect(button?.getAttribute("aria-label")).toBe("Notifications");
    button?.click();
    expect(button?.getAttribute("aria-checked")).toBe("true");
    expect(control.hasAttribute("checked")).toBe(true);
    button?.click();
    expect(control.hasAttribute("checked")).toBe(false);
    expect(button?.getAttribute("aria-required")).toBe("true");
  });

  it("submits its value and emits change, while honoring disabled", () => {
    const control = document.createElement("pds-switch") as HTMLElement & {
      internals: ElementInternals & { formValue: FormDataEntryValue | null };
    };
    control.setAttribute("name", "notifications");
    control.setAttribute("value", "enabled");
    document.body.append(control);
    const button = control.shadowRoot?.querySelector("button");
    const onChange = vi.fn();
    control.addEventListener("change", onChange);
    button?.click();
    expect(control.internals.formValue).toBe("enabled");
    expect(onChange).toHaveBeenCalledOnce();
    control.setAttribute("disabled", "");
    expect(button?.disabled).toBe(true);
    button?.click();
    expect(onChange).toHaveBeenCalledOnce();
  });
});
