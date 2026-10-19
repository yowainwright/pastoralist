import { useCallback } from "react";
import type { TocWithScrollspyProps, TocHeading } from "./types";
import { useScrollspy } from "./useScrollspy";
import { buildToc } from "./buildToc";
import { parseInlineCode } from "./utils";
import { HEADING_SELECTORS } from "./constants";

const BASE_LINK_CLASSES =
  "block break-words text-base transition-colors border-l-2 pl-4 font-spline-sans-mono";
const TOC_CLASSES =
  "sticky top-[68px] max-h-[calc(100vh-68px)] w-full min-w-0 max-w-xs overflow-y-auto pt-2";
const ACTIVE_CLASSES = "text-navigation font-medium border-navigation";
const INACTIVE_CLASSES = "hover:text-navigation border-transparent";

function getLinkClasses(isActive: boolean, isSubheading = false) {
  const baseOpacity = isSubheading ? "text-base-content/60" : "text-base-content/70";
  const padding = isSubheading ? "py-0.5" : "py-1";
  const stateClasses = isActive ? ACTIVE_CLASSES : `${baseOpacity} ${INACTIVE_CLASSES}`;
  const linkClasses = `${BASE_LINK_CLASSES} ${padding} ${stateClasses}`;
  return linkClasses;
}

function scrollToElement(content: HTMLElement | null, slug: string): boolean {
  const target = content
    ? Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTORS)).find(
        (heading) => heading.id === slug,
      )
    : undefined;
  if (!target) return false;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.pushState(null, "", `#${slug}`);
  return true;
}

export function TocWithScrollspy({ headings, contentRef }: TocWithScrollspyProps) {
  const headingList = headings ?? [];
  const toc = buildToc(headingList);
  const headingIds = headingList.map(({ slug }) => slug);
  const activeId = useScrollspy(contentRef, headingIds);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
      if (!scrollToElement(contentRef.current, slug)) return;
      e.preventDefault();
    },
    [contentRef],
  );

  if (toc.length === 0) return null;

  return (
    <nav className={TOC_CLASSES} aria-label="Table of contents">
      <TocHeader />
      <TocList toc={toc} activeId={activeId} onClickLink={handleClick} />
    </nav>
  );
}

function TocHeader() {
  return (
    <h2 className="mb-3 py-1.5 text-sm font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono">
      On this page
    </h2>
  );
}

interface TocListProps {
  toc: TocHeading[];
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}

function TocList({ toc, activeId, onClickLink }: TocListProps) {
  return (
    <ul className="space-y-2.5">
      {toc.map((heading) => (
        <TocItem
          key={heading.slug}
          heading={heading}
          activeId={activeId}
          onClickLink={onClickLink}
        />
      ))}
    </ul>
  );
}

interface TocItemProps {
  heading: TocHeading;
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}

function TocItem({ heading, activeId, onClickLink }: TocItemProps) {
  const isActive = activeId === heading.slug;
  const hasSubheadings = heading.subheadings.length > 0;
  const { slug, text } = heading;
  const linkProps = { slug, text, isActive, onClickLink };

  return (
    <li>
      <TocLink {...linkProps} />
      {hasSubheadings && (
        <TocSubheadings
          subheadings={heading.subheadings}
          activeId={activeId}
          onClickLink={onClickLink}
        />
      )}
    </li>
  );
}

interface TocLinkProps {
  slug: string;
  text: string;
  isActive: boolean;
  isSubheading?: boolean;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}

function TocLink({ slug, text, isActive, isSubheading = false, onClickLink }: TocLinkProps) {
  const parts = parseInlineCode(text);

  return (
    <a
      href={`#${slug}`}
      onClick={(e) => onClickLink(e, slug)}
      className={getLinkClasses(isActive, isSubheading)}
    >
      {parts.map((part, i) =>
        part.isCode ? (
          <code key={i} className="text-sm px-1 py-0.5 rounded bg-base-content/10">
            {part.text}
          </code>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </a>
  );
}

interface TocSubheadingsProps {
  subheadings: TocHeading[];
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}

function TocSubheadings({ subheadings, activeId, onClickLink }: TocSubheadingsProps) {
  return (
    <ul className="mt-2 space-y-2 ml-3">
      {subheadings.map((subheading) => (
        <li key={subheading.slug}>
          <TocLink
            slug={subheading.slug}
            text={subheading.text}
            isActive={activeId === subheading.slug}
            isSubheading
            onClickLink={onClickLink}
          />
        </li>
      ))}
    </ul>
  );
}
