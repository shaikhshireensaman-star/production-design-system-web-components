import { describe, expect, it } from "vitest";
import "../../packages/components/src/badge/pds-badge";

describe("Badge component", () => {
  it("renders label text and applies the selected variant", () => {
    const badge = document.createElement("pds-badge");
    badge.setAttribute("label", "Ready");
    badge.setAttribute("variant", "success");
    document.body.append(badge);

    const view = badge.shadowRoot?.querySelector(".badge");
    expect(view?.textContent).toBe("Ready");
    expect(view?.classList.contains("success")).toBe(true);
    badge.setAttribute("variant", "invalid");
    expect(view?.classList.contains("neutral")).toBe(true);
  });
});
