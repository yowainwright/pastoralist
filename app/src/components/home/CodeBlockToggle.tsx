import React, { useState } from "react";

interface CodeBlockToggleProps {
  height?: string;
}

export const CodeBlockToggle: React.FC<CodeBlockToggleProps> = ({
  height = "320px",
}) => {
  const [activeTab, setActiveTab] = useState<"cli" | "json">("cli");

  return (
    <div className="terminal-window w-full">
      {/* Window chrome with traffic light buttons */}
      <div className="terminal-header flex justify-between items-center">
        <div className="flex gap-2">
          <div className="terminal-dot terminal-dot-red" />
          <div className="terminal-dot terminal-dot-yellow" />
          <div className="terminal-dot terminal-dot-green" />
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-1 bg-slate-700/50 rounded-md p-1">
          <button
            onClick={() => setActiveTab("cli")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "cli"
                ? "bg-slate-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CLI Output
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === "json"
                ? "bg-slate-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            package.json
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="terminal-content" style={{ height, overflow: "auto" }}>
        {activeTab === "cli" ? (
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
        ) : (
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
        )}
      </div>
    </div>
  );
};
