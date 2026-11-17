import "@production-design-system/components";
import "@production-design-system/tokens/tokens.css";
import "./style.css";

const requestedTheme = new URL(location.href).searchParams.get("theme");
if (["light", "dark", "high-contrast"].includes(requestedTheme ?? "")) {
  document.documentElement.dataset.theme = requestedTheme!;
}

const dialog = document.querySelector("#docs-dialog");
const openButton = document.querySelector("#show-dialog");

if (dialog instanceof HTMLElement && openButton) {
  openButton.addEventListener("click", () => {
    (dialog as HTMLElement & { open(): void }).open();
  });
}

const toast = document.querySelector<HTMLElement & { show(): void }>("#docs-toast");
document.querySelector("#show-toast")?.addEventListener("click", () => toast?.show());
