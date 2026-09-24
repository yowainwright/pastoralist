import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SECTION_ID, CONTENT, STYLES } from "../constants";

const cases = [
  {
    name: "has correct section id",
    run: () => {
      assert.strictEqual(SECTION_ID, "get-started");
    },
  },

  {
    name: "has required content",
    run: () => {
      assert.notStrictEqual(CONTENT.heading, undefined);
      assert.notStrictEqual(CONTENT.headingHighlight, undefined);
      assert.strictEqual(CONTENT.command, "npm install -g pastoralist");
      assert.notStrictEqual(CONTENT.buttonText, undefined);
      assert.strictEqual(CONTENT.docsSlug, "introduction");
    },
  },

  {
    name: "has required styles",
    run: () => {
      assert.notStrictEqual(STYLES.section, undefined);
      assert.notStrictEqual(STYLES.article, undefined);
      assert.notStrictEqual(STYLES.articleVisible, undefined);
      assert.notStrictEqual(STYLES.articleHidden, undefined);
      assert.notStrictEqual(STYLES.heading, undefined);
      assert.notStrictEqual(STYLES.nav, undefined);
      assert.notStrictEqual(STYLES.codeBlock, undefined);
      assert.notStrictEqual(STYLES.code, undefined);
      assert.notStrictEqual(STYLES.button, undefined);
    },
  },
];

describe("GetStartedSection", () => {
  describe("constants", () => cases.forEach(({ name, run }) => it(name, run)));
});
