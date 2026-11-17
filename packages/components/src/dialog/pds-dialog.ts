
const dialogStyles = new CSSStyleSheet();

dialogStyles.replaceSync(`
  :host {
    font-family: inherit;
  }

  dialog {
    width: min(30rem, calc(100vw - 2.5rem));
    padding: 0;
    border: 1px solid var(--pds-border, #e2e8f0);
    border-radius: var(--pds-radius-lg, 0.75rem);
    background: var(--pds-surface, #fff);
    color: var(--pds-text, #0f172a);
    box-shadow: var(--pds-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 10%));
  }

  dialog::backdrop {
    background: color-mix(in srgb, var(--pds-color-neutral-950, #020617) 55%, transparent);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--pds-spacing-4, 1rem) var(--pds-spacing-5, 1.25rem);
    border-bottom: 1px solid var(--pds-border, #e2e8f0);
  }

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close {
    border: 0;
    background: transparent;
    color: var(--pds-text-muted, #64748b);
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
  }

  .close:focus-visible,
  .footer button:focus-visible {
    outline: 2px solid var(--pds-focus-ring, var(--pds-color-brand-600, #4f46e5));
    outline-offset: 3px;
  }

  .content {
    padding: var(--pds-spacing-5, 1.25rem);
    font-size: 14px;
    line-height: 1.6;
    color: var(--pds-text-muted, #64748b);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--pds-spacing-2, 0.5rem);
    padding: var(--pds-spacing-3, 0.75rem) var(--pds-spacing-5, 1.25rem);
    border-top: 1px solid var(--pds-border, #e2e8f0);
  }

  .footer button {
    padding: var(--pds-spacing-2, 0.5rem) var(--pds-spacing-4, 1rem);
    border: 0;
    border-radius: var(--pds-radius-sm, 0.25rem);
    background: var(--pds-primary, #4f46e5);
    color: var(--pds-primary-text, #fff);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .footer button:hover {
    background: var(--pds-color-brand-700, #4338ca);
  }

  @media (prefers-reduced-motion: no-preference) {
    dialog[open] {
      animation: appear 0.15s ease-out;
    }

    @keyframes appear {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
`);

export class PdsDialog extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["open", "title"];
  }

  private dialog: HTMLDialogElement;
  private titleElement: HTMLHeadingElement;
  private closeButton: HTMLButtonElement;
  private confirmButton: HTMLButtonElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [dialogStyles];

    this.dialog = document.createElement("dialog");
    this.dialog.setAttribute("part", "base");
    this.dialog.setAttribute("aria-labelledby", "dialog-title");

    const header = document.createElement("header");
    header.className = "header";

    this.titleElement = document.createElement("h2");
    this.titleElement.id = "dialog-title";
    this.titleElement.setAttribute("part", "title");

    this.closeButton = document.createElement("button");
    this.closeButton.className = "close";
    this.closeButton.type = "button";
    this.closeButton.textContent = "×";
    this.closeButton.setAttribute("aria-label", "Close dialog");

    header.append(this.titleElement, this.closeButton);

    const content = document.createElement("div");
    content.className = "content";
    content.setAttribute("part", "content");

    const defaultSlot = document.createElement("slot");
    content.append(defaultSlot);

    const footer = document.createElement("footer");
    footer.className = "footer";

    const footerSlot = document.createElement("slot");
    footerSlot.name = "footer";

    this.confirmButton = document.createElement("button");
    this.confirmButton.type = "button";
    this.confirmButton.textContent = "OK";

    footer.append(footerSlot, this.confirmButton);

    this.dialog.append(header, content, footer);
    shadow.append(this.dialog);

    this.closeButton.addEventListener("click", () => {
      this.close();
    });

    this.confirmButton.addEventListener("click", () => {
      this.dispatchEvent(
        new Event("confirm", { bubbles: true, composed: true })
      );
      this.close();
    });

    this.dialog.addEventListener("cancel", () => {
      this.removeAttribute("open");
    });

    this.dialog.addEventListener("click", (event: MouseEvent) => {
      if (event.target === this.dialog) {
        this.close();
      }
    });
  }

  connectedCallback(): void {
    this.updateDialog();
  }

  attributeChangedCallback(): void {
    if (this.dialog) {
      this.updateDialog();
    }
  }

  private updateDialog(): void {
    this.titleElement.textContent =
      this.getAttribute("title") || "Dialog";

    if (this.hasAttribute("open")) {
      if (!this.dialog.open) {
        this.dialog.showModal();
      }
    } else if (this.dialog.open) {
      this.dialog.close();
    }
  }

  open(): void {
    this.setAttribute("open", "");
  }

  close(): void {
    this.removeAttribute("open");
  }
}

if (!customElements.get("pds-dialog")) {
  customElements.define("pds-dialog", PdsDialog);
}
