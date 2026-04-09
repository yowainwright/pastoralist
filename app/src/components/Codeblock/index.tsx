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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { SHIKI_LANGS, CODEBLOCK_CLASSES } from "./constants";
import type { CodeblockProps } from "./types";

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
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-xs text-base-content/70 font-medium">
                {title}
              </span>
            )}
            {showLanguage && lang && lang !== "text" && (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 h-5 font-mono"
              >
                {lang}
              </Badge>
            )}
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
