import { describe, expect, it } from "vitest";
import "../../packages/components/src/card/pds-card";

describe("Card component", () => {
  it("renders a semantic article with default and footer slots", () => {
    const card = document.createElement("pds-card");
    card.setAttribute("title", "Account");
    card.innerHTML = '<p>Summary</p><span slot="footer">Manage</span>';
    document.body.append(card);

    expect(card.shadowRoot?.querySelector("article")).not.toBeNull();
    expect(card.shadowRoot?.querySelector("h2")?.textContent).toBe("Account");
    expect(card.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
    expect(card.shadowRoot?.querySelector('slot[name="footer"]')).not.toBeNull();
    expect(card.querySelector("p")?.textContent).toBe("Summary");
  });
});
