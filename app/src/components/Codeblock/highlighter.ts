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
import type { LanguageRegistration, ThemeRegistration } from "shiki/types";

const LIGHT_THEME = "pastoralist-light";
const DARK_THEME = "pastoralist-dark";

type LanguageModule = LanguageRegistration | LanguageRegistration[];
type LanguageLoader = () => Promise<LanguageModule>;

const languageLoaders: Record<string, LanguageLoader | undefined> = {
  bash: () => import("shiki/langs/bash.mjs").then((module) => module.default),
  javascript: () => import("shiki/langs/javascript.mjs").then((module) => module.default),
  json: () => import("shiki/langs/json.mjs").then((module) => module.default),
  jsx: () => import("shiki/langs/jsx.mjs").then((module) => module.default),
  markdown: () => import("shiki/langs/markdown.mjs").then((module) => module.default),
  shellscript: () => import("shiki/langs/shellscript.mjs").then((module) => module.default),
  tsx: () => import("shiki/langs/tsx.mjs").then((module) => module.default),
  typescript: () => import("shiki/langs/typescript.mjs").then((module) => module.default),
  yaml: () => import("shiki/langs/yaml.mjs").then((module) => module.default),
};

export async function createCodeHighlighter() {
  const highlighter = await createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [
      customLight as unknown as ThemeRegistration,
      customDark as unknown as ThemeRegistration,
    ],
    langs: [],
  });

  const loadedLanguages = new Set<string>(["text"]);
  const languagePromises = new Map<string, Promise<void>>();

  const loadLanguage = (lang: string): Promise<void> => {
    const languageKey = normalizeCodeLanguage(lang);
    if (loadedLanguages.has(languageKey)) return Promise.resolve();

    const existing = languagePromises.get(languageKey);
    if (existing) return existing;

    const loader = languageLoaders[lang] || languageLoaders[languageKey];
    if (!loader) return Promise.resolve();

    const promise = loader()
      .then(async (language) => {
        const languages = Array.isArray(language) ? language : [language];
        await highlighter.loadLanguage(...languages);
        loadedLanguages.add(languageKey);
      })
      .catch((error) => {
        languagePromises.delete(languageKey);
        throw error;
      });
    languagePromises.set(languageKey, promise);
    return promise;
  };

  return {
    async codeToHtml(code: string, lang: string, showLineNumbers = false): Promise<string> {
      const languageKey = normalizeCodeLanguage(lang);
      await loadLanguage(languageKey);

      const lineNumberOptions = showLineNumbers
        ? { meta: { __raw: "showLineNumbers" } }
        : undefined;
      const htmlOptions = Object.assign(
        {},
        {
          lang: languageKey,
          themes: {
            light: LIGHT_THEME,
            dark: DARK_THEME,
          },
          defaultColor: false as const,
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
            transformerNotationFocus(),
          ],
        },
        lineNumberOptions,
      );

      return highlighter.codeToHtml(code, htmlOptions);
    },
  };
}
