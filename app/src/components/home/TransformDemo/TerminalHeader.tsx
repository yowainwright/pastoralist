interface TerminalHeaderProps {
  fileName?: string;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({ fileName }) => {
  const label = fileName ?? "terminal";

  return (
    <div className="terminal-header">
      <div className="terminal-dot terminal-dot-red" />
      <div className="terminal-dot terminal-dot-yellow" />
      <div className="terminal-dot terminal-dot-green" />
      <span className="ml-3 text-slate-400 text-xs">{label}</span>
    </div>
  );
};
