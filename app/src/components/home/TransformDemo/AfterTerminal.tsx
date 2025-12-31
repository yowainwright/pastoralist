import { APPENDIX_CONTENT } from "./constants";
import { TerminalWindow } from "./TerminalWindow";
import { TerminalHeader } from "./TerminalHeader";
import { JsonLine } from "./JsonLine";

interface AfterTerminalProps {
  isActive: boolean;
  appendixLines: number;
}

export const AfterTerminal: React.FC<AfterTerminalProps> = ({
  isActive,
  appendixLines,
}) => {
  const visibleLines = APPENDIX_CONTENT.slice(0, appendixLines);
  const showComma = appendixLines > 0;

  return (
    <TerminalWindow isActive={isActive} minHeight="420px">
      <TerminalHeader fileName="package.json" />
      <div className="terminal-content text-sm" style={{ height: "auto" }}>
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
        <div className="terminal-line text-base-content/50">{"}"}</div>
      </div>
    </TerminalWindow>
  );
};
