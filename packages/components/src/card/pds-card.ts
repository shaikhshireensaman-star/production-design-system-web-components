
const cardStyles = new CSSStyleSheet();

cardStyles.replaceSync(`
  :host {
    display: block;
    font-family: inherit;
    color: var(--pds-text, var(--pds-color-neutral-900, #0f172a));
  }

  .card {
    background: var(--pds-surface, #fff);
    border: 1px solid var(--pds-border, #e2e8f0);
    border-radius: var(--pds-radius-lg, 0.75rem);
    padding: var(--pds-spacing-5, 1.25rem);
    box-shadow: var(--pds-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 10%));
  }

  .header {
    margin-bottom: 12px;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }

  .content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--pds-text-muted, #64748b);
  }

  .content ::slotted(*) {
    margin-top: 0;
  }

  .footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--pds-border, #e2e8f0);
  }

  .footer:empty {
    display: none;
  }
`);

export class PdsCard extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["title"];
  }

  private titleElement: HTMLHeadingElement;
  private footerSlot: HTMLSlotElement;

  constructor() {
    super();

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [...(shadow.adoptedStyleSheets ?? []).filter(sheet => sheet !== cardStyles), cardStyles];

    const existingTitle = shadow.querySelector<HTMLHeadingElement>(".title");
    const existingFooter = shadow.querySelector<HTMLSlotElement>('slot[name="footer"]');
    if (existingTitle && existingFooter) {
      this.titleElement = existingTitle;
      this.footerSlot = existingFooter;
      return;
    }

    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("part", "base");

    const header = document.createElement("header");
    header.className = "header";

    this.titleElement = document.createElement("h2");
    this.titleElement.className = "title";
    this.titleElement.setAttribute("part", "title");

    header.append(this.titleElement);

    const content = document.createElement("div");
    content.className = "content";
    content.setAttribute("part", "content");

    const defaultSlot = document.createElement("slot");
    content.append(defaultSlot);

    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.setAttribute("part", "footer");

    this.footerSlot = document.createElement("slot");
    this.footerSlot.name = "footer";
    footer.append(this.footerSlot);

    card.append(header, content, footer);
    shadow.append(card);
  }

  connectedCallback(): void {
    this.updateCard();
  }

  attributeChangedCallback(): void {
    if (this.titleElement) {
      this.updateCard();
    }
  }

  private updateCard(): void {
    const title = this.getAttribute("title") || "";

    this.titleElement.textContent = title;
    this.titleElement.hidden = !title;
  }
}

if (!customElements.get("pds-card")) {
  customElements.define("pds-card", PdsCard);
}
