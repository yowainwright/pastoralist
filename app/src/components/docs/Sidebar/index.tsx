import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import SIDEBAR from "./constants";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  const expandedSections = SIDEBAR.map((section) =>
    section.items.some((item) =>
      pathname.endsWith(`/docs/${extractSlug(item.href)}`),
    ),
  );

  const [sections, setSections] = useState(expandedSections);

  const toggleSection = (index: number) => {
    setSections((prev) => prev.map((open, i) => (i === index ? !open : open)));
  };

  return (
    <aside className="drawer-side z-40 md:border-r md:border-base-content/10">
      <label
        htmlFor="my-drawer-2"
        aria-label="close sidebar"
        className="drawer-overlay"
      />
      <nav className="bg-base-100 min-h-screen w-64 sm:w-72 pt-4">
        <section className="px-3 py-4 space-y-3">
          {SIDEBAR.map((navItem, index) => (
            <SidebarSection
              key={navItem.title}
              section={navItem}
              isOpen={sections[index]}
              onToggle={() => toggleSection(index)}
              pathname={pathname}
            />
          ))}
        </section>
      </nav>
    </aside>
  );
}

function SidebarSection({
  section,
  isOpen,
  onToggle,
  pathname,
}: {
  section: { title: string; items: { title: string; href: string }[] };
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  return (
    <article className="sidebar-section">
      <button
        className="sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{section.title}</span>
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      <nav className={`sidebar-content ${isOpen ? "" : "hidden"}`}>
        <ul className="ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1">
          {section.items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </article>
  );
}

function SidebarLink({
  item,
  pathname,
}: {
  item: { title: string; href: string };
  pathname: string;
}) {
  const slug = extractSlug(item.href);
  const isActive = pathname.endsWith(`/docs/${slug}`);

  return (
    <li>
      <Link
        to="/docs/$slug"
        params={{ slug }}
        preload="intent"
        className={`block ml-0 pl-4 pr-3 py-2 text-sm transition-colors relative ${
          isActive
            ? "text-[#1D4ED8] bg-[#1D4ED8]/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1D4ED8]"
            : "text-base-content/80 hover:text-[#1D4ED8] hover:bg-base-content/5"
        }`}
      >
        <span className="flex items-center justify-between">{item.title}</span>
      </Link>
    </li>
  );
}

export function extractSlug(href: string): string {
  const match = href.match(/docs\/([^/]+)$/);
  return match ? match[1] : "introduction";
}
