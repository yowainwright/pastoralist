import { useState, useEffect } from "react";
import { useHasHydrated } from "./useFadeInUp";

type Theme = "lofi" | "night";

export function useTheme() {
  const hasHydrated = useHasHydrated();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "lofi";
    const stored = localStorage.getItem("theme") as Theme | null;
    const isStoredTheme = stored === "lofi" || stored === "night";
    if (isStoredTheme) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "lofi";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "lofi" ? "night" : "lofi"));
  const renderedTheme = hasHydrated ? theme : "lofi";

  return { theme: renderedTheme, setTheme, toggle };
}
