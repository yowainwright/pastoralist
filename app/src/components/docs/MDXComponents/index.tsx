import { Pre } from "./Pre";
import { Anchor } from "./Anchor";
import { LazyCodeBlockWrapper } from "../LazyCodeBlockWrapper";

function DivComponent(props: { className?: string; [key: string]: unknown }) {
  if (props.className === "lazy-code-block") {
    return (
      <LazyCodeBlockWrapper
        {...(props as unknown as Parameters<typeof LazyCodeBlockWrapper>[0])}
      />
    );
  }
  return <div {...props} />;
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
  div: DivComponent,
  img: "img" as const,
};

export { Pre, Anchor };
