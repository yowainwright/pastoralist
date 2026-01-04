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
    "flex items-center bg-base-100 rounded-lg shadow-sm h-12 px-4 border border-base-content/10 max-w-md",
  code: "flex-1 text-left leading-none text-base",
  button: "btn btn-lg btn-primary",
} as const;
