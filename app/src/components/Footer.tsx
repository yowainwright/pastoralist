import { Github } from "lucide-react";
import { Link } from "@tanstack/react-router";

const BASE_URL = import.meta.env.BASE_URL || "/pastoralist";
const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";

export function Footer() {
  return (
    <footer className="w-full px-4 sm:px-6 md:px-10 xl:px-28 py-6 sm:py-7 border-t border-base-300 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
      <div className="flex items-center justify-center sm:justify-start gap-2 order-3 sm:order-1">
        <p className="text-sm sm:text-base text-center sm:text-left">
          Copyright © {new Date().getFullYear()} - All rights reserved
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img
            src={`${base}pastoralist-logo.svg`}
            alt="Pastoralist Logo"
            className="h-12 w-12"
          />
        </Link>
      </div>

      <nav className="flex justify-center sm:justify-end order-2 sm:order-3">
        <div className="grid grid-flow-col gap-4">
          <a
            className="btn btn-ghost btn-circle flex items-center justify-center"
            href="https://github.com/yowainwright/pastoralist"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </nav>
    </footer>
  );
}
