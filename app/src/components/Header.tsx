import { lazy, Suspense } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Sun, Moon, Search as SearchIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getAllDocs } from "@/content";
import { GithubIcon } from "@/components/icons/GithubIcon";

const Search = lazy(() => import("@/components/docs/Search"));

const navigation = [
  { title: "Home", href: "/", preload: "intent" },
  { title: "Docs", href: "/docs/introduction", preload: "intent" },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;
  const isDocsRoute = pathname.includes("/docs");
  const searchData = getAllDocs().map((doc) => ({
    title: doc.title,
    description: doc.description,
    content: "",
    slug: doc.slug,
  }));

  const isNavItemActive = (href: string): boolean => {
    if (href.includes("/docs")) return pathname.includes("/docs");
    return pathname === href;
  };

  const navItemClassName = (href: string) => {
    const activeClass = isNavItemActive(href) ? "text-[#1D4ED8] bg-[#1D4ED8]/10" : "";
    return `rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${activeClass}`;
  };

  return (
    <header className="fixed top-0 z-[1000] w-full">
      <nav className="grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-1 justify-self-start">
          {isDocsRoute && (
            <label
              htmlFor="my-drawer-2"
              className="btn btn-sm btn-ghost btn-square lg:hidden"
              aria-label="toggle sidebar"
            >
              &#9776;
            </label>
          )}
          <Link to="/" preload="intent" className="btn btn-ghost min-w-0 px-1.5 sm:px-2">
            <h1 className="gradient-text truncate text-lg font-bold sm:text-2xl">Pastoralist</h1>
          </Link>
        </div>

        <div className="justify-self-center">
          <ul className="menu menu-horizontal flex-nowrap gap-1 p-0 text-sm font-medium sm:text-base">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link to={item.href} preload="intent" className={navItemClassName(item.href)}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          {isDocsRoute && (
            <Suspense
              fallback={
                <button className="btn btn-sm btn-ghost gap-1">
                  <SearchIcon className="h-4 w-4" />
                </button>
              }
            >
              <Search searchData={searchData} iconOnly />
            </Suspense>
          )}
          <a
            className="btn btn-sm btn-ghost btn-square"
            href="https://github.com/yowainwright/pastoralist"
            aria-label="github"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <button
            aria-label="theme-toggle"
            onClick={toggle}
            className={`btn btn-sm btn-ghost swap swap-rotate btn-square ${theme === "night" ? "swap-active" : ""}`}
          >
            <Sun className="w-4 h-4 swap-off" />
            <Moon className="w-4 h-4 swap-on" />
          </button>
        </div>
      </nav>
    </header>
  );
}
