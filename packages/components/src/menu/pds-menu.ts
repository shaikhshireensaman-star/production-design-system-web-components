const styles = new CSSStyleSheet();
styles.replaceSync(`:host{position:relative;display:inline-block}button{font:inherit} [part=trigger]{cursor:pointer;anchor-name:--pds-menu-trigger}[part=menu]{position:absolute;z-index:10;top:calc(100% + .25rem);right:0;min-width:12rem;padding:.25rem;background:var(--pds-surface,#fff);color:var(--pds-text,#0f172a);border:1px solid var(--pds-border,#cbd5e1);border-radius:.5rem;box-shadow:0 4px 14px #0002}[part=menu][hidden]{display:none}@supports (position-anchor: --pds-menu-trigger){[part=menu]{position:fixed;position-anchor:--pds-menu-trigger;top:anchor(bottom);right:anchor(right);margin-top:.25rem}}[part=item]{display:block;width:100%;text-align:left;padding:.6rem;border:0;background:none;color:inherit;cursor:pointer}[part=item]:hover,[part=item]:focus{background:var(--pds-surface-hover,#f1f5f9);outline:0}`);
export class PdsMenu extends HTMLElement {
  private root: ShadowRoot;
  private trigger: HTMLButtonElement;
  private menu: HTMLDivElement;
  constructor() {
    super(); this.root = this.attachShadow({ mode: "open" }); this.root.adoptedStyleSheets = [styles];
    this.trigger = document.createElement("button"); this.trigger.type = "button"; this.trigger.setAttribute("part", "trigger"); this.trigger.setAttribute("aria-haspopup", "menu"); this.trigger.setAttribute("aria-expanded", "false"); const ts = document.createElement("slot"); ts.name = "trigger"; this.trigger.append(ts);
    this.menu = document.createElement("div"); this.menu.setAttribute("part", "menu"); this.menu.setAttribute("role", "menu"); this.menu.hidden = true; const ms = document.createElement("slot"); ms.name = "item"; this.menu.append(ms); this.root.append(this.trigger, this.menu);
    this.trigger.addEventListener("click", () => this.toggle());
    this.menu.addEventListener("keydown", e => this.onKey(e));
    this.addEventListener("click", e => { if (e.target instanceof Element && e.target.closest('[slot="item"]')) this.close(); });
    this.root.addEventListener("slotchange", () => this.updateItems());
    this.root.addEventListener("click", e => { if (e.target instanceof HTMLButtonElement && e.target.parentElement === this.menu) this.close(); });
  }
  connectedCallback(): void { this.updateItems(); }
  private updateItems(): void { this.querySelectorAll<HTMLElement>('[slot="item"]').forEach(el => { el.setAttribute("role", "menuitem"); el.tabIndex = -1; }); }
  private toggle(): void { this.menu.hidden ? this.open() : this.close(); }
  private open(): void { this.menu.hidden = false; this.trigger.setAttribute("aria-expanded", "true"); this.querySelector<HTMLElement>('[slot="item"]')?.focus(); }
  private close(): void { this.menu.hidden = true; this.trigger.setAttribute("aria-expanded", "false"); this.trigger.focus(); }
  private onKey(e: KeyboardEvent): void { const items = [...this.querySelectorAll<HTMLElement>('[slot="item"]')]; const i = items.indexOf(document.activeElement as HTMLElement); if (e.key === "Escape") { e.preventDefault(); this.close(); } else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); } else if (e.key === "Home") items[0]?.focus(); else if (e.key === "End") items.at(-1)?.focus(); }
}
if (!customElements.get("pds-menu")) customElements.define("pds-menu", PdsMenu);
