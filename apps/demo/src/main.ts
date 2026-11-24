import "@production-design-system/components";
import "@production-design-system/tokens/tokens.css";
import "./web-vitals";

const picker = document.querySelector<HTMLSelectElement>("#theme-picker");
const savedTheme = localStorage.getItem("pds-demo-theme");
if (picker && savedTheme && ["light", "dark", "high-contrast"].includes(savedTheme)) picker.value = savedTheme;
document.documentElement.dataset.theme = picker?.value ?? "light";
picker?.addEventListener("change", () => {
  const update = (): void => { document.documentElement.dataset.theme = picker.value; localStorage.setItem("pds-demo-theme", picker.value); };
  if ("startViewTransition" in document) document.startViewTransition(update); else update();
});

const dialog = document.querySelector<HTMLElement & { open(): void }>("#reservation-dialog");
document.querySelector("#new-reservation")?.addEventListener("click", () => dialog?.open());
document.querySelector("#open-details")?.addEventListener("click", () => {
  const update = (): void => dialog?.open();
  if ("startViewTransition" in document) document.startViewTransition(update); else update();
});
document.querySelector("#orders-table")?.addEventListener("pds-row-select", event => {
  const detail = (event as CustomEvent<{ row: Record<string, string | number | boolean | null> }>).detail;
  const row = detail.row;
  const id = String(row.id ?? "Reservation");
  const content = document.querySelector<HTMLElement>("#reservation-detail");
  const update = (): void => {
    if (content) {
      content.replaceChildren();
      for (const [key, value] of Object.entries(row)) {
        const line = document.createElement("p");
        line.textContent = `${key}: ${String(value ?? "")}`;
        content.append(line);
      }
    }
    dialog?.setAttribute("title", id);
    dialog?.open();
  };
  if ("startViewTransition" in document) document.startViewTransition(update); else update();
});
document.querySelector<HTMLFormElement>("#preferences")?.addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector<HTMLElement & { show(): void }>("#saved-toast")?.show();
});
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}service-worker.js`
    );
  });
}
