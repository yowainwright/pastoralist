import React from "react";

interface LogoSparkleProps {
  children: React.ReactNode;
  maskSrc: string;
}

export const LogoSparkle: React.FC<LogoSparkleProps> = ({ children, maskSrc }) => {
  const maskStyle = getMaskStyle(maskSrc);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div className="logo-shine-wrap" style={maskStyle}>
        {children}
        <div aria-hidden="true" className="logo-shine-beam" />
      </div>
    </div>
  );
};

function getMaskStyle(maskSrc: string): React.CSSProperties {
  const maskImage = `url(${maskSrc})`;
  const style: React.CSSProperties = {
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return style;
}
