
import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../packages/components/src/text-field/pds-text-field";

describe("Text Field Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should register the pds-text-field element", () => {
    expect(customElements.get("pds-text-field")).toBeDefined();
  });

  it("should create an input element", () => {
    const field = document.createElement("pds-text-field");
    document.body.append(field);

    expect(field.shadowRoot?.querySelector("input")).not.toBeNull();
  });

  it("should support the required attribute", () => {
    const field = document.createElement("pds-text-field");
    field.setAttribute("required", "");
    document.body.append(field);

    const input = field.shadowRoot?.querySelector("input");

    expect(input?.required).toBe(true);
  });

  it("associates its label and exposes input errors accessibly", () => {
    const field = document.createElement("pds-text-field");
    field.setAttribute("label", "Email address");
    field.setAttribute("type", "email");
    field.setAttribute("required", "");
    document.body.append(field);

    const input = field.shadowRoot?.querySelector("input");
    const label = field.shadowRoot?.querySelector("label");
    expect(label?.htmlFor).toBe(input?.id);
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.getAttribute("aria-describedby")).toBe(`${input?.id}-error`);
  });

  it("updates its form value and forwards input once", () => {
    const field = document.createElement("pds-text-field") as HTMLElement & {
      internals: ElementInternals & { formValue: FormDataEntryValue | null };
    };
    field.setAttribute("name", "email");
    document.body.append(field);

    const input = field.shadowRoot?.querySelector("input");
    const onInput = vi.fn();
    field.addEventListener("input", onInput);
    if (!input) throw new Error("Expected the text input to render");
    input.value = "person@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    expect(field.internals.formValue).toBe("person@example.com");
    expect(onInput).toHaveBeenCalledOnce();
  });
});
