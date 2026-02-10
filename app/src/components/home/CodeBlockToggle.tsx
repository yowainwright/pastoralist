import React, { useState } from "react";
import { AnimatedTerminal } from "@/components/home/AnimatedTerminal";
import type { TerminalDemo } from "@/components/home/AnimatedTerminal/types";

interface CodeBlockToggleProps {
  height?: string;
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

const CLI_DEMO: TerminalDemo[] = [
  {
    lines: [
      { prefix: "$", text: "bun install" },
      { text: "bun install v1.1.0", className: "text-base-content/70" },
      { text: "+ express@4.18.2", className: "text-base-content/70" },
      {
        text: "+ lodash@4.17.21 (via override)",
        className: "text-base-content/70",
      },
      { text: "&nbsp;" },
      { text: "👩🏽‍🌾 pastoralist checking herd...", className: "text-cyan-400" },
      { text: "&nbsp;" },
      {
        text: "Tracking 2 override(s) in package.json",
        className: "text-base-content/70",
      },
      {
        text: "Detected 1 patch file(s) in /patches",
        className: "text-base-content/70",
      },
      { text: "&nbsp;" },
      { text: "👩🏽‍🌾 pastoralist the herd is safe!", className: "text-success" },
    ],
  },
];

export const CodeBlockToggle: React.FC<CodeBlockToggleProps> = ({
  height = "320px",
  shouldAnimate = false,
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState<"cli" | "json">("cli");

  return (
    <div className="terminal-window max-w-3xl w-full">
      {/* Window chrome with traffic light buttons */}
      <div className="terminal-header flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <div className="terminal-dot terminal-dot-red" />
          <div className="terminal-dot terminal-dot-yellow" />
          <div className="terminal-dot terminal-dot-green" />
          <span className="ml-3 text-slate-400 text-xs">terminal</span>
        </div>

        <div className="terminal-tabs">
          <button
            onClick={() => setActiveTab("cli")}
            className={`terminal-tab ${activeTab === "cli" ? "active" : ""}`}
          >
            CLI Output
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`terminal-tab ${activeTab === "json" ? "active" : ""}`}
          >
            package.json
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div style={{ height, overflow: "hidden" }}>
        {activeTab === "cli" ? (
          shouldAnimate ? (
            <div style={{ height, overflow: "hidden" }}>
              <AnimatedTerminal
                demos={CLI_DEMO}
                loop={false}
                typingSpeed={20}
                height={height}
                shouldAnimate={true}
                onComplete={onComplete}
                hideHeader={true}
              />
            </div>
          ) : (
            <div
              className="terminal-content"
              style={{ height, overflow: "auto" }}
            >
              <div className="space-y-1">
                <div className="terminal-line">
                  <span className="terminal-prefix">$</span>
                  <span>bun install</span>
                </div>
                <div className="terminal-line text-base-content/70">
                  bun install v1.1.0
                </div>
                <div className="terminal-line text-base-content/70">
                  + express@4.18.2
                </div>
                <div className="terminal-line text-base-content/70">
                  + lodash@4.17.21 (via override)
                </div>
                <div className="terminal-line">&nbsp;</div>
                <div className="terminal-line text-cyan-400">
                  👩🏽‍🌾 pastoralist checking herd...
                </div>
                <div className="terminal-line">&nbsp;</div>
                <div className="terminal-line text-base-content/70">
                  Tracking 2 override(s) in package.json
                </div>
                <div className="terminal-line text-base-content/70">
                  Detected 1 patch file(s) in /patches
                </div>
                <div className="terminal-line">&nbsp;</div>
                <div className="terminal-line text-success">
                  👩🏽‍🌾 pastoralist the herd is safe!
                </div>
              </div>
            </div>
          )
        ) : (
          <div
            className="terminal-content"
            style={{ height, overflow: "auto" }}
          >
            <div className="space-y-0">
              <div className="terminal-line text-base-content/50">{"{"}</div>
              <div className="terminal-line">
                {"  "}
                <span className="text-primary">"name"</span>:{" "}
                <span className="text-success">"my-app"</span>,
              </div>
              <div className="terminal-line">
                {"  "}
                <span className="text-primary">"scripts"</span>: {"{"}
              </div>
              <div className="terminal-line">
                {"    "}
                <span className="text-primary">"postinstall"</span>:{" "}
                <span className="text-success">"pastoralist"</span>
              </div>
              <div className="terminal-line">{"  }"},"</div>
              <div className="terminal-line">
                {"  "}
                <span className="text-primary">"overrides"</span>: {"{"}
              </div>
              <div className="terminal-line">
                {"    "}
                <span className="text-primary">"lodash"</span>:{" "}
                <span className="text-success">"4.17.21"</span>
              </div>
              <div className="terminal-line">{"  }"},"</div>
              <div className="terminal-line json-added">
                {"  "}
                <span className="text-primary">"pastoralist"</span>: {"{"}
              </div>
              <div className="terminal-line json-added">
                {"    "}
                <span className="text-primary">"appendix"</span>: {"{"}
              </div>
              <div className="terminal-line json-added">
                {"      "}
                <span className="text-primary">"lodash@4.17.21"</span>: {"{"}
              </div>
              <div className="terminal-line json-added">
                {"        "}
                <span className="text-primary">"dependents"</span>: {"{"}{" "}
                <span className="text-primary">"express"</span>:{" "}
                <span className="text-success">"^4.18.0"</span> {"}"}
              </div>
              <div className="terminal-line json-added">{"      }"}</div>
              <div className="terminal-line json-added">{"    }"}</div>
              <div className="terminal-line json-added">{"  }"}</div>
              <div className="terminal-line text-base-content/50">{"}"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
