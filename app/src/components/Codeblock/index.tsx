import { Suspense, use } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import customDark from "@/themes/dark.json";
import customLight from "@/themes/light.json";
import type { ThemeRegistration } from "shiki";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { SHIKI_LANGS, CODEBLOCK_CLASSES } from "./constants";
import type { CodeblockProps } from "./types";

const WINDOW_DOTS = ["bg-rose-400", "bg-amber-400", "bg-emerald-400"] as const;

// Singleton highlighter promise — created once, reused forever
let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [
        customLight as unknown as ThemeRegistration,
        customDark as unknown as ThemeRegistration,
      ],
      langs: [...SHIKI_LANGS],
    });
  }
  return highlighterPromise;
}

function CodeblockContent({
  code,
  lang = "text",
  showLineNumbers = false,
}: {
  code: string;
  lang?: string;
  showLineNumbers?: boolean;
}) {
  const highlighter = use(getHighlighter());

  const resolvedLang = (SHIKI_LANGS as readonly string[]).includes(lang)
    ? lang
    : "text";

  const html = highlighter.codeToHtml(code, {
    lang: resolvedLang,
    themes: {
      light: "pastoralist-light",
      dark: "pastoralist-dark",
    },
    defaultColor: false,
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
    ],
    ...(showLineNumbers ? { meta: { __raw: "showLineNumbers" } } : {}),
  });

  return (
    <div
      className={cn(
        CODEBLOCK_CLASSES.content,
        showLineNumbers && "show-line-numbers",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
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
    <div className={cn(CODEBLOCK_CLASSES.wrapper, className)}>
      {hasHeader && (
        <div className={CODEBLOCK_CLASSES.header}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {WINDOW_DOTS.map((tone) => (
                <span
                  key={tone}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full ring-1 ring-black/5",
                    tone,
                  )}
                />
              ))}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              {title && (
                <span className="truncate text-xs font-medium text-base-content/70">
                  {title}
                </span>
              )}
              {showLanguage && lang && lang !== "text" && (
                <span className="font-mono text-xs text-base-content/50">
                  {lang}
                </span>
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
          <CodeblockContent
            code={code}
            lang={lang}
            showLineNumbers={showLineNumbers}
          />
        </Suspense>
      </div>
    </div>
  );
}

export { CopyButton } from "./CopyButton";
export { CodeCard } from "./CodeCard";
export type { CodeblockProps, CodeCardProps, Language } from "./types";
export { SHIKI_LANGS, CODEBLOCK_CLASSES } from "./constants";
