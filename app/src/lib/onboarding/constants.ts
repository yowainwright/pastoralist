import type { LockTarget } from "./types";

export const DEFAULT_PACKAGE_JSON = `{
  "name": "acme-app",
  "packageManager": "npm@10.9.0",
  "workspaces": ["apps/*", "packages/*"],
  "overrides": {
    "qs": "6.11.2"
  }
}`;

export const LOCK_TARGETS: LockTarget[] = [
  { filename: "bun.lock", packageManager: "bun" },
  { filename: "bun.lockb", packageManager: "bun" },
  { filename: "yarn.lock", packageManager: "yarn" },
  { filename: "pnpm-lock.yaml", packageManager: "pnpm" },
  { filename: "package-lock.json", packageManager: "npm" },
];

export const FALLBACK_BRANCHES = ["main", "master"] as const;

export const ACTION_YAML_BASE_LINES: string[] = [
  "name: Pastoralist",
  "on: [pull_request]",
  "",
  "jobs:",
  "  dependency-overrides:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: actions/checkout@v6.0.2",
  "      - uses: yowainwright/pastoralist@v1",
  "        with:",
  "          mode: check",
  "          check-security: true",
  "          security-provider: osv",
] as const;
