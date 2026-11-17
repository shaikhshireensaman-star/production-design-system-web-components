import { describe, expect, it } from "vitest";
import "../../packages/components/src/alert/pds-alert";

describe("Alert component", () => {
  it("uses an alert role and updates variant, title, and message", () => {
    const alert = document.createElement("pds-alert");
    alert.setAttribute("variant", "warning");
    alert.setAttribute("title", "Review required");
    alert.setAttribute("message", "Check the details.");
    document.body.append(alert);

    expect(alert.shadowRoot?.querySelector('[role="alert"]')).not.toBeNull();
    expect(alert.shadowRoot?.querySelector(".alert")?.classList.contains("warning")).toBe(true);
    expect(alert.shadowRoot?.querySelector(".title")?.textContent).toBe("Review required");
    expect(alert.shadowRoot?.querySelector(".message")?.textContent).toBe("Check the details.");
    expect(alert.shadowRoot?.querySelector(".icon")?.getAttribute("aria-hidden")).toBe("true");
  });
});
