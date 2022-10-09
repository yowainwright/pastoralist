import React from "react";
import { FaGithubAlt, FaBars, FaRegMoon } from "react-icons/fa";

export const NavBar = ({ toggleDrawer, toggleTheme }: any) => {
  return (
    <div
      className="
  sticky top-0 z-30 flex h-16 w-full justify-center bg-opacity-90 backdrop-blur transition-all duration-100"
    >
      <nav className="navbar w-full">
        <div className="flex flex-1 md:gap-1 lg:gap-2 lg:invisible">
          <span
            className="tooltip tooltip-bottom before:text-xs before:content-[attr(data-tip)]"
            data-tip="Menu"
          >
            <label
              className="btn btn-square btn-ghost drawer-button text-xl"
              onClick={toggleDrawer}
            >
              <FaBars />
            </label>
          </span>
          <div className="flex items-center gap-2">
            <a
              href="/"
              aria-current="page"
              aria-label="Homepage"
              className="flex-0 btn btn-ghost px-2"
            >
              <div className="font-title text-primary inline-flex text-lg transition-all duration-200 md:text-3xl">
                <span className="uppercase">Pastoralist</span>
              </div>
            </a>
            <a
              href="/docs/changelog"
              className="link link-hover font-mono text-xs text-opacity-50"
            >
              <div
                data-tip="Changelog"
                className="tooltip tooltip-bottom"
              ></div>
            </a>
          </div>
        </div>
        <div className="flex-0">
          <div className="flex-none items-center">
            <button
              aria-label="dark mode toggle"
              className="btn btn-ghost drawer-button btn-square normal-case text-xl"
              onClick={toggleTheme}
            >
              <FaRegMoon />
            </button>
          </div>
        </div>
        <div className="flex-0">
          <div className="flex-none items-center">
            <a
              aria-label="Github"
              href="https://github.com/yowainwright/pastoralist"
              className="btn btn-ghost drawer-button btn-square normal-case text-xl"
              target="_blank"
            >
              <FaGithubAlt />
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
};
