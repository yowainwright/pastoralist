export const TERMINAL_LINE_HEIGHT_PX = 20;
export const TERMINAL_HEADER_HEIGHT_PX = 44;
export const TERMINAL_PADDING_PX = 32;

/** @tw - enables Tailwind IntelliSense */
export const STYLES = {
  window: "terminal-window",
  windowActive: "ring-2 ring-primary ring-offset-2",
  windowMaxWidth: "max-w-3xl w-full",
  header: "terminal-header",
  headerWithTabs: "terminal-header flex justify-between items-center",
  dotRed: "terminal-dot terminal-dot-red",
  dotYellow: "terminal-dot terminal-dot-yellow",
  dotGreen: "terminal-dot terminal-dot-green",
  dots: "flex gap-2 items-center",
  label: "ml-3 text-slate-400 text-xs",
  tabs: "terminal-tabs",
  tab: "terminal-tab",
  tabActive: "terminal-tab active",
  content: "terminal-content",
  contentPadding: "terminal-content text-sm",
  line: "terminal-line",
  prefix: "terminal-prefix",
  cursor: "cursor",
  loader: "terminal-window w-full animate-pulse",
  loaderBar: "h-4 bg-base-content/10 rounded",
} as const;
