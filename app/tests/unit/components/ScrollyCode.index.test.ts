import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createJiti } from "jiti";
import type { ScrollyCodeProps } from "../../../src/components/docs/ScrollyCode/types";

const jsx = { runtime: "automatic" } as const;
const styles = {};
const virtualModules = { "./styles.css": styles };
const options = { jsx, virtualModules, tsconfigPaths: true, fsCache: false, moduleCache: false };
const jiti = createJiti(import.meta.url, options);
const { ScrollyCode, ScrollyCodeProvider } = jiti(
  "../../../src/components/docs/ScrollyCode/index.tsx",
) as typeof import("../../../src/components/docs/ScrollyCode/index");

test("renders command and result links with the command selected initially", () => {
  const html = renderExample("tracking");
  assert.match(html, /href="#track-override" aria-current="step"/);
  assert.match(html, /href="#tracking-result"/);
  const selectedLinks = html.match(/aria-current="step"/g) ?? [];
  assert.equal(selectedLinks.length, 1);
});

test("connects the visible panel to its inline explanatory note", () => {
  const html = renderExample("tracking");
  assert.match(html, /aria-describedby="track-override-callout"/);
  assert.match(html, /id="track-override-callout" class="walkthrough-note"/);
  assert.match(html, /Track the existing qs override/);
});

test("keeps each example's step hashes independent", () => {
  const html = renderExample("cleanup");
  assert.match(html, /href="#remove-unused-override" aria-current="step"/);
  assert.match(html, /id="cleanup-result"/);
  assert.doesNotMatch(html, /id="track-override"/);
});

function renderExample(example: ScrollyCodeProps["example"]) {
  const child = createElement(ScrollyCode, { example });
  const contentRef = { current: null };
  const props = { contentRef, children: child };
  const element = createElement(ScrollyCodeProvider, props);
  const html = renderToStaticMarkup(element);
  return html;
}
