import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const WORKFLOW_TEMPLATE = `name: Pastoralist Security Check

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  security-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'

      - name: Detect package manager
        id: detect
        run: |
          if [ -f "bun.lockb" ]; then
            echo "manager=bun" >> $GITHUB_OUTPUT
          elif [ -f "pnpm-lock.yaml" ]; then
            echo "manager=pnpm" >> $GITHUB_OUTPUT
          elif [ -f "yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
          else
            echo "manager=npm" >> $GITHUB_OUTPUT
          fi

      - name: Setup Bun (if needed)
        if: steps.detect.outputs.manager == 'bun'
        uses: oven-sh/setup-bun@v2

      - name: Setup pnpm (if needed)
        if: steps.detect.outputs.manager == 'pnpm'
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Install dependencies
        run: |
          if [ "\${{ steps.detect.outputs.manager }}" = "bun" ]; then
            bun install
          elif [ "\${{ steps.detect.outputs.manager }}" = "pnpm" ]; then
            pnpm install
          elif [ "\${{ steps.detect.outputs.manager }}" = "yarn" ]; then
            yarn install
          else
            npm install
          fi

      - name: Run Pastoralist security check
        run: |
          if [ "\${{ steps.detect.outputs.manager }}" = "bun" ]; then
            bunx pastoralist --checkSecurity
          elif [ "\${{ steps.detect.outputs.manager }}" = "pnpm" ]; then
            pnpm exec pastoralist --checkSecurity
          elif [ "\${{ steps.detect.outputs.manager }}" = "yarn" ]; then
            yarn pastoralist --checkSecurity
          else
            npx pastoralist --checkSecurity
          fi

      - name: Check for uncommitted changes
        run: |
          if [ -n "\$(git status --porcelain)" ]; then
            echo "Error: Pastoralist made changes to package.json"
            echo "Please run 'npx pastoralist' locally and commit the changes"
            git diff
            exit 1
          fi

      - name: Comment on PR
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ Pastoralist detected changes needed in package.json. Please run \`npx pastoralist\` locally and commit the changes.'
            })
`;

interface SetupCIOptions {
  root?: string;
}

export async function setupCICommand(options: SetupCIOptions = {}): Promise<void> {
  const root = options.root || process.cwd();
  const workflowDir = resolve(root, ".github/workflows");
  const workflowPath = join(workflowDir, "pastoralist.yml");

  const workflowDirExists = existsSync(workflowDir);
  if (!workflowDirExists) {
    mkdirSync(workflowDir, { recursive: true });
    console.log("Created .github/workflows directory");
  }

  const workflowExists = existsSync(workflowPath);
  if (workflowExists) {
    console.log("\nGitHub Actions workflow already exists at:");
    console.log(workflowPath);
    console.log("\nTo update it, delete the file and run this command again.");
    return;
  }

  writeFileSync(workflowPath, WORKFLOW_TEMPLATE);

  console.log("\n✓ Created GitHub Actions workflow:");
  console.log(workflowPath);
  console.log("\nThis workflow will:");
  console.log("  - Run on pull requests and pushes to main/master");
  console.log("  - Run weekly security scans");
  console.log("  - Fail if package.json changes are uncommitted");
  console.log("  - Comment on PRs when changes are needed");
  console.log("\nCommit this file to enable automated security checks.");
}
