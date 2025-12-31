import { useCallback } from "react";
import type { TocWithScrollspyProps, TocHeading } from "./types";
import { SCROLL_OFFSET } from "./constants";
import { useScrollspy } from "./useScrollspy";
import { buildToc } from "./buildToc";
import { parseInlineCode } from "./utils";

const BASE_LINK_CLASSES =
  "block text-sm transition-colors border-l-2 pl-4 -ml-0.5 font-spline-sans-mono";
const ACTIVE_CLASSES = "text-[#1D4ED8] font-medium border-[#1D4ED8]";
const INACTIVE_CLASSES = "hover:text-[#1D4ED8] border-transparent";

function getLinkClasses(isActive: boolean, isSubheading = false) {
  const baseOpacity = isSubheading
    ? "text-base-content/60"
    : "text-base-content/70";
  const padding = isSubheading ? "py-0.5" : "py-1";
  const stateClasses = isActive
    ? ACTIVE_CLASSES
    : `${baseOpacity} ${INACTIVE_CLASSES}`;
  return `${BASE_LINK_CLASSES} ${padding} ${stateClasses}`;
}

function scrollToElement(slug: string) {
  const target = document.getElementById(slug);
  if (!target) return;
  const y =
    target.getBoundingClientRect().top + window.pageYOffset + SCROLL_OFFSET;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export function TocWithScrollspy({ headings }: TocWithScrollspyProps) {
  const toc = buildToc(headings || []);
  const activeId = useScrollspy(headings?.length || 0);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
      e.preventDefault();
      scrollToElement(slug);
    },
    [],
  );

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-28 w-64" aria-label="Table of contents">
      <TocHeader />
      <TocList toc={toc} activeId={activeId} onClickLink={handleClick} />
    </nav>
  );
}

function TocHeader() {
  return (
    <h2 className="mb-3 text-xs font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono">
      On this page
    </h2>
  );
}

function TocList({
  toc,
  activeId,
  onClickLink,
}: {
  toc: TocHeading[];
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
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

function TocItem({
  heading,
  activeId,
  onClickLink,
}: {
  heading: TocHeading;
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
  const isActive = activeId === heading.slug;
  const hasSubheadings = heading.subheadings.length > 0;

  return (
    <li>
      <TocLink
        slug={heading.slug}
        text={heading.text}
        isActive={isActive}
        onClickLink={onClickLink}
      />
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

function TocLink({
  slug,
  text,
  isActive,
  isSubheading = false,
  onClickLink,
}: {
  slug: string;
  text: string;
  isActive: boolean;
  isSubheading?: boolean;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
  const parts = parseInlineCode(text);

  return (
    <a
      href={`#${slug}`}
      onClick={(e) => onClickLink(e, slug)}
      className={getLinkClasses(isActive, isSubheading)}
    >
      {parts.map((part, i) =>
        part.isCode ? (
          <code
            key={i}
            className="text-xs px-1 py-0.5 rounded bg-base-content/10"
          >
            {part.text}
          </code>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </a>
  );
}

function TocSubheadings({
  subheadings,
  activeId,
  onClickLink,
}: {
  subheadings: TocHeading[];
  activeId: string | null;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}) {
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
