# Production Design System with Web Components

A small pnpm workspace for framework-agnostic design tokens and native Web Components. The components use TypeScript, Custom Elements, and Shadow DOM; the demo and documentation apps use Vite.

## Requirements

- Node.js 20.19+ (or 22.12+)
- pnpm 12.16.1

## Install and run

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm --filter @production-design-system/demo dev
pnpm --filter @production-design-system/docs dev
pnpm --filter @production-design-system/react-example dev
```

Vite prints a local URL for each app. The demo contains interactive examples. The documentation app includes live examples, component APIs, setup, accessibility, tokens, and release notes.

## Use the components

Build the workspace packages, then import the custom elements and generated token stylesheet from your application entry point:

```ts
import "@production-design-system/components";
import "@production-design-system/tokens/tokens.css";
```

Use the elements in HTML:

```html
<pds-button variant="primary">Save</pds-button>
<pds-text-field label="Email" name="email" type="email" required></pds-text-field>
<pds-select
  label="Plan"
  name="plan"
  options='[{"label":"Starter","value":"starter"}]'
></pds-select>
```

The package exports fifteen elements: `pds-button`, `pds-text-field`, `pds-select`, `pds-checkbox`, `pds-radio-group`, `pds-switch`, `pds-badge`, `pds-alert`, `pds-card`, `pds-dialog`, `pds-rating`, `pds-tabs`, `pds-menu`, `pds-toast`, and `pds-data-table`. The data table streams NDJSON and uses a module worker for sorting and filtering. The demo dev server provides a 50,000-row mock endpoint at `/mock/orders.ndjson`. See [apps/docs/index.html](apps/docs/index.html) for component examples and API details.

Form controls use ElementInternals and work in supporting browsers. They expose values, validation, reset, and form-disabled callbacks. Text field and select labels are associated with their native controls; required errors are connected to the relevant controls.

## Design tokens

The tokens source is [packages/tokens/src/tokens.json](packages/tokens/src/tokens.json). Run the tokens build to generate `packages/tokens/dist/tokens.css`. It provides color, typography, spacing, radius, shadow, motion, and light, dark, and high contrast theme values. Set `data-theme="dark"` or `data-theme="high-contrast"` on the document root to select a theme.

## Workspace

- `packages/components`: Custom Element implementations and public exports.
- `packages/tokens`: JSON token source and CSS generator.
- `apps/demo`: Interactive component examples.
- `apps/docs`: Usage and API documentation with live examples.
- `apps/react-example`: React 19 custom event and property integration example.
- `tests/components`: Vitest and JSDOM behavior tests.

## Build, typecheck, and tests

`pnpm build` builds tokens, components, demo, and docs in dependency order. `pnpm typecheck` checks the component, app, and test TypeScript projects. `pnpm test` runs Vitest once. `pnpm test:browser` runs Playwright in Chromium, Firefox, and WebKit; `pnpm test:visual` verifies Chromium screenshots and `pnpm test:visual:update` refreshes the four light/dark catalog baselines. The axe scan report is in [ACCESSIBILITY-REPORT.md](ACCESSIBILITY-REPORT.md). The JSDOM setup provides shims for APIs JSDOM does not fully implement; browser tests exercise actual browser APIs.

The component and token packages are marked private. The build does not publish them. Before publishing, configure package versions, access policy, and registry credentials explicitly.

## Browser support

Use browsers with Custom Elements, Shadow DOM, constructable stylesheets, and form-associated custom elements support for full behavior. The automated JSDOM suite checks component logic and markup; it does not replace manual checks in target browsers or assistive technology.

