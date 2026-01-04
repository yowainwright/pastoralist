import { describe, it, expect } from "bun:test";
import { SECTION_ID, CONTENT, STYLES } from "../constants";

describe("GetStartedSection", () => {
  describe("constants", () => {
    it("has correct section id", () => {
      expect(SECTION_ID).toBe("get-started");
    });

    it("has required content", () => {
      expect(CONTENT.heading).toBeDefined();
      expect(CONTENT.headingHighlight).toBeDefined();
      expect(CONTENT.command).toBe("bun add -g pastoralist");
      expect(CONTENT.buttonText).toBeDefined();
      expect(CONTENT.docsSlug).toBe("introduction");
    });

    it("has required styles", () => {
      expect(STYLES.section).toBeDefined();
      expect(STYLES.article).toBeDefined();
      expect(STYLES.articleVisible).toBeDefined();
      expect(STYLES.articleHidden).toBeDefined();
      expect(STYLES.heading).toBeDefined();
      expect(STYLES.nav).toBeDefined();
      expect(STYLES.codeBlock).toBeDefined();
      expect(STYLES.code).toBeDefined();
      expect(STYLES.button).toBeDefined();
    });
  });
});
