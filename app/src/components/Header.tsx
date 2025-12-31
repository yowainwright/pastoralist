import { lazy, Suspense } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Github, Sun, Moon, Menu, Search as SearchIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getAllDocs } from "@/content";

const Search = lazy(() => import("@/components/docs/Search"));

const navigation = [
  { title: "Home", href: "/" },
  { title: "Docs", href: "/docs/introduction" },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;
  const isDocsPage = pathname.includes("/docs");
  const searchData = getAllDocs().map((doc) => ({
    title: doc.title,
    description: doc.description,
    content: "",
    slug: doc.slug,
  }));

  return (
    <header className="sticky top-0 z-30">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-center items-center py-2 px-4 sm:px-6 md:px-20">
        {isDocsPage ? (
          <label
            htmlFor="my-drawer-2"
            className="btn btn-ghost btn-square lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </label>
        ) : (
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-square lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[50] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-content/10"
            >
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${
                      pathname === item.href
                        ? "text-[#1D4ED8] bg-[#1D4ED8]/10"
                        : ""
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost px-1 sm:px-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">
              Pastoralist
            </h1>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal text-base font-medium space-x-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  preload="intent"
                  className={`hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${
                    pathname === item.href
                      ? "text-[#1D4ED8] bg-[#1D4ED8]/10"
                      : ""
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end">
          <Suspense
            fallback={
              <button className="btn btn-sm btn-ghost gap-1">
                <SearchIcon className="h-4 w-4" />
              </button>
            }
          >
            <Search searchData={searchData} iconOnly />
          </Suspense>
          <a
            className="btn btn-sm btn-ghost btn-square"
            href="https://github.com/yowainwright/pastoralist"
            aria-label="github"
          >
            <Github className="h-4 w-4" />
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
