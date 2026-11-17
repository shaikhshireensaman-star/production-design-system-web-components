import { describe, expect, it } from "vitest";
import "../../packages/components/src/data-table/pds-data-table";

describe("pds-data-table", () => {
  it("registers with a labelled filter and table structure", () => {
    const table = document.createElement("pds-data-table"); document.body.append(table);
    expect(table.shadowRoot?.querySelector('input[aria-label="Filter table rows"]')).not.toBeNull();
    expect(table.shadowRoot?.querySelector("table")).not.toBeNull();
    expect(customElements.get("pds-data-table")).toBeDefined();
  });
});
