import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../../../.github/workflows/${name}`, import.meta.url), "utf8");

describe("release workflows", () => {
  test("exports the Homebrew version before validation", () => {
    const workflow = readWorkflow("homebrew.yml");
    const exportIndex = workflow.indexOf('export VERSION="${RELEASE_REF#v}"');
    const validationIndex = workflow.indexOf("bun scripts/brew.ts validate-version");

    assert.ok(exportIndex > -1);
    assert.ok(validationIndex > exportIndex);
  });

  test("does not overwrite release assets", () => {
    const workflows = [readWorkflow("publish.yml"), readWorkflow("homebrew.yml")];

    workflows.forEach((workflow) => assert.ok(!workflow.includes("--clobber")));
    workflows.forEach((workflow) => assert.ok(workflow.includes("upload-release-assets.sh")));
  });

  test("publishes draft releases by numeric ID", () => {
    const workflow = readWorkflow("homebrew.yml");

    assert.ok(workflow.includes("path: release-tools"));
    assert.ok(workflow.includes('ref: "${{ github.workflow_sha }}"'));
    assert.ok(workflow.includes("release-tools/scripts/upload-release-assets.sh"));
    assert.ok(workflow.includes("releases/$RELEASE_ID"));
    assert.ok(!workflow.includes('gh release edit "v${VERSION}"'));
  });

  test("audits the packed formula before npm publication", () => {
    const workflow = readWorkflow("publish.yml");
    const auditIndex = workflow.indexOf("brew audit --strict --formula");
    const publishIndex = workflow.indexOf("npm publish");

    assert.ok(workflow.includes("runs-on: macos-latest"));
    assert.ok(workflow.includes("bun scripts/brew.ts generate-local"));
    assert.ok(auditIndex > -1);
    assert.ok(publishIndex > auditIndex);
  });

  test("validates the tag against the package version before publication", () => {
    const workflow = readWorkflow("publish.yml");
    const validationIndex = workflow.indexOf('test "$VERSION" = "$PACKAGE_VERSION"');
    const publishIndex = workflow.indexOf("npm publish");

    assert.ok(validationIndex > -1);
    assert.ok(publishIndex > validationIndex);
  });

  test("configures tap push authentication before cloning", () => {
    const workflow = readWorkflow("homebrew.yml");
    const authIndex = workflow.indexOf("gh auth setup-git --hostname github.com --force");
    const cloneIndex = workflow.indexOf("gh repo clone yowainwright/homebrew-tap tap");

    assert.ok(authIndex > -1);
    assert.ok(cloneIndex > authIndex);
  });

  test("uses ScriptC for release binaries", () => {
    const workflows = [readWorkflow("ci.yml"), readWorkflow("homebrew.yml")];

    workflows.forEach((workflow) => assert.ok(workflow.includes("ScriptC binary")));
  });

  test("always cleans Docker resources after e2e runs", () => {
    const workflow = readWorkflow("ci.yml");
    const cleanupSteps = workflow.match(
      /if: always\(\)\n\s+working-directory: tests\/e2e\n\s+run: docker compose down/g,
    );

    assert.strictEqual(cleanupSteps?.length, 2);
  });
});
