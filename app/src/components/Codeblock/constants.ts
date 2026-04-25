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
  "text",
] as const;

export const CODEBLOCK_CLASSES = {
  wrapper:
    "not-prose shiki-wrapper relative group overflow-hidden rounded-2xl border border-border/70 bg-card/85 backdrop-blur",
  header:
    "shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-4 py-3",
  pre: "overflow-x-auto px-4 py-4 text-sm leading-relaxed",
  content:
    "[&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0",
} as const;
