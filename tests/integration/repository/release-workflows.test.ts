import { assertExcludesText, assertContainsText } from "../../unit/scripts/utils";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { findReleaseRange, reviewCommit } from "../../../scripts/release/preflight";

const cases = [
  {
    name: "uses the established external-test dispatch credential and event",
    run: () => {
      const workflow = readWorkflow("test-release.yml");
      assertContainsText(workflow, "github-token: ${{ secrets.REPO_ACCESS_TOKEN }}");
      assertContainsText(workflow, "event_type: 'pastoralist_update'");
      assertExcludesText(workflow, "PASTORALIST_TEST_DISPATCH_TOKEN");
      assertExcludesText(workflow, "event_type: 'pastoralist-release'");
    },
  },
  {
    name: "runs published-release tests from the trusted workflow commit",
    run: () => {
      const workflow = readWorkflow("test-release.yml");
      assertContainsText(workflow, 'ref: "${{ github.workflow_sha }}"');
      assertExcludesText(workflow, "github.event.workflow_run.head_sha");
      assertExcludesText(workflow, "github.event.pull_request");
    },
  },
  {
    name: "builds published-release images from existing files",
    run: () => {
      const workflow = readWorkflow("test-release.yml");
      const sources = Array.from(workflow.matchAll(/^\s+COPY\s+(\S+)\s+/gm));
      assert.ok(sources.length > 0);
      sources.forEach(([, source]) => {
        const path = resolve(source);
        assert.ok(existsSync(path), `Docker COPY source does not exist: ${source}`);
      });
    },
  },
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
    name: "keeps npm tarballs out of Homebrew publication",
    run: () => {
      const workflows = [readWorkflow("publish.yml"), readWorkflow("homebrew.yml")];
      workflows.forEach((workflow) => assertExcludesText(workflow, "FORMULA_PATH"));
      workflows.forEach((workflow) => assertExcludesText(workflow, "brew.ts generate"));
      assertExcludesText(readWorkflow("homebrew.yml"), "npm view");
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
    name: "holds npm approval behind the Sourcery preflight and packed uv smoke",
    run: () => {
      const workflow = readWorkflow("publish.yml");
      const [buildJobs, publishing] = workflow.split("  publish:");
      const [publishJob] = publishing.split("  homebrew:");
      assertContainsText(buildJobs, "workflow_dispatch:");
      assertContainsText(buildJobs, "scripts/release/preflight.ts");
      assertContainsText(buildJobs, "github.event_name == 'push'");
      assertContainsText(buildJobs, "if (context.eventName === 'push') core.setFailed(message);");
      assertContainsText(buildJobs, "npm install --global --ignore-scripts /app/candidate.tgz");
      assertContainsText(buildJobs, "PASTORALIST_CLI=pastoralist bash /app/test.sh");
      assertExcludesText(buildJobs, "id-token: write");
      assertContainsText(publishJob, "needs: [release-preflight, pack-release]");
      assertContainsText(publishJob, "environment: npm-publish");
      assertContainsText(publishJob, "id-token: write");
      assertContainsText(publishJob, "actions/download-artifact@");
      assertContainsText(publishJob, 'npm publish "$TARBALL"');
    },
  },
  {
    name: "runs the installed uv smoke for published versions and excludes preflight runs",
    run: () => {
      const workflow = readWorkflow("test-release.yml");
      const [, smokeTest] = workflow.split("- name: Smoke test the published npm CLI with uv");
      assertContainsText(workflow, "github.event.workflow_run.event == 'push'");
      assertContainsText(smokeTest, "if: steps.version.outputs.uv_supported == 'true'");
      assertContainsText(workflow, 'npm install --global --ignore-scripts "pastoralist@$VERSION"');
      assertContainsText(workflow, "PASTORALIST_CLI=pastoralist bash /app/test.sh");
    },
  },
  {
    name: "delegates formula updates to the tap after publishing binaries",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const publisher = "yowainwright/homebrew-tap/.github/workflows/publish-formula.yml@";
      assertContainsText(workflow, publisher);
      assertExcludesText(workflow, "preflight_only: true");
      assertContainsText(workflow, "needs: publish-binaries");
      assertContainsText(workflow, "package: pastoralist");
      assertContainsText(workflow, "tag: ${{ inputs.version }}");
      assertContainsText(workflow, "tap_token: ${{ secrets.HOMEBREW_TAP_TOKEN }}");
      assertExcludesText(workflow, "gh repo clone");
    },
  },
  {
    name: "validates the binary formula before publishing the stable release",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const steps = [
        "brew-preflight.rb \\",
        "brew --cache --formula",
        "brew audit --strict",
        "brew install --build-from-source",
        "brew test",
        "-F draft=false",
      ];
      const indexes = steps.map((step) => workflow.indexOf(step));
      indexes.forEach((index) => assert.ok(index > -1));
      const ordered = indexes.every(
        (index, position) => position === 0 || index > indexes[position - 1],
      );
      assert.ok(ordered);
      assertContainsText(workflow, 'test -z "$DEPENDENCIES"');
    },
  },
  {
    name: "keeps tap credentials behind the Homebrew environment gate",
    run: () => {
      const workflow = readWorkflow("homebrew.yml");
      const buildJob = workflow.split("  publish-binaries:")[0];
      assertExcludesText(buildJob, "${{ secrets.HOMEBREW_TAP_TOKEN }}");
      const gatedJob = workflow.split("  publish-binaries:")[1].split("  homebrew:")[0];
      assertContainsText(gatedJob, "environment: homebrew-publish");
      assertContainsText(gatedJob, "GH_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}");
      const publisher = workflow.split("  homebrew:")[1];
      assertContainsText(publisher, "needs: publish-binaries");
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

const readWorkflow = (name: string): string =>
  readFileSync(new URL(`../../../.github/workflows/${name}`, import.meta.url), "utf8");

describe("release workflows", () => {
  cases.forEach(({ name, run }) => test(name, run));
});

const publishedVersionCases = [
  ["v1.14.2", "false"],
  ["v1.15.0-beta.0", "true"],
  ["2.0.0", "true"],
] as const;

publishedVersionCases.forEach(([version, supportsUv]) => {
  test(`published release ${version} enables uv smoke: ${supportsUv}`, (t) => {
    const workflow = readWorkflow("test-release.yml");
    const [, versionStep] = workflow.split("id: version\n");
    const [step] = versionStep.split("- name: Wait for NPM Package Availability");
    const [, script] = step.split("run: |\n");
    const root = mkdtempSync(join(tmpdir(), "release-version-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputPath = join(root, "output");
    const env = { BASH_ENV: "/dev/null", INPUT_VERSION: version, GITHUB_OUTPUT: outputPath };
    execFileSync("bash", ["-e", "-c", script], { env });
    const output = readFileSync(outputPath, "utf8");
    const outputs = output.trim().split("\n");
    assert.ok(outputs.includes(`uv_supported=${supportsUv}`), output);
  });
});

const main = { ref: "main" };
const featureHead = { sha: "feature-head" };
const sourcery = { id: 48477, slug: "sourcery-ai" };
const featurePr = {
  number: 695,
  html_url: "https://github.com/yowainwright/pastoralist/pull/695",
  merge_commit_sha: "feature-squash",
  merged_at: "2026-11-18T00:00:00Z",
  base: main,
  head: featureHead,
};
const successCheck = {
  name: "Sourcery review",
  app: sourcery,
  id: 1,
  head_sha: "feature-head",
  status: "completed",
  conclusion: "success",
};

const published = (tag: string) => Promise.resolve(tag !== "v1.14.2");

test("release preflight uses the previous published tag on the first-parent history", async () => {
  const history = ["new-main", "version-squash", "feature-squash", "unpublished", "baseline"];
  const tags = new Map([
    ["version-squash", ["v1.14.3"]],
    ["unpublished", ["v1.14.2"]],
    ["baseline", ["v1.14.1"]],
    ["side-branch", ["v1.14.0"]],
  ]);
  const range = await findReleaseRange("version-squash", { history, tags, published });
  const commits = ["unpublished", "feature-squash", "version-squash"];
  assert.deepEqual(range, {
    baseline: "v1.14.1",
    commits,
  });
  await assert.rejects(
    findReleaseRange("side-branch", { history, tags, published }),
    /first.parent/,
  );
});

const otherApp = { id: 99, slug: "other" };
const otherAppCheck = Object.assign({}, successCheck, { app: otherApp });
const oldHeadCheck = Object.assign({}, successCheck, { head_sha: "old-head" });
const skippedCheck = Object.assign({}, successCheck, { id: 2, conclusion: "skipped" });
const pendingCheck = Object.assign({}, successCheck, { id: 2, status: "queued", conclusion: null });
const neutralCheck = Object.assign({}, successCheck, { conclusion: "neutral" });
const reviewCases = [
  ["accepts the installed app's check on the squash PR head", [successCheck], "success"],
  ["ignores a matching check name from another app", [otherAppCheck], "missing"],
  ["ignores a successful check on an old PR head", [oldHeadCheck], "missing"],
  ["rejects a newer skipped check after success", [skippedCheck, successCheck], "skipped"],
  ["rejects a newer pending check", [successCheck, pendingCheck], "not completed (queued)"],
  ["rejects neutral checks", [neutralCheck], "neutral"],
  ["rejects duplicate latest checks", [successCheck, successCheck], "ambiguous check runs"],
] as const;

reviewCases.forEach(([name, checks, conclusion]) => {
  test(`release preflight ${name}`, async () => {
    const pullRequests = () => Promise.resolve([featurePr]);
    const checkRuns = (head: string) => {
      assert.equal(head, featurePr.head.sha);
      const result = Promise.resolve(checks);
      return result;
    };
    const result = await reviewCommit(featurePr.merge_commit_sha, { pullRequests, checkRuns });
    assert.equal(result.conclusion, conclusion);
    assert.equal(result.pullUrl, featurePr.html_url);
  });
});

test("release preflight keeps a skipped feature review visible beside a green version PR", async () => {
  const versionHead = { sha: "version-head" };
  const versionPr = Object.assign({}, featurePr, {
    merge_commit_sha: "version-squash",
    head: versionHead,
  });
  const pullRequests = () => Promise.resolve([featurePr, versionPr]);
  const checkRuns = (head: string) => {
    const isVersionHead = head === versionHead.sha;
    const conclusion = isVersionHead ? "success" : "skipped";
    const check = Object.assign({}, successCheck, { head_sha: head, conclusion });
    const checks = Promise.resolve([check]);
    return checks;
  };
  const feature = await reviewCommit(featurePr.merge_commit_sha, { pullRequests, checkRuns });
  const version = await reviewCommit(versionPr.merge_commit_sha, { pullRequests, checkRuns });
  assert.deepEqual([feature.conclusion, version.conclusion], ["skipped", "success"]);
});
