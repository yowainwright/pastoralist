import { Suspense, use } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { SHIKI_LANGS, CODEBLOCK_CLASSES, normalizeCodeLanguage } from "./constants";
import type { CodeblockProps } from "./types";

const WINDOW_DOTS = ["bg-rose-400", "bg-amber-400", "bg-emerald-400"] as const;
const MAX_HIGHLIGHTED_CODE_CACHE_ENTRIES = 128;

type CodeHighlighter = Awaited<
  ReturnType<(typeof import("./highlighter"))["createCodeHighlighter"]>
>;

let highlighterPromise: Promise<CodeHighlighter> | null = null;
const highlightedCodeCache = new Map<string, Promise<string>>();

export function getHighlighter(): Promise<CodeHighlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("./highlighter").then((module) => module.createCodeHighlighter());
  }
  return highlighterPromise;
}

const resolveCodeblockLanguage = (lang: string): string => {
  const normalizedLang = normalizeCodeLanguage(lang);
  return (SHIKI_LANGS as readonly string[]).includes(normalizedLang) ? normalizedLang : "text";
};

const getCachedHighlightedCode = (cacheKey: string): Promise<string> | undefined => {
  const cached = highlightedCodeCache.get(cacheKey);
  if (!cached) return;

  highlightedCodeCache.delete(cacheKey);
  highlightedCodeCache.set(cacheKey, cached);
  return cached;
};

const setCachedHighlightedCode = (cacheKey: string, highlighted: Promise<string>): void => {
  if (highlightedCodeCache.size >= MAX_HIGHLIGHTED_CODE_CACHE_ENTRIES) {
    const oldestKey = highlightedCodeCache.keys().next().value;
    if (oldestKey !== undefined) highlightedCodeCache.delete(oldestKey);
  }

  highlightedCodeCache.set(cacheKey, highlighted);
};

const getHighlightedCode = (
  code: string,
  lang: string,
  showLineNumbers: boolean,
): Promise<string> => {
  const resolvedLang = resolveCodeblockLanguage(lang);
  const cacheKey = JSON.stringify([code, resolvedLang, showLineNumbers]);
  const cached = getCachedHighlightedCode(cacheKey);
  if (cached) return cached;

  const highlighted = getHighlighter()
    .then((highlighter) => highlighter.codeToHtml(code, resolvedLang, showLineNumbers))
    .catch((error) => {
      highlightedCodeCache.delete(cacheKey);
      throw error;
    });
  setCachedHighlightedCode(cacheKey, highlighted);
  return highlighted;
};

function CodeblockContent({
  code,
  lang = "text",
  showLineNumbers = false,
}: {
  code: string;
  lang?: string;
  showLineNumbers?: boolean;
}) {
  const html = use(getHighlightedCode(code, lang, showLineNumbers));

  return <div className={CODEBLOCK_CLASSES.content} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Codeblock({
  code,
  lang = "text",
  title,
  showLineNumbers = false,
  showLanguage = true,
  showCopy = true,
  className,
}: CodeblockProps) {
  const hasHeader = title || showLanguage || showCopy;

  return (
    <div
      className={cn(CODEBLOCK_CLASSES.wrapper, showLineNumbers && "show-line-numbers", className)}
    >
      {hasHeader && (
        <div className={CODEBLOCK_CLASSES.header}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {WINDOW_DOTS.map((tone) => (
                <span
                  key={tone}
                  className={cn("h-2.5 w-2.5 rounded-full ring-1 ring-black/5", tone)}
                />
              ))}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              {title && (
                <span className="truncate text-xs font-medium text-base-content/70">{title}</span>
              )}
              {showLanguage && lang && lang !== "text" && (
                <span className="font-mono text-xs text-base-content/50">{lang}</span>
              )}
            </div>
          </div>
          {showCopy && <CopyButton code={code} />}
        </div>
      )}
      <div className={CODEBLOCK_CLASSES.pre}>
        <Suspense
          fallback={
            <pre className="text-sm leading-relaxed">
              <code>{code}</code>
            </pre>
          }
        >
          <CodeblockContent code={code} lang={lang} showLineNumbers={showLineNumbers} />
        </Suspense>
      </div>
    </div>
  );
}

export { CopyButton } from "./CopyButton";
export { CodeCard } from "./CodeCard";
export type { CodeblockProps, CodeCardProps, Language } from "./types";
export { SHIKI_LANGS, CODEBLOCK_CLASSES } from "./constants";
