import { lazy, Suspense, type ReactElement } from "react";
import { Codeblock } from "@/components/Codeblock";
import { Anchor } from "./Anchor";

const Mermaid = lazy(() =>
  import("../Mermaid").then((m) => ({ default: m.Mermaid })),
);

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in (node as object)) {
    const el = node as ReactElement<{ children?: unknown }>;
    return extractText(el.props?.children);
  }
  return "";
}

function Pre({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & {
  "data-language"?: string;
  "data-mermaid-content"?: string;
}) {
  const mermaidContent = props["data-mermaid-content"];
  const dataLanguage = props["data-language"];

  // Handle mermaid from remark plugin data attributes
  if (dataLanguage === "mermaid" && mermaidContent) {
    return (
      <Suspense
        fallback={
          <div className="my-6 flex justify-center animate-pulse">
            <div className="h-32 w-full max-w-md bg-base-content/10 rounded" />
          </div>
        }
      >
        <Mermaid chart={mermaidContent} />
      </Suspense>
    );
  }

  // Extract language and code from children
  const child = children as ReactElement<{
    className?: string;
    children?: unknown;
  }>;
  const className = child?.props?.className ?? "";
  const rawLang =
    className.match(/language-(\S+)/)?.[1] ?? dataLanguage ?? "text";
  const lang = rawLang.replace(/^language-/, "");
  const code = extractText(child?.props?.children ?? children);

  // Handle mermaid from className
  if (lang === "mermaid") {
    return (
      <Suspense
        fallback={
          <div className="my-6 flex justify-center animate-pulse">
            <div className="h-32 w-full max-w-md bg-base-content/10 rounded" />
          </div>
        }
      >
        <Mermaid chart={code} />
      </Suspense>
    );
  }

  return (
    <div className="not-prose my-6">
      <Codeblock code={code} lang={lang} showCopy showLanguage />
    </div>
  );
}

export const mdxComponents = {
  pre: Pre,
  a: Anchor,
  h1: "h1" as const,
  h2: "h2" as const,
  h3: "h3" as const,
  h4: "h4" as const,
  h5: "h5" as const,
  h6: "h6" as const,
  p: "p" as const,
  code: "code" as const,
  span: "span" as const,
  strong: "strong" as const,
  em: "em" as const,
  ul: "ul" as const,
  ol: "ol" as const,
  li: "li" as const,
  img: "img" as const,
};

export { Anchor };
