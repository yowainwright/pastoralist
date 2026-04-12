import React, { useState } from "react";
import {
  AnimatedTerminal,
  TreeConnectors,
} from "@/components/home/AnimatedTerminal";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";
import type { TerminalTab } from "@/components/TerminalWindow/types";
import { CLI_DEMO } from "@/components/home/AnimatedTerminal/constants";

interface CodeBlockToggleProps {
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

const TABS: TerminalTab[] = [
  { id: "cli", label: "CLI Output" },
  { id: "json", label: "package.json" },
];

export const CodeBlockToggle: React.FC<CodeBlockToggleProps> = ({
  shouldAnimate = false,
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState("cli");

  return (
    <TerminalWindow
      className={`${STYLES.window} ${STYLES.windowMaxWidth}`}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      minHeight="430px"
    >
      {activeTab === "cli" ? (
        shouldAnimate ? (
          <AnimatedTerminal
            demos={CLI_DEMO}
            loop={false}
            typingSpeed={20}
            shouldAnimate={true}
            onComplete={onComplete}
            hideHeader={true}
          />
        ) : (
          <div className={STYLES.content}>
            <div className="space-y-1">
              {CLI_DEMO[0].lines.map((line, index) => (
                <div
                  key={index}
                  className={`${STYLES.line} ${line.className ?? ""}`}
                >
                  {line.prefix && (
                    <span className={STYLES.prefix}>{line.prefix}</span>
                  )}
                  <TreeConnectors line={line} />
                  <span dangerouslySetInnerHTML={{ __html: line.text }} />
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className={STYLES.content}>
          <div className="space-y-0">
            <div className={`${STYLES.line} text-base-content/50`}>{"{"}</div>
            <div className={STYLES.line}>
              {"  "}
              <span className="text-primary">"name"</span>:{" "}
              <span className="text-success">"my-app"</span>,
            </div>
            <div className={STYLES.line}>
              {"  "}
              <span className="text-primary">"scripts"</span>: {"{"}
            </div>
            <div className={STYLES.line}>
              {"    "}
              <span className="text-primary">"postinstall"</span>:{" "}
              <span className="text-success">"pastoralist"</span>
            </div>
            <div className={STYLES.line}>{"  }"},"</div>
            <div className={STYLES.line}>
              {"  "}
              <span className="text-primary">"overrides"</span>: {"{"}
            </div>
            <div className={STYLES.line}>
              {"    "}
              <span className="text-primary">"lodash"</span>:{" "}
              <span className="text-success">"4.17.21"</span>
            </div>
            <div className={STYLES.line}>{"  }"},"</div>
            <div className={`${STYLES.line} json-added`}>
              {"  "}
              <span className="text-primary">"pastoralist"</span>: {"{"}
            </div>
            <div className={`${STYLES.line} json-added`}>
              {"    "}
              <span className="text-primary">"appendix"</span>: {"{"}
            </div>
            <div className={`${STYLES.line} json-added`}>
              {"      "}
              <span className="text-primary">"lodash@4.17.21"</span>: {"{"}
            </div>
            <div className={`${STYLES.line} json-added`}>
              {"        "}
              <span className="text-primary">"dependents"</span>: {"{"}{" "}
              <span className="text-primary">"express"</span>:{" "}
              <span className="text-success">"^4.18.0"</span> {"}"}
            </div>
            <div className={`${STYLES.line} json-added`}>{"      }"}</div>
            <div className={`${STYLES.line} json-added`}>{"    }"}</div>
            <div className={`${STYLES.line} json-added`}>{"  }"}</div>
            <div className={`${STYLES.line} text-base-content/50`}>{"}"}</div>
          </div>
        </div>
      )}
    </TerminalWindow>
  );
};
