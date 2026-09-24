import { APPENDIX_CONTENT, AFTER_TERMINAL_HEIGHT, AFTER_CONTENT_HEIGHT } from "./constants";
import type { AfterTerminalProps } from "./types";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";
import { JsonLine } from "./JsonLine";

export const AfterTerminal: React.FC<AfterTerminalProps> = ({ isActive, appendixLines }) => {
  return (
    <TerminalWindow
      isActive={isActive}
      fileName="package.json"
      minHeight={`${AFTER_TERMINAL_HEIGHT}px`}
    >
      <AfterContent appendixLines={appendixLines} />
    </TerminalWindow>
  );
};

interface AfterContentProps {
  appendixLines: number;
}
function AfterContent({ appendixLines }: AfterContentProps) {
  const minHeight = `${AFTER_CONTENT_HEIGHT}px`;
  const showComma = appendixLines > 0;
  return (
    <div className={STYLES.contentPadding} style={{ minHeight }}>
      <OverrideLines showComma={showComma} />
      <AppendixLines appendixLines={appendixLines} />
      <div className={`${STYLES.line} text-base-content/50`}>{"}"}</div>
    </div>
  );
}

function OverrideLines({ showComma }: { showComma: boolean }) {
  return (
    <>
      <div className={`${STYLES.line} text-base-content/50`}>{"{"}</div>
      <div className={STYLES.line}>
        {"  "}
        <span className="text-primary">"overrides"</span>: {"{"}
      </div>
      <div className={STYLES.line}>
        {"    "}
        <span className="text-primary">"lodash"</span>:{" "}
        <span className="text-success">"4.17.21"</span>
      </div>
      <div className={STYLES.line}>
        {"  }"}
        {showComma && ","}
      </div>
    </>
  );
}

function AppendixLines({ appendixLines }: AfterContentProps) {
  const visibleLines = APPENDIX_CONTENT.slice(0, appendixLines);
  const hiddenLines = APPENDIX_CONTENT.slice(appendixLines);
  return (
    <>
      {visibleLines.map((line, index) => (
        <JsonLine key={index} line={line} isAdded />
      ))}
      {hiddenLines.map((line, index) => (
        <JsonLine key={`hidden-${index}`} line={line} isAdded className="invisible" />
      ))}
    </>
  );
}
