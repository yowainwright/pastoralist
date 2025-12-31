import { Link } from "@tanstack/react-router";
import type { AnchorProps } from "./types";

export function Anchor({ href, children, className }: AnchorProps) {
  if (!href) return <a className={className}>{children}</a>;

  const isExternal = href.startsWith("http") || href.startsWith("//");

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  const isDocsLink = href.startsWith("/docs/");

  if (isDocsLink) {
    const slug = href.replace("/docs/", "");
    return (
      <Link to="/docs/$slug" params={{ slug }} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
