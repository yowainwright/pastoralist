import { useEffect, useState } from "react";
import { Shader, Aurora, CursorRipples, Vignette } from "shaders/react";

const DARK_THEME = "night";

const AURORA_COLORS = {
  dark: { colorA: "#7c3aed", colorB: "#22d3ee", colorC: "#3b82f6" },
  light: { colorA: "#a78bfa", colorB: "#34d399", colorC: "#60a5fa" },
} as const;

export default function HeroShaderBackground() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === DARK_THEME,
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === DARK_THEME);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const colors = isDark ? AURORA_COLORS.dark : AURORA_COLORS.light;

  return (
    <Shader className="w-full h-full">
      <Aurora {...colors} intensity={55} speed={3} curtainCount={3} height={110} waviness={60} />
      <CursorRipples intensity={8} radius={0.6} chromaticSplit={2} />
      <Vignette intensity={0.35} radius={0.55} />
    </Shader>
  );
}
