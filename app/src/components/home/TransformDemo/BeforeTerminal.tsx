import type { BeforeTerminalProps } from "./types";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";

export const BeforeTerminal: React.FC<BeforeTerminalProps> = ({ isActive }) => (
  <TerminalWindow isActive={isActive} fileName="package.json">
    <div className={STYLES.contentPadding} style={{ height: "auto" }}>
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
      <div className={STYLES.line}>{"  }"}</div>
      <div className={`${STYLES.line} text-base-content/50`}>{"}"}</div>
    </div>
  </TerminalWindow>
);
