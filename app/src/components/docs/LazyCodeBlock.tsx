import { useState, useEffect, useRef } from "react";
import { codeToHtml } from "shiki";
import customDark from "@/themes/dark.json";
import customLight from "@/themes/light.json";
import type { ThemeRegistration } from "shiki";
import { Loader2 } from "lucide-react";

interface LazyCodeBlockProps {
  content: string;
  lang: string;
  meta: string;
}

export function LazyCodeBlock({ content, lang, meta }: LazyCodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || highlightedCode !== null) return;

    async function highlightCode() {
      try {
        const html = await codeToHtml(content, {
          lang: lang || "text",
          themes: {
            light: customLight as unknown as ThemeRegistration,
            dark: customDark as unknown as ThemeRegistration,
          },
          defaultColor: false,
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        setHighlightedCode(
          `<pre class="shiki"><code class="language-${lang}">${content}</code></pre>`,
        );
      }
    }

    highlightCode();
  }, [isVisible, content, lang, meta, highlightedCode]);

  const estimatedHeight = Math.max(
    120,
    Math.min(600, content.split("\n").length * 24 + 40),
  );

  return (
    <>
      {highlightedCode === null ? (
        <div
          ref={ref}
          className="animate-pulse flex items-center justify-center"
          style={{
            height: `${estimatedHeight}px`,
            margin: 0,
            padding: 0,
          }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-base-content/60" />
        </div>
      ) : (
        <div
          ref={ref}
          className="relative group [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!rounded-none [&_pre]:!border-0"
        >
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const preElement = target.closest("pre");
              const codeElement = preElement?.querySelector("code");
              if (codeElement?.textContent && navigator.clipboard) {
                navigator.clipboard.writeText(codeElement.textContent);

                const button = preElement?.querySelector(
                  ".copy-btn",
                ) as HTMLElement;
                if (button) {
                  button.textContent = "✓";
                  setTimeout(() => {
                    button.innerHTML =
                      '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>';
                  }, 1000);
                }
              }
            }}
          />
          <button
            className="copy-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 btn btn-ghost btn-sm btn-square bg-base-100/80 hover:bg-base-100"
            onClick={(e) => {
              e.stopPropagation();
              const preElement = e.currentTarget
                .closest(".group")
                ?.querySelector("pre");
              const codeElement = preElement?.querySelector("code");
              if (codeElement?.textContent && navigator.clipboard) {
                navigator.clipboard.writeText(codeElement.textContent);
                e.currentTarget.textContent = "✓";
                setTimeout(() => {
                  e.currentTarget.innerHTML =
                    '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>';
                }, 1000);
              }
            }}
            aria-label="Copy code"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
