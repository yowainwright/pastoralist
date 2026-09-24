import { useEffect, useState } from "react";
import { Shader, Aurora, CursorRipples, Vignette } from "shaders/react";

const DARK_THEME = "night";

const DARK_COLORS = { colorA: "#7c3aed", colorB: "#22d3ee", colorC: "#3b82f6" };
const LIGHT_COLORS = { colorA: "#a78bfa", colorB: "#34d399", colorC: "#60a5fa" };
const THEME_ATTRIBUTES = ["data-theme"];

function isDarkTheme() {
  if (typeof document === "undefined") return false;
  const isDark = document.documentElement.getAttribute("data-theme") === DARK_THEME;
  return isDark;
}

function useDarkTheme() {
  const [isDark, setIsDark] = useState(isDarkTheme);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(isDarkTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: THEME_ATTRIBUTES,
    });
    const disconnect = observer.disconnect.bind(observer);
    return disconnect;
  }, []);

  return isDark;
}

export default function HeroShaderBackground() {
  const isDark = useDarkTheme();
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <Shader className="w-full h-full">
      <Aurora {...colors} intensity={55} speed={3} curtainCount={3} height={110} waviness={60} />
      <CursorRipples intensity={8} radius={0.6} chromaticSplit={2} />
      <Vignette intensity={0.35} radius={0.55} />
    </Shader>
  );
}
