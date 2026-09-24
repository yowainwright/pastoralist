import { assertExcludesText, assertContainsText } from "./utils";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../../../.github/workflows/${name}`, import.meta.url), "utf8");

const cases = [
  {
    name: "exports the Homebrew version before validation",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const steps = [
        'export VERSION="${RELEASE_REF#v}"',
        "pnpm exec jiti scripts/release/brew.ts validate-version",
      ];
      const [exportIndex, validationIndex] = steps.map((step) => workflow.indexOf(step));

      assert.ok(exportIndex > -1);
      assert.ok(validationIndex > exportIndex);
    },
  },
  {
    name: "does not overwrite release assets",
    run: () => {
      const workflows = [readWorkflow("publish.yml"), readWorkflow("homebrew.yml")];

      workflows.forEach((workflow) => assertExcludesText(workflow, "--clobber"));
      workflows.forEach((workflow) =>
        assertContainsText(workflow, "scripts/release/upload-assets.sh"),
      );
    },
  },
  {
    name: "publishes draft releases by numeric ID",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");

      assertContainsText(workflow, "path: release-tools");
      assertContainsText(workflow, 'ref: "${{ github.workflow_sha }}"');
      assertContainsText(workflow, "release-tools/scripts/release/upload-assets.sh");
      assertContainsText(workflow, "releases/$RELEASE_ID");
      assertExcludesText(workflow, 'gh release edit "v${VERSION}"');
    },
  },
  {
    name: "audits the packed formula before npm publication",
    run: () => {
      const workflow = readWorkflow("publish.yml");
      const steps = ["brew audit --strict --formula", "npm publish"];
      const [auditIndex, publishIndex] = steps.map((step) => workflow.indexOf(step));

      assertContainsText(workflow, "runs-on: macos-latest");
      assertContainsText(workflow, "pnpm exec jiti scripts/release/brew.ts generate-local");
      assert.ok(auditIndex > -1);
      assert.ok(publishIndex > auditIndex);
    },
  },
  {
    name: "validates the tag against the package version before publication",
    run: () => {
      const workflow = readWorkflow("publish.yml");
      const steps = ['test "$VERSION" = "$PACKAGE_VERSION"', "npm publish"];
      const [validationIndex, publishIndex] = steps.map((step) => workflow.indexOf(step));

      assert.ok(validationIndex > -1);
      assert.ok(publishIndex > validationIndex);
    },
  },
  {
    name: "configures tap push authentication before cloning",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const steps = [
        "gh auth setup-git --hostname github.com --force",
        "gh repo clone yowainwright/homebrew-tap tap",
      ];
      const [authIndex, cloneIndex] = steps.map((step) => workflow.indexOf(step));

      assert.ok(authIndex > -1);
      assert.ok(cloneIndex > authIndex);
    },
  },
  {
    name: "uses ScriptC for release binaries",
    run: () => {
      const workflows = [readWorkflow("ci.yml"), readWorkflow("homebrew.yml")];

      workflows.forEach((workflow) => assertContainsText(workflow, "ScriptC binary"));
    },
  },
  {
    name: "publishes the Homebrew binary asset matrix",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const targets = ["darwin-arm64", "darwin-amd64", "linux-arm64", "linux-amd64"];

      targets.forEach((target) => assertContainsText(workflow, `target: ${target}`));
      assertContainsText(workflow, "actions/upload-artifact@");
      assertContainsText(workflow, "actions/download-artifact@");
      assertExcludesText(workflow, "mapfile");
      assertContainsText(workflow, "while IFS= read -r asset; do");
      assertContainsText(workflow, "pastoralist-darwin-*");
      assertContainsText(workflow, "pastoralist-linux-*");
      assertContainsText(workflow, 'test "${#BINARY_ASSETS[@]}" -eq 8');
    },
  },
  {
    name: "always cleans Docker resources after e2e runs",
    run: () => {
      const workflow = readWorkflow("ci.yml");
      const cleanupSteps = workflow.match(
        /if: always\(\)\n\s+working-directory: tests\/e2e\n\s+run: docker compose down/g,
      );

      assert.strictEqual(cleanupSteps?.length, 2);
    },
  },
];

describe("release workflows", () => {
  cases.forEach(({ name, run }) => test(name, run));
});
