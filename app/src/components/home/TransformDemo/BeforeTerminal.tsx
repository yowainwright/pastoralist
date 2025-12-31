import { TerminalWindow } from "./TerminalWindow";
import { TerminalHeader } from "./TerminalHeader";

interface BeforeTerminalProps {
  isActive: boolean;
}

export const BeforeTerminal: React.FC<BeforeTerminalProps> = ({ isActive }) => (
  <TerminalWindow isActive={isActive}>
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
      <div className="terminal-line">{"  }"}</div>
      <div className="terminal-line text-base-content/50">{"}"}</div>
    </div>
  </TerminalWindow>
);
