import type { CLITerminalProps } from "./types";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";

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
      <div
        className={`${STYLES.contentPadding}`}
        style={{ height: "auto", padding: "0.75rem 1rem" }}
      >
        <div className={STYLES.line}>
          <span className={STYLES.prefix}>$</span>
          <span>{typedCommand}</span>
          {showCursor && <span className={STYLES.cursor} />}
        </div>
        {showSpinner && (
          <div className={`${STYLES.line} text-cyan-400`}>
            <span className="inline-block animate-spin mr-2">&#x280B;</span>
            Scanning overrides...
          </div>
        )}
        {showSuccess && (
          <div className={`${STYLES.line} text-success`}>
            &#x2514;&#x2500;&#x2500; The herd is safe! &#x1F411;
          </div>
        )}
      </div>
    </TerminalWindow>
  );
};
