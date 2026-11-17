import { describe, expect, it } from "vitest";
import "../../packages/components/src/rating/pds-rating";

describe("pds-rating", () => {
  it("renders accessible stars and dispatches selection changes", () => {
    const rating = document.createElement("pds-rating"); rating.setAttribute("label", "Stay rating"); document.body.append(rating);
    expect(rating.shadowRoot?.querySelectorAll("button")).toHaveLength(5);
    expect(rating.getAttribute("aria-label")).toBe("Stay rating");
    const listener = vi.fn(); rating.addEventListener("pds-change", listener);
    rating.shadowRoot?.querySelectorAll("button")[3]?.click();
    expect(rating.getAttribute("value")).toBe("4"); expect(listener).toHaveBeenCalledOnce();
  });
});
