import { describe, expect, it } from "vitest";
import "../../packages/components/src/menu/pds-menu";

describe("pds-menu", () => {
  it("opens and closes the accessible menu", () => {
    const menu = document.createElement("pds-menu"); menu.innerHTML = '<span slot="trigger">More</span><button slot="item">Edit</button>'; document.body.append(menu);
    const trigger = menu.shadowRoot?.querySelector<HTMLButtonElement>("[part=trigger]"); const popover = menu.shadowRoot?.querySelector<HTMLElement>("[part=menu]");
    trigger?.click(); expect(popover?.hidden).toBe(false); expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    menu.shadowRoot?.querySelector<HTMLElement>("[part=menu]")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(popover?.hidden).toBe(true);
  });
});
