import { Link, useLocation } from "@tanstack/react-router";
import { Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getAllDocs, getDocContent } from "@/content";
import { buildSearchDocuments } from "@/content/search";
import { GithubIcon } from "@/components/icons/GithubIcon";
import Search from "@/components/docs/Search";

const navigation = [{ title: "Docs", href: "/docs/introduction", preload: "intent" }];
const searchData = buildSearchDocuments(getAllDocs(), getDocContent);

export function Header() {
  return (
    <header className="fixed top-0 z-[1000] w-full">
      <nav className="grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4">
        <HeaderBrand />

        <div className="justify-self-center" />

        <HeaderActions />
      </nav>
    </header>
  );
}

function HeaderBrand() {
  return (
    <div className="flex min-w-0 items-center gap-1 justify-self-start">
      <label
        htmlFor="my-drawer-2"
        className="btn btn-sm btn-ghost btn-square lg:hidden"
        aria-label="toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </label>
      <Link to="/" preload="intent" className="btn btn-ghost min-w-0 px-1.5 sm:px-2">
        <h1 className="gradient-text truncate text-lg font-bold sm:text-2xl">Pastoralist</h1>
      </Link>
    </div>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-1 justify-self-end">
      <HeaderLinks />
      <Search searchData={searchData} iconOnly />
      <a
        className="btn btn-sm btn-ghost btn-square"
        href="https://github.com/yowainwright/pastoralist"
        aria-label="github"
      >
        <GithubIcon className="h-4 w-4" />
      </a>
      <ThemeToggle />
    </div>
  );
}

function navItemClassName(pathname: string, href: string) {
  const isDocsLink = href.includes("/docs");
  const isDocsPage = pathname.includes("/docs");
  const matchesPath = pathname === href;
  const isActive = isDocsLink ? isDocsPage : matchesPath;
  const activeClass = isActive ? "text-[#1D4ED8] bg-[#1D4ED8]/10" : "";
  const className = `rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${activeClass}`;
  return className;
}

function HeaderLinks() {
  const { pathname } = useLocation();
  const links = navigation.map((item) => (
    <Link
      key={item.href}
      to={item.href}
      preload="intent"
      className={`btn btn-sm btn-ghost hidden sm:flex ${navItemClassName(pathname, item.href)}`}
    >
      {item.title}
    </Link>
  ));
  return <>{links}</>;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isNight = theme === "night";
  const themeButtonClassName = `btn btn-sm btn-ghost swap swap-rotate btn-square ${
    isNight ? "swap-active" : ""
  }`;
  return (
    <button aria-label="theme-toggle" onClick={toggle} className={themeButtonClassName}>
      <Sun className="w-4 h-4 swap-off" />
      <Moon className="w-4 h-4 swap-on" />
    </button>
  );
}
