import { Link } from "@tanstack/react-router";
import type { AnchorProps } from "./types";

function DocsAnchor({ href = "", children, className }: AnchorProps) {
  const slug = href.replace("/docs/", "");
  return (
    <Link to="/docs/$slug/" params={{ slug }} className={className}>
      {children}
    </Link>
  );
}

export function Anchor({ href, children, className }: AnchorProps) {
  if (!href) return <a className={className}>{children}</a>;
  const props = { href, children, className };
  const isExternal = href.startsWith("http") || href.startsWith("//");
  if (isExternal) return <ExternalAnchor {...props} />;
  const isDocsLink = href.startsWith("/docs/");

  if (isDocsLink) {
    return <DocsAnchor {...props} />;
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function ExternalAnchor({ href, children, className }: AnchorProps) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
