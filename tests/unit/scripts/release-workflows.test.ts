import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../../../.github/workflows/${name}`, import.meta.url), "utf8");

describe("release workflows", () => {
  test("exports the Homebrew version before validation", () => {
    const workflow = readWorkflow("homebrew.yml");
    const exportIndex = workflow.indexOf('export VERSION="${RELEASE_REF#v}"');
    const validationIndex = workflow.indexOf("bun scripts/brew.ts validate-version");

    expect(exportIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeGreaterThan(exportIndex);
  });

  test("does not overwrite release assets", () => {
    const workflows = [readWorkflow("publish.yml"), readWorkflow("homebrew.yml")];

    workflows.forEach((workflow) => expect(workflow).not.toContain("--clobber"));
    workflows.forEach((workflow) =>
      expect(workflow).toContain("sh scripts/upload-release-assets.sh"),
    );
  });

  test("audits the packed formula before npm publication", () => {
    const workflow = readWorkflow("publish.yml");
    const auditIndex = workflow.indexOf("brew audit --strict --formula");
    const publishIndex = workflow.indexOf("npm publish");

    expect(workflow).toContain("runs-on: macos-latest");
    expect(workflow).toContain("bun scripts/brew.ts generate-local");
    expect(auditIndex).toBeGreaterThan(-1);
    expect(publishIndex).toBeGreaterThan(auditIndex);
  });

  test("uses ScriptC for release binaries", () => {
    const workflows = [readWorkflow("ci.yml"), readWorkflow("homebrew.yml")];

    workflows.forEach((workflow) => expect(workflow).toContain("ScriptC binary"));
  });
});
