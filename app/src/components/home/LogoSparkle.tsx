import React from "react";

interface LogoSparkleProps {
  children: React.ReactNode;
  /** SVG src URL — used as CSS mask so the shine clips to the logo shape */
  maskSrc: string;
}

export const LogoSparkle: React.FC<LogoSparkleProps> = ({ children, maskSrc }) => {
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url(${maskSrc})`,
    maskImage: `url(${maskSrc})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div className="logo-shine-wrap" style={maskStyle}>
        {children}
        <div aria-hidden="true" className="logo-shine-beam" />
      </div>
    </div>
  );
};
