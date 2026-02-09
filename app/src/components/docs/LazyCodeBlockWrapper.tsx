import { LazyCodeBlock } from "./LazyCodeBlock";

interface LazyCodeBlockWrapperProps {
  "data-code-content": string;
  "data-code-lang": string;
  "data-code-meta": string;
  className?: string;
}

export function LazyCodeBlockWrapper(props: LazyCodeBlockWrapperProps) {
  const content = props["data-code-content"];
  const lang = props["data-code-lang"];
  const meta = props["data-code-meta"];

  if (!content) {
    return null;
  }

  return <LazyCodeBlock content={content} lang={lang} meta={meta} />;
}
