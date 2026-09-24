import { lazy, Suspense, type ReactElement } from "react";
import { Codeblock } from "@/components/Codeblock";
import { Anchor } from "./Anchor";
import { createHeading } from "./Heading";
import type { MermaidProps } from "../Mermaid";

const Mermaid = lazy(() =>
  import("../Mermaid").then(({ Mermaid: diagram }) => ({ default: diagram })),
);
const H1 = createHeading("h1");
const H2 = createHeading("h2");
const H3 = createHeading("h3");
const H4 = createHeading("h4");
const H5 = createHeading("h5");
const H6 = createHeading("h6");

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    const text = node.map(extractText).join("");
    return text;
  }
  const isObject = node !== null && typeof node === "object";
  if (!isObject) return "";
  if ("props" in node) {
    const el = node as ReactElement<{ children?: unknown }>;
    const text = extractText(el.props?.children);
    return text;
  }
  return "";
}

function MermaidBlock({ chart }: MermaidProps) {
  return (
    <div
      className="not-prose my-6 h-80 overflow-auto sm:h-96"
      role="region"
      aria-label="Architecture diagram"
      tabIndex={0}
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center animate-pulse" aria-hidden="true">
            <div className="h-48 w-full max-w-lg rounded bg-base-content/10" />
          </div>
        }
      >
        <Mermaid chart={chart} />
      </Suspense>
    </div>
  );
}

interface CodeAttributes {
  className?: string;
  children?: unknown;
  "data-language"?: string;
  "data-mermaid-content"?: string;
}

type PreProps = React.HTMLAttributes<HTMLPreElement> & CodeAttributes;

function getMermaidContent(props: CodeAttributes | undefined) {
  if (props?.["data-language"] !== "mermaid") return undefined;
  const content = props["data-mermaid-content"];
  return content;
}

function readCode(children: React.ReactNode, props: PreProps) {
  const child = children as ReactElement<CodeAttributes>;
  const childProps = child?.props ?? {};
  const className = childProps.className ?? "";
  const { "data-language": childLanguage } = childProps;
  const { "data-language": dataLanguage } = props;
  const rawLang = className.match(/language-(\S+)/)?.[1] ?? childLanguage ?? dataLanguage ?? "text";
  const lang = rawLang.replace(/^language-/, "");
  const code = extractText(childProps.children ?? children);
  const content = { lang, code };
  return content;
}

function Pre({ children, ...props }: PreProps) {
  const child = children as ReactElement<CodeAttributes>;
  const mermaidContent = getMermaidContent(props) || getMermaidContent(child?.props);
  if (mermaidContent) {
    return <MermaidBlock chart={mermaidContent} />;
  }
  const { lang, code } = readCode(children, props);
  if (lang === "mermaid") {
    return <MermaidBlock chart={code} />;
  }

  return (
    <div className="not-prose my-4 min-w-0 max-w-full overflow-hidden">
      <Codeblock code={code} lang={lang} showCopy={false} showLanguage={false} showLineNumbers />
    </div>
  );
}

export const mdxComponents = {
  Mermaid: MermaidBlock,
  pre: Pre,
  a: Anchor,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: "p",
  code: "code",
  span: "span",
  strong: "strong",
  em: "em",
  ul: "ul",
  ol: "ol",
  li: "li",
  img: "img",
} as const;

export { Anchor };
export { Heading } from "./Heading";
