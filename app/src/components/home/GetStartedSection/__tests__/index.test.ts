import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SECTION_ID, CONTENT, STYLES } from "../constants";

describe("GetStartedSection", () => {
  describe("constants", () => {
    it("has correct section id", () => {
      assert.strictEqual(SECTION_ID, "get-started");
    });

    it("has required content", () => {
      assert.notStrictEqual(CONTENT.heading, undefined);
      assert.notStrictEqual(CONTENT.headingHighlight, undefined);
      assert.strictEqual(CONTENT.command, "bun add -g pastoralist");
      assert.notStrictEqual(CONTENT.buttonText, undefined);
      assert.strictEqual(CONTENT.docsSlug, "introduction");
    });

    it("has required styles", () => {
      assert.notStrictEqual(STYLES.section, undefined);
      assert.notStrictEqual(STYLES.article, undefined);
      assert.notStrictEqual(STYLES.articleVisible, undefined);
      assert.notStrictEqual(STYLES.articleHidden, undefined);
      assert.notStrictEqual(STYLES.heading, undefined);
      assert.notStrictEqual(STYLES.nav, undefined);
      assert.notStrictEqual(STYLES.codeBlock, undefined);
      assert.notStrictEqual(STYLES.code, undefined);
      assert.notStrictEqual(STYLES.button, undefined);
    });
  });
});
