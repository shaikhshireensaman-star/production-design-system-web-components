import { describe, expect, it } from "vitest";
import "../../packages/components/src/toast/pds-toast";

describe("pds-toast", () => {
  it("shows a live message and emits dismissal", () => {
    const toast = document.createElement("pds-toast") as HTMLElement & { show(): void; dismiss(): void }; toast.setAttribute("message", "Saved"); document.body.append(toast);
    const listener = vi.fn(); toast.addEventListener("pds-dismiss", listener);
    toast.show(); expect(toast.shadowRoot?.querySelector("[role=status]")?.textContent).toContain("Saved");
    toast.dismiss(); expect(toast.hasAttribute("open")).toBe(false); expect(listener).toHaveBeenCalledOnce();
  });
});
