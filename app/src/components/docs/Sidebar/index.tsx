import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import SIDEBAR from "./constants";

interface SidebarProps {
  onClose?: () => void;
}

const toggleSectionAt = (sections: boolean[], index: number): boolean[] =>
  sections.map((isOpen, sectionIndex) => {
    const toggled = !isOpen;
    if (sectionIndex === index) return toggled;
    return isOpen;
  });

export function Sidebar({ onClose = () => undefined }: SidebarProps) {
  return (
    <aside className="drawer-side">
      <label
        htmlFor="my-drawer-2"
        className="drawer-overlay lg:hidden bg-transparent"
        onClick={onClose}
      />
      <nav className="w-64 bg-base-100 z-20 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-base-content/10">
        <SidebarSections />
      </nav>
    </aside>
  );
}

function SidebarSections() {
  const pathname = useLocation().pathname;
  const [sections, setSections] = useState(() => SIDEBAR.map(() => true));
  const toggleSection = (index: number) => {
    setSections((current) => toggleSectionAt(current, index));
  };
  const sectionEntries = SIDEBAR.map((section, index) => {
    const onToggle = () => toggleSection(index);
    return (
      <SidebarSection
        key={section.title}
        section={section}
        isOpen={sections[index]}
        onToggle={onToggle}
        pathname={pathname}
      />
    );
  });

  return <section className="px-3 pt-2 space-y-3">{sectionEntries}</section>;
}

interface SidebarSectionProps {
  section: { title: string; items: { title: string; href: string }[] };
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
}

function SidebarSection({ section, isOpen, onToggle, pathname }: SidebarSectionProps) {
  const contentClassName = `sidebar-content ${isOpen ? "" : "hidden"}`;
  return (
    <article className="sidebar-section">
      <SidebarToggle title={section.title} isOpen={isOpen} onToggle={onToggle} />
      <nav className={contentClassName}>
        <ul className="ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1">
          {section.items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </article>
  );
}

interface SidebarToggleProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}

function SidebarToggle({ title, isOpen, onToggle }: SidebarToggleProps) {
  const chevronClassName = `w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`;
  return (
    <button
      className="sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors"
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <span>{title}</span>
      <ChevronRight className={chevronClassName} />
    </button>
  );
}

interface SidebarLinkProps {
  item: { title: string; href: string };
  pathname: string;
}

function SidebarLink({ item, pathname }: SidebarLinkProps) {
  const slug = extractSlug(item.href);
  const isActive = isSidebarLinkActive(pathname, slug);

  return (
    <li>
      <Link
        to="/docs/$slug/"
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

function isSidebarLinkActive(pathname: string, slug: string): boolean {
  const normalizedPathname = pathname.replace(/\/+$/, "");
  const isActive = normalizedPathname.endsWith(`/docs/${slug}`);
  return isActive;
}

export function extractSlug(href: string): string {
  const match = href.match(/docs\/([^/]+)$/);
  const slug = match ? match[1] : "introduction";
  return slug;
}
