import type { PromptChoice } from "./types";

export const WORKSPACE_TYPES = {
  standard: ["packages/*/package.json", "apps/*/package.json"],
  "packages-only": ["packages/*/package.json"],
  "apps-only": ["apps/*/package.json"],
  custom: null,
} as const;

export const MAIN_ACTION_CHOICES: PromptChoice[] = [
  { name: "🔍 Auto-detect workspace", value: "auto-detect" },
  { name: "📝 Manual paths", value: "manual-paths" },
  { name: "📁 Specific override path", value: "override-path" },
  { name: "⏭️  Skip", value: "skip" },
  { name: "❓ Help", value: "learn-more" },
];

export const WORKSPACE_STRUCTURE_CHOICES: PromptChoice[] = [
  { name: "Standard (packages/* and apps/*)", value: "standard" },
  { name: "Packages only", value: "packages-only" },
  { name: "Apps only", value: "apps-only" },
  { name: "Custom", value: "custom" },
];

export const DEFAULTS = {
  customPath: "packages/*/package.json",
  confirmChoice: true,
  saveConfig: true,
  skipConfirm: false,
} as const;

export const MESSAGES = {
  monorepoDetected: "🔍 Monorepo configuration needed",
  skipWarning: "⚠️  override(s) won't be tracked properly",
  saveSuccess: "✅ Configuration will be saved to package.json",
  useOnceSuccess: "✅ Using configuration for this run only",
  helpTitle: "📚 Monorepo Support",
} as const;