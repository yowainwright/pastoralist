interface TerminalWindowProps {
  isActive?: boolean;
  minHeight?: string;
  children: React.ReactNode;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  isActive = false,
  minHeight,
  children,
}) => {
  const activeClass = isActive ? "ring-2 ring-primary ring-offset-2" : "";
  const style = minHeight ? { minHeight } : undefined;

  return (
    <div
      className={`terminal-window transition-all duration-300 ${activeClass}`}
      style={style}
    >
      {children}
    </div>
  );
};
