import type { CLITerminalProps } from "./types";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";

export const CLITerminal: React.FC<CLITerminalProps> = (props) => {
  const { isActive } = props;
  return (
    <TerminalWindow isActive={isActive}>
      <CliOutput props={props} />
    </TerminalWindow>
  );
};

interface CliSpinnerProps {
  showSpinner: boolean;
}
function CliSpinner({ showSpinner }: CliSpinnerProps) {
  const spinnerClass = showSpinner ? "text-cyan-400" : "invisible";
  return (
    <div className={`${STYLES.line} ${spinnerClass}`} aria-hidden={!showSpinner}>
      <span className="inline-block animate-spin mr-2">&#x280B;</span>
      Scanning overrides...
    </div>
  );
}

interface CliSuccessProps {
  showSuccess: boolean;
}
function CliSuccess({ showSuccess }: CliSuccessProps) {
  const successClass = showSuccess ? "text-success" : "invisible";
  return (
    <div className={`${STYLES.line} ${successClass}`} aria-hidden={!showSuccess}>
      &#x2514;&#x2500;&#x2500; The herd is safe! &#x1F411;
    </div>
  );
}

interface CliOutputProps {
  props: CLITerminalProps;
}
function CliOutput({ props }: CliOutputProps) {
  const { typedCommand, phase, showSpinner, showSuccess } = props;
  const showCursor = phase === "step2";
  return (
    <div className={`${STYLES.contentPadding}`} style={{ height: "auto", padding: "0.75rem 1rem" }}>
      <div className={STYLES.line}>
        <span className={STYLES.prefix}>$</span>
        <span>{typedCommand}</span>
        {showCursor && <span className={STYLES.cursor} />}
      </div>
      <CliSpinner showSpinner={showSpinner} />
      <CliSuccess showSuccess={showSuccess} />
    </div>
  );
}
