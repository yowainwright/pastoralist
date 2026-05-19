import { lazy, Suspense, type ReactElement } from "react";
import { Codeblock } from "@/components/Codeblock";
import { DocVideo } from "@/components/docs/DocVideo";
import { Anchor } from "./Anchor";
import type { MermaidProps } from "../Mermaid";

const Mermaid = lazy(() => import("../Mermaid").then((m) => ({ default: m.Mermaid })));

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  const hasProps = Boolean(node && typeof node === "object" && "props" in (node as object));
  if (hasProps) {
    const el = node as ReactElement<{ children?: unknown }>;
    return extractText(el.props?.children);
  }
  return "";
}

function MermaidBlock({ chart }: MermaidProps) {
  return (
    <Suspense
      fallback={
        <div className="my-6 flex justify-center animate-pulse">
          <div className="h-32 w-full max-w-md bg-base-content/10 rounded" />
        </div>
      }
    >
      <Mermaid chart={chart} />
    </Suspense>
  );
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

  const hasMermaidProps = dataLanguage === "mermaid" && mermaidContent;
  if (hasMermaidProps) {
    return <MermaidBlock chart={mermaidContent} />;
  }

  const child = children as ReactElement<{
    className?: string;
    children?: unknown;
    "data-language"?: string;
    "data-mermaid-content"?: string;
  }>;
  const childMermaidContent = child?.props?.["data-mermaid-content"];
  const childDataLanguage = child?.props?.["data-language"];
  const hasChildMermaidProps = childDataLanguage === "mermaid" && childMermaidContent;
  if (hasChildMermaidProps) {
    return <MermaidBlock chart={childMermaidContent} />;
  }

  const className = child?.props?.className ?? "";
  const rawLang =
    className.match(/language-(\S+)/)?.[1] ?? childDataLanguage ?? dataLanguage ?? "text";
  const lang = rawLang.replace(/^language-/, "");
  const code = extractText(child?.props?.children ?? children);

  if (lang === "mermaid") {
    return <MermaidBlock chart={code} />;
  }

  return (
    <div className="not-prose my-4">
      <Codeblock code={code} lang={lang} showCopy={false} showLanguage={false} showLineNumbers />
    </div>
  );
}

export const mdxComponents = {
  Mermaid: MermaidBlock,
  DocVideo,
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
