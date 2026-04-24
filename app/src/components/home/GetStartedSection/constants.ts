export const SECTION_ID = "get-started";

export const CONTENT = {
  heading: "Ready to",
  headingHighlight: "get started",
  command: "bun add -g pastoralist",
  buttonText: "Learn More",
  docsSlug: "introduction",
} as const;

/** @tw - enables Tailwind IntelliSense */
export const STYLES = {
  section: "py-16 lg:py-24 border-t border-base-content/10",
  article: "max-w-2xl md:max-w-6xl mx-auto px-4 text-center",
  articleVisible: "animate-in fade-in slide-in-from-bottom-4 duration-700",
  articleHidden: "opacity-0",
  heading: "text-2xl lg:text-3xl font-black text-base-content mb-6",
  nav: "flex flex-col justify-center items-center gap-4",
  codeBlock:
    "flex w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 py-3 shadow-sm shadow-base-content/5 backdrop-blur",
  code: "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium",
  button: "btn btn-lg btn-primary",
} as const;
