import type { SHIKI_LANGS } from "./constants";

export type Language = (typeof SHIKI_LANGS)[number];

export interface CodeblockProps {
  code: string;
  lang?: Language | string;
  title?: string;
  meta?: string;
  showLineNumbers?: boolean;
  showLanguage?: boolean;
  showCopy?: boolean;
  className?: string;
}

export interface HighlightSettings {
  lang: string;
  showLineNumbers: boolean;
  fenceMeta: string;
}

export interface CodeCardProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  className?: string;
}
