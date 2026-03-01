import {
  APPENDIX_CONTENT,
  AFTER_TERMINAL_HEIGHT,
  AFTER_CONTENT_HEIGHT,
} from "./constants";
import type { AfterTerminalProps } from "./types";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";
import { JsonLine } from "./JsonLine";

export const AfterTerminal: React.FC<AfterTerminalProps> = ({
  isActive,
  appendixLines,
}) => {
  const visibleLines = APPENDIX_CONTENT.slice(0, appendixLines);
  const hiddenLines = APPENDIX_CONTENT.slice(appendixLines);
  const showComma = appendixLines > 0;

  return (
    <TerminalWindow
      isActive={isActive}
      fileName="package.json"
      minHeight={`${AFTER_TERMINAL_HEIGHT}px`}
    >
      <div
        className={STYLES.contentPadding}
        style={{ minHeight: `${AFTER_CONTENT_HEIGHT}px` }}
      >
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
        {visibleLines.map((line, index) => (
          <JsonLine key={index} line={line} isAdded />
        ))}
        {hiddenLines.map((line, index) => (
          <JsonLine
            key={`hidden-${index}`}
            line={line}
            isAdded
            className="invisible"
          />
        ))}
        <div className={`${STYLES.line} text-base-content/50`}>{"}"}</div>
      </div>
    </TerminalWindow>
  );
};
