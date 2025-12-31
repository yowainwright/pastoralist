export const HEADING_REGEX = /^(#{2,4})\s+(.+)$/gm;

export const SHIKI_LANGS = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "bash",
  "shellscript",
  "json",
  "yaml",
  "markdown",
] as const;

export const SHIKI_THEMES = {
  light: "theme-custom-light",
  dark: "theme-custom-dark",
} as const;
