import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import customDark from "@/themes/dark.json";
import customLight from "@/themes/light.json";
import { normalizeCodeLanguage } from "./constants";
import type { HighlighterCore, LanguageRegistration, ThemeRegistration } from "shiki/types";

const LIGHT_THEME = "pastoralist-light";
const DARK_THEME = "pastoralist-dark";

type LanguageModule = LanguageRegistration | LanguageRegistration[];
type LanguageLoader = () => Promise<LanguageModule>;

const languageLoaders: Record<string, LanguageLoader | undefined> = {
  bash: () => import("shiki/langs/bash.mjs").then((module) => module.default),
  javascript: () => import("shiki/langs/javascript.mjs").then((module) => module.default),
  json: () => import("shiki/langs/json.mjs").then((module) => module.default),
  jsonc: () => import("shiki/langs/jsonc.mjs").then((module) => module.default),
  jsx: () => import("shiki/langs/jsx.mjs").then((module) => module.default),
  markdown: () => import("shiki/langs/markdown.mjs").then((module) => module.default),
  shellscript: () => import("shiki/langs/shellscript.mjs").then((module) => module.default),
  tsx: () => import("shiki/langs/tsx.mjs").then((module) => module.default),
  typescript: () => import("shiki/langs/typescript.mjs").then((module) => module.default),
  yaml: () => import("shiki/langs/yaml.mjs").then((module) => module.default),
};

interface LanguageState {
  loaded: Set<string>;
  pending: Map<string, Promise<void>>;
}

async function registerLanguage(highlighter: HighlighterCore, loader: LanguageLoader) {
  const language = await loader();
  const languages = Array.isArray(language) ? language : [language];
  await highlighter.loadLanguage(...languages);
}

function loadLanguage(
  highlighter: HighlighterCore,
  state: LanguageState,
  lang: string,
): Promise<void> {
  const { loaded, pending } = state;
  const languageKey = normalizeCodeLanguage(lang);
  const ready = Promise.resolve();
  if (loaded.has(languageKey)) return ready;
  const existing = pending.get(languageKey);
  if (existing) return existing;

  const loader = languageLoaders[lang] || languageLoaders[languageKey];
  if (!loader) return ready;
  const promise = trackLanguage(highlighter, state, languageKey, loader);
  return promise;
}

function trackLanguage(
  highlighter: HighlighterCore,
  state: LanguageState,
  languageKey: string,
  loader: LanguageLoader,
) {
  const { loaded, pending } = state;
  const promise = registerLanguage(highlighter, loader)
    .then(() => {
      loaded.add(languageKey);
    })
    .catch((error) => {
      pending.delete(languageKey);
      throw error;
    });
  pending.set(languageKey, promise);
  return promise;
}

function highlightCode(
  highlighter: HighlighterCore,
  code: string,
  lang: string,
  showLineNumbers: boolean,
) {
  const themes = { light: LIGHT_THEME, dark: DARK_THEME };
  const transformers = [
    transformerNotationDiff(),
    transformerNotationHighlight(),
    transformerNotationFocus(),
  ];
  const baseOptions = { lang, themes, defaultColor: false, transformers } as const;
  const meta = { __raw: "showLineNumbers" };
  const numbered = { meta };
  const lineNumberOptions = showLineNumbers ? numbered : undefined;
  const htmlOptions = Object.assign({}, baseOptions, lineNumberOptions);
  const html = highlighter.codeToHtml(code, htmlOptions);
  return html;
}

function createClient(highlighter: HighlighterCore) {
  const loaded = new Set<string>(["text"]);
  const pending = new Map<string, Promise<void>>();
  const state = { loaded, pending };
  const codeToHtml = async (
    code: string,
    lang: string,
    showLineNumbers = false,
  ): Promise<string> => {
    const languageKey = normalizeCodeLanguage(lang);
    await loadLanguage(highlighter, state, languageKey);
    const html = highlightCode(highlighter, code, languageKey, showLineNumbers);
    return html;
  };
  const client = { codeToHtml };
  return client;
}

export async function createCodeHighlighter() {
  const engine = createJavaScriptRegexEngine();
  const themes = [
    customLight as unknown as ThemeRegistration,
    customDark as unknown as ThemeRegistration,
  ];
  const langs: LanguageRegistration[] = [];
  const highlighter = await createHighlighterCore({ engine, themes, langs });
  const client = createClient(highlighter);
  return client;
}
