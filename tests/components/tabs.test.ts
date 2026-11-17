import { describe, expect, it } from "vitest";
import "../../packages/components/src/tabs/pds-tabs";

describe("pds-tabs", () => {
  it("supports selection and arrow key navigation", () => {
    const tabs = document.createElement("pds-tabs"); tabs.innerHTML = '<span slot="tab">One</span><span slot="tab">Two</span><p slot="panel">First</p><p slot="panel">Second</p>'; document.body.append(tabs);
    const buttons = tabs.shadowRoot?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(buttons?.[0]?.getAttribute("aria-selected")).toBe("true");
    buttons?.[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(tabs.getAttribute("selected")).toBe("1");
    expect(tabs.shadowRoot?.querySelectorAll('[role="tabpanel"]')[0]?.hasAttribute("hidden")).toBe(true);
  });
});
