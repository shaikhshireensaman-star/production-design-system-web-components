import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(currentDir, "..");

const inputFile = path.join(packageDir, "src", "tokens.json");
const outputDir = path.join(packageDir, "dist");
const outputFile = path.join(outputDir, "tokens.css");

const tokens = JSON.parse(fs.readFileSync(inputFile, "utf8"));

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function flattenTokens(object, prefix = []) {
  const result = [];

  for (const [key, value] of Object.entries(object)) {
    if (key === "themes") continue;

    const currentPath = [...prefix, key];

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenTokens(value, currentPath));
    } else {
      result.push(`  --pds-${currentPath.map(toKebabCase).join("-")}: ${value};`);
    }
  }

  return result;
}

function createThemeCSS(themeName, values) {
  const selector = {
    light: ':root, [data-theme="light"]',
    dark: '[data-theme="dark"]',
    highContrast: '[data-theme="high-contrast"]'
  }[themeName];

  const variables = Object.entries(values).map(
    ([key, value]) => `  --pds-${toKebabCase(key)}: ${value};`
  );

  return `${selector} {\n${variables.join("\n")}\n}`;
}

const globalCSS = flattenTokens(tokens).join("\n");

const themeCSS = Object.entries(tokens.themes)
  .map(([name, values]) => createThemeCSS(name, values))
  .join("\n\n");

const css = `/* Generated from src/tokens.json. Do not edit manually. */
@layer tokens, themes;

@layer tokens {
:root {
  color-scheme: light;
${globalCSS}
}
}

[data-theme="dark"] {
  color-scheme: dark;
}

@layer themes {
${themeCSS}
}
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, css, "utf8");

console.log("SUCCESS: Design tokens CSS generated.");
console.log(`Output: ${outputFile}`);
