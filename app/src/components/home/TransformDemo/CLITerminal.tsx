import type { AnimationPhase } from "./types";
import { TerminalWindow } from "./TerminalWindow";
import { TerminalHeader } from "./TerminalHeader";

interface CLITerminalProps {
  isActive: boolean;
  typedCommand: string;
  phase: AnimationPhase;
  showSpinner: boolean;
  showSuccess: boolean;
}

export const CLITerminal: React.FC<CLITerminalProps> = ({
  isActive,
  typedCommand,
  phase,
  showSpinner,
  showSuccess,
}) => {
  const showCursor = phase === "step2";

  return (
    <TerminalWindow isActive={isActive}>
      <TerminalHeader />
      <div
        className="terminal-content text-sm"
        style={{ height: "auto", padding: "0.75rem 1rem" }}
      >
        <div className="terminal-line">
          <span className="terminal-prefix">$</span>
          <span>{typedCommand}</span>
          {showCursor && <span className="cursor" />}
        </div>
        {showSpinner && (
          <div className="terminal-line text-cyan-400">
            <span className="inline-block animate-spin mr-2">&#x280B;</span>
            checking herd...
          </div>
        )}
        {showSuccess && (
          <div className="terminal-line text-success">
            &#x1F469;&#x1F3FD;&#x200D;&#x1F33E; the herd is safe!
          </div>
        )}
      </div>
    </TerminalWindow>
  );
};
