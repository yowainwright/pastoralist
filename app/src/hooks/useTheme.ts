import { useState, useEffect } from "react";
import { useHasHydrated } from "./useFadeInUp";

type Theme = "lofi" | "night";

function otherTheme(theme: Theme): Theme {
  if (theme === "lofi") return "night";
  return "lofi";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "lofi";
  const stored = localStorage.getItem("theme") as Theme | null;
  const isStoredTheme = stored === "lofi" || stored === "night";
  if (isStoredTheme) return stored;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = prefersDark ? "night" : "lofi";
  return theme;
}

export function useTheme() {
  const hasHydrated = useHasHydrated();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme(otherTheme);
  const renderedTheme = hasHydrated ? theme : "lofi";

  const result = { theme: renderedTheme, setTheme, toggle };
  return result;
}
