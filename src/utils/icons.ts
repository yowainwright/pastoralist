import { green, red, yellow, cyan, gray } from "./colors";

export const BRAND = "▪▫▪ Pastoralist";

export const ICON = {
  success: green("●"),
  error: red("■"),
  warning: yellow("▲"),
  info: cyan("◆"),
  arrow: cyan("▸"),
  bullet: gray("▫"),
  check: green("●"),
  step: cyan("▶"),
  section: cyan("►"),
  search: cyan("◇"),
  edit: yellow("◆"),
  folder: cyan("▸"),
  skip: gray("○"),
  help: cyan("◇"),
  hint: yellow("\u{1F4A1}"),
} as const;

export const PREFIX = {
  success: ICON.success,
  error: ICON.error,
  warning: ICON.warning,
  info: ICON.info,
  step: ICON.step,
  save: ICON.arrow,
  next: ICON.bullet,
} as const;

export const STEP = {
  config: `${ICON.step} Step 1: Configuration Location`,
  workspace: `${ICON.step} Step 2: Workspace Configuration`,
  security: `${ICON.step} Step 3: Security Configuration`,
} as const;

export type IconKey = keyof typeof ICON;
export type PrefixKey = keyof typeof PREFIX;
