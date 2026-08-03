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
    workflows.forEach((workflow) => expect(workflow).toContain("upload-release-assets.sh"));
  });

  test("publishes draft releases by numeric ID", () => {
    const workflow = readWorkflow("homebrew.yml");

    expect(workflow).toContain("path: release-tools");
    expect(workflow).toContain('ref: "${{ github.workflow_sha }}"');
    expect(workflow).toContain("release-tools/scripts/upload-release-assets.sh");
    expect(workflow).toContain("releases/$RELEASE_ID");
    expect(workflow).not.toContain('gh release edit "v${VERSION}"');
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

  test("validates the tag against the package version before publication", () => {
    const workflow = readWorkflow("publish.yml");
    const validationIndex = workflow.indexOf('test "$VERSION" = "$PACKAGE_VERSION"');
    const publishIndex = workflow.indexOf("npm publish");

    expect(validationIndex).toBeGreaterThan(-1);
    expect(publishIndex).toBeGreaterThan(validationIndex);
  });

  test("configures tap push authentication before cloning", () => {
    const workflow = readWorkflow("homebrew.yml");
    const authIndex = workflow.indexOf("gh auth setup-git --hostname github.com --force");
    const cloneIndex = workflow.indexOf("gh repo clone yowainwright/homebrew-tap tap");

    expect(authIndex).toBeGreaterThan(-1);
    expect(cloneIndex).toBeGreaterThan(authIndex);
  });

  test("uses ScriptC for release binaries", () => {
    const workflows = [readWorkflow("ci.yml"), readWorkflow("homebrew.yml")];

    workflows.forEach((workflow) => expect(workflow).toContain("ScriptC binary"));
  });
});
