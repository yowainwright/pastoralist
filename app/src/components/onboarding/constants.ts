import type { RepoLoadState } from "./types";

export const INITIAL_REPO_STATE: RepoLoadState = {
  status: "idle",
  message: "Paste JSON directly or load a public GitHub repo.",
};

export const LOADING_REPO_STATE: RepoLoadState = {
  status: "loading",
  message: "Loading package.json...",
};

export const PAGE_CLASS = "mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8";
export const HERO_CLASS =
  "grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(22rem,0.5fr)] lg:items-end";
export const TITLE_CLASS =
  "text-3xl font-black leading-tight text-base-content sm:text-4xl lg:text-5xl";
export const SUBTITLE_CLASS = "max-w-3xl text-base leading-7 text-base-content/70";
export const PANEL_CLASS =
  "rounded-2xl border border-base-content/10 bg-base-100/85 p-4 shadow-sm shadow-base-content/5 backdrop-blur sm:p-5";
export const LABEL_CLASS = "text-sm font-semibold text-base-content";
export const INPUT_CLASS =
  "input input-bordered h-11 w-full rounded-xl border-base-content/15 bg-base-100 text-sm focus:outline-none";
export const TEXTAREA_CLASS =
  "textarea textarea-bordered min-h-[22rem] w-full resize-y rounded-xl border-base-content/15 bg-base-100 font-mono text-sm leading-6 focus:outline-none";
export const METRIC_CLASS =
  "flex min-h-28 flex-col justify-between rounded-xl border border-base-content/10 bg-base-200/35 p-4";
export const METRIC_ICON_CLASS = "size-5 text-[#1D4ED8]";
export const METRIC_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wide text-base-content/55";
export const METRIC_VALUE_CLASS = "mt-3 text-2xl font-black text-base-content";
export const METRIC_DETAIL_CLASS = "mt-1 text-sm text-base-content/60";
export const SECTION_TITLE_CLASS = "flex items-center gap-2 text-lg font-black text-base-content";
export const COPY_BUTTON_CLASS = "btn btn-primary btn-sm rounded-xl";
