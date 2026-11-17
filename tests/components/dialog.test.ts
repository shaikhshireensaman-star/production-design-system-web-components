import { describe, expect, it, vi } from "vitest";
import "../../packages/components/src/dialog/pds-dialog";

describe("Dialog component", () => {
  it("opens and closes through its public methods", () => {
    const dialog = document.createElement("pds-dialog") as HTMLElement & {
      open(): void;
      close(): void;
    };
    dialog.setAttribute("title", "Confirm action");
    document.body.append(dialog);
    const nativeDialog = dialog.shadowRoot?.querySelector("dialog");

    dialog.open();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(nativeDialog?.open).toBe(true);
    expect(nativeDialog?.getAttribute("aria-labelledby")).toBe("dialog-title");
    dialog.close();
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(nativeDialog?.open).toBe(false);
  });

  it("closes on Escape and confirms before closing", () => {
    const dialog = document.createElement("pds-dialog") as HTMLElement & {
      open(): void;
    };
    document.body.append(dialog);
    const nativeDialog = dialog.shadowRoot?.querySelector("dialog");
    const onConfirm = vi.fn();
    dialog.addEventListener("confirm", onConfirm);
    dialog.open();
    nativeDialog?.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(dialog.hasAttribute("open")).toBe(false);

    dialog.open();
    dialog.shadowRoot?.querySelector<HTMLButtonElement>(".footer button")?.click();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(dialog.hasAttribute("open")).toBe(false);
  });
});
