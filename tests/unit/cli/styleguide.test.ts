import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatStyleguide,
  showStyleguide,
  type StyleguidePrompts,
} from "../../../src/cli/styleguide";
import type { Output } from "../../../src/dx";

const ANSI_COLOR_PATTERN = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");

const createOutput = (): Output & { output: string } => {
  let output = "";
  return {
    get output() {
      return output;
    },
    write: (text: string) => {
      output += text;
    },
    writeLine: (text: string) => {
      output += `${text}\n`;
    },
    clearLine: () => {},
    hideCursor: () => {},
    showCursor: () => {},
  };
};

const createStyleguidePrompts = (
  selections: string[],
  checked: string[] = ["pnpm"],
): StyleguidePrompts => {
  let selectionIndex = 0;
  return {
    select: async () => {
      const selection = selections[selectionIndex] ?? "exit";
      selectionIndex += 1;
      return selection;
    },
    checkbox: async () => checked,
    confirm: async () => true,
    input: async (_message, defaultValue) => defaultValue ?? "pastoralist",
    list: async () => "pnpm",
  };
};

test("formatStyleguide renders a deterministic public DX preview", () => {
  const rendered = formatStyleguide().replace(ANSI_COLOR_PATTERN, "");

  assert.match(rendered, /DX styleguide/);
  assert.match(rendered, /Colors and links/);
  assert.match(rendered, /visible width/);
  assert.match(rendered, /Prompts/);
  assert.match(rendered, /DX metrics/);
  assert.match(rendered, /Spinner/);
  assert.match(rendered, /Shimmer/);
  assert.match(rendered, /Hint/);
  assert.match(rendered, /Terminal graph/);
});

test("showStyleguide renders each DX component group", async () => {
  const output = createOutput();
  const prompts = createStyleguidePrompts(["all", "exit"]);

  await showStyleguide(output, prompts);

  const rendered = output.output.replace(ANSI_COLOR_PATTERN, "");
  assert.match(rendered, /DX styleguide/);
  assert.match(rendered, /Colors and links/);
  assert.match(rendered, /Formatting/);
  assert.match(rendered, /Prompts/);
  assert.match(rendered, /DX metrics/);
  assert.match(rendered, /Spinner/);
  assert.match(rendered, /Shimmer/);
  assert.match(rendered, /Hint/);
  assert.match(rendered, /Scanning dependencies/);
  assert.match(rendered, /DX styleguide complete/);
});

test("showStyleguide runs interactive prompt demos without changing files", async () => {
  const output = createOutput();
  const prompts = createStyleguidePrompts(["prompts", "exit"], ["npm", "pnpm"]);

  await showStyleguide(output, prompts);

  const rendered = output.output.replace(ANSI_COLOR_PATTERN, "");
  assert.match(rendered, /Interactive prompts/);
  assert.match(rendered, /Confirmed: yes/);
  assert.match(rendered, /Input: pastoralist/);
  assert.match(rendered, /List: pnpm/);
  assert.match(rendered, /Selected: npm, pnpm/);
  assert.match(rendered, /Prompts/);
});
