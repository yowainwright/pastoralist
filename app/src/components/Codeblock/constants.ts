export const SHIKI_LANGS = [
  "javascript",
  "js",
  "typescript",
  "ts",
  "jsx",
  "tsx",
  "bash",
  "shellscript",
  "json",
  "jsonc",
  "yaml",
  "markdown",
  "text",
] as const;

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
};

const TERMINAL_LANGUAGES = new Set([
  "bash",
  "console",
  "plaintext",
  "shell",
  "shellscript",
  "sh",
  "terminal",
  "text",
]);

export const normalizeCodeLanguage = (lang: string): string => LANGUAGE_ALIASES[lang] || lang;

export const normalizeCodeBlock = (code: string): string => code.replace(/\r?\n$/, "");

export const shouldShowCodeLineNumbers = (lang: string): boolean => {
  const normalizedLanguage = normalizeCodeLanguage(lang.trim().toLowerCase());
  return !TERMINAL_LANGUAGES.has(normalizedLanguage);
};

export const CODEBLOCK_CLASSES = {
  wrapper:
    "not-prose shiki-wrapper relative group w-full min-w-0 max-w-full overflow-hidden rounded-md border border-border/70 bg-card/85 backdrop-blur",
  header:
    "shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-3 py-2",
  pre: "max-w-full overflow-x-auto px-2 py-2 text-[13px] leading-5",
  content:
    "max-w-full [&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!max-w-full [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0",
} as const;
