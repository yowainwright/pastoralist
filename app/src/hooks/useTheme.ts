import { useState, useEffect } from "react";

type Theme = "lofi" | "night";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "lofi";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "lofi" || stored === "night") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "lofi";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "lofi" ? "night" : "lofi"));

  return { theme, setTheme, toggle };
}
