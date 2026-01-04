import { APPENDIX_CONTENT } from "./constants";
import { TerminalWindow } from "./TerminalWindow";
import { TerminalHeader } from "./TerminalHeader";
import { JsonLine } from "./JsonLine";

interface AfterTerminalProps {
  isActive: boolean;
  appendixLines: number;
}

const BASE_LINES = 5;
const LINE_HEIGHT_PX = 24;
const HEADER_HEIGHT_PX = 44;
const PADDING_PX = 32;
const TOTAL_HEIGHT =
  HEADER_HEIGHT_PX +
  PADDING_PX +
  (BASE_LINES + APPENDIX_CONTENT.length) * LINE_HEIGHT_PX;

export const AfterTerminal: React.FC<AfterTerminalProps> = ({
  isActive,
  appendixLines,
}) => {
  const visibleLines = APPENDIX_CONTENT.slice(0, appendixLines);
  const hiddenLines = APPENDIX_CONTENT.slice(appendixLines);
  const showComma = appendixLines > 0;

  return (
    <TerminalWindow isActive={isActive} minHeight={`${TOTAL_HEIGHT}px`}>
      <TerminalHeader fileName="package.json" />
      <div
        className="terminal-content text-sm"
        style={{
          minHeight: `${(BASE_LINES + APPENDIX_CONTENT.length) * LINE_HEIGHT_PX}px`,
        }}
      >
        <div className="terminal-line text-base-content/50">{"{"}</div>
        <div className="terminal-line">
          {"  "}
          <span className="text-primary">"overrides"</span>: {"{"}
        </div>
        <div className="terminal-line">
          {"    "}
          <span className="text-primary">"lodash"</span>:{" "}
          <span className="text-success">"4.17.21"</span>
        </div>
        <div className="terminal-line">
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
        <div className="terminal-line text-base-content/50">{"}"}</div>
      </div>
    </TerminalWindow>
  );
};
