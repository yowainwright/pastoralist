import type { DocMeta } from "./types";

const INTRODUCTION_TAGS = ["overview", "dependency overrides", "tracking", "appendix"];
const SETUP_TAGS = ["installation", "npm", "pnpm", "yarn", "bun", "postinstall"];
const ONBOARDING_TAGS = ["getting started", "doctor", "agent skill", "init", "ci"];
const SECURITY_TAGS = ["cve", "vulnerabilities", "osv", "security providers", "best case"];
const WORKSPACES_TAGS = ["monorepo", "workspace", "depPaths", "package discovery"];
const ADVANCED_TAGS = ["remove-unused", "patch-package", "nested overrides", "compact appendix"];
const CODELAB_TAGS = ["tutorial", "quick start", "express", "qs", "generate tracking"];
const API_TAGS = ["cli", "commands", "flags", "node.js", "json output", "api"];
const ARCHITECTURE_TAGS = ["internals", "dependency graph", "resolution", "caching", "mermaid"];
const TROUBLESHOOTING_TAGS = ["errors", "debugging", "faq", "unused overrides", "keep constraints"];
const CONFIGURATION_TAGS = [
  "settings",
  "config file",
  "ledger",
  "overrideSource",
  "appendixSource",
];
const GITHUB_ACTION_TAGS = ["workflow", "continuous integration", "github actions", "automation"];

export const DOCS = [
  {
    slug: "introduction",
    title: "Introduction to Pastoralist",
    description: "Pastoralist keeps dependency overrides explainable, current, and removable",
    tags: INTRODUCTION_TAGS,
  },
  {
    slug: "setup",
    title: "Setup",
    description: "Install Pastoralist and keep your override appendix current",
    tags: SETUP_TAGS,
  },
  {
    slug: "onboarding",
    title: "Onboarding",
    description: "First-run checklist for local use, agent setup, and CI",
    tags: ONBOARDING_TAGS,
  },
  {
    slug: "security",
    title: "Security Vulnerability Detection",
    description: "Detect vulnerabilities and select lowest-risk dependency portfolios",
    tags: SECURITY_TAGS,
    usesMath: true,
  },
  {
    slug: "workspaces",
    title: "Workspaces & Monorepos",
    description: "Using pastoralist in workspace and monorepo environments",
    tags: WORKSPACES_TAGS,
  },
  {
    slug: "advanced-features",
    title: "Advanced Features",
    description: "Advanced cleanup, patch tracking, and override management workflows",
    tags: ADVANCED_TAGS,
  },
  {
    slug: "codelab",
    title: "Interactive Tutorial",
    description: "Learn Pastoralist step by step",
    tags: CODELAB_TAGS,
  },
  {
    slug: "api-reference",
    title: "API Reference",
    description: "Complete reference for pastoralist CLI and Node.js API",
    tags: API_TAGS,
  },
  {
    slug: "architecture",
    title: "Architecture",
    description:
      "How Pastoralist reads overrides, writes the appendix, tracks patches, and handles cleanup",
    tags: ARCHITECTURE_TAGS,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting & FAQ",
    description: "Common issues and frequently asked questions",
    tags: TROUBLESHOOTING_TAGS,
  },
  {
    slug: "configuration",
    title: "Configuration",
    description: "Configure Pastoralist with package.json, rc files, or JavaScript config files",
    tags: CONFIGURATION_TAGS,
  },
  {
    slug: "github-action",
    title: "GitHub Action",
    description: "Automated dependency override management for CI",
    tags: GITHUB_ACTION_TAGS,
  },
] satisfies readonly DocMeta[];
