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
    "shiki-wrapper relative group rounded-lg overflow-hidden bg-base-200 border border-base-300",
  header:
    "flex items-center justify-between px-4 py-2 bg-base-300/50 border-b border-base-300",
  pre: "overflow-x-auto p-4 text-sm leading-relaxed",
  content:
    "[&_.shiki]:!bg-transparent [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0",
} as const;
