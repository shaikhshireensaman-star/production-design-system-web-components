
import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../packages/components/src/button/pds-button";

describe("Button Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should register the pds-button element", () => {
    expect(customElements.get("pds-button")).toBeDefined();
  });

  it("should create a button element", () => {
    const button = document.createElement("pds-button");
    document.body.append(button);

    expect(button.shadowRoot).not.toBeNull();
    expect(button.shadowRoot?.querySelector("button")).not.toBeNull();
  });

  it("should support the disabled attribute", () => {
    const button = document.createElement("pds-button");
    button.setAttribute("disabled", "");
    document.body.append(button);

    const internalButton = button.shadowRoot?.querySelector("button");

    expect(internalButton?.disabled).toBe(true);
  });

  it("updates variant and type when attributes change", () => {
    const button = document.createElement("pds-button");
    button.setAttribute("variant", "secondary");
    button.setAttribute("type", "submit");
    document.body.append(button);

    const internalButton = button.shadowRoot?.querySelector("button");
    expect(internalButton?.className).toBe("secondary");
    expect(internalButton?.type).toBe("submit");
    button.setAttribute("variant", "unknown");
    expect(internalButton?.className).toBe("primary");
  });

  it("supports slotted text and forwards click", () => {
    const button = document.createElement("pds-button");
    button.textContent = "Save";
    const onClick = vi.fn();
    button.addEventListener("click", onClick);
    document.body.append(button);
    button.shadowRoot?.querySelector("button")?.click();

    expect(button.shadowRoot?.querySelector("slot")).not.toBeNull();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
