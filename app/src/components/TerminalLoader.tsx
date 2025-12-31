export function TerminalLoader() {
  return (
    <div className="terminal-window w-full animate-pulse">
      <div className="terminal-header">
        <div className="terminal-dot terminal-dot-red" />
        <div className="terminal-dot terminal-dot-yellow" />
        <div className="terminal-dot terminal-dot-green" />
        <span className="ml-3 text-slate-400 text-xs">terminal</span>
      </div>
      <div className="terminal-content" style={{ height: "460px" }}>
        <div className="h-4 bg-base-content/10 rounded w-3/4 mb-2" />
        <div className="h-4 bg-base-content/10 rounded w-1/2 mb-2" />
        <div className="h-4 bg-base-content/10 rounded w-2/3" />
      </div>
    </div>
  );
}
