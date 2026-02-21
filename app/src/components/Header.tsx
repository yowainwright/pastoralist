import { lazy, Suspense } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Github, Sun, Moon, Menu, Search as SearchIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getAllDocs } from "@/content";

const Search = lazy(() => import("@/components/docs/Search"));

const navigation = [
  { title: "Home", href: "/", preload: "intent" },
  { title: "Docs", href: "/docs/introduction", preload: "intent" },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;
  const searchData = getAllDocs().map((doc) => ({
    title: doc.title,
    description: doc.description,
    content: "",
    slug: doc.slug,
  }));

  return (
    <header className="fixed top-0 z-30 w-full">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-center items-center py-2 px-4 h-[68px]">
        <label
          htmlFor="my-drawer-2"
          className="btn btn-ghost btn-square lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </label>

        <div className="navbar-start">
          <Link to="/" preload="intent" className="btn btn-ghost px-2">
            <h1 className="text-2xl font-bold gradient-text">Pastoralist</h1>
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
                    (
                      item.href.includes("/docs")
                        ? pathname.includes("/docs")
                        : pathname === item.href
                    )
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
