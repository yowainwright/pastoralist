import { useState } from "react";
import { AnimatedTerminal, TreeConnectors } from "@/components/home/AnimatedTerminal";
import { TerminalWindow } from "@/components/TerminalWindow";
import { STYLES } from "@/components/TerminalWindow/constants";
import { CLI_DEMO } from "@/components/home/AnimatedTerminal/constants";
import type { TerminalLine } from "@/components/home/AnimatedTerminal/types";
import type { TerminalTab } from "@/components/TerminalWindow/types";

interface CodeBlockToggleProps {
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

const TABS: TerminalTab[] = [
  { id: "cli", label: "CLI Output" },
  { id: "json", label: "package.json" },
];

const PACKAGE_JSON = `{
  "name": "my-app",
  "scripts": {
    "postinstall": "pastoralist"
  },
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": { "express": "^4.18.0" }
      }
    }
  }
}`;

function StaticLine({ line }: { line: TerminalLine }) {
  const lineClassName = `${STYLES.line} ${line.className ?? ""}`;
  const prefix = line.prefix ? <span className={STYLES.prefix}>{line.prefix}</span> : null;
  const lineMarkup = { __html: line.text };

  return (
    <div className={lineClassName}>
      {prefix}
      <TreeConnectors line={line} />
      <span dangerouslySetInnerHTML={lineMarkup} />
    </div>
  );
}

function StaticTerminal() {
  const lines = CLI_DEMO[0].lines.map((line, index) => <StaticLine key={index} line={line} />);
  return (
    <div className={STYLES.content}>
      <div className="space-y-1">{lines}</div>
    </div>
  );
}

function CliContent({ shouldAnimate, onComplete }: Required<CodeBlockToggleProps>) {
  if (!shouldAnimate) return <StaticTerminal />;
  return (
    <AnimatedTerminal
      demos={CLI_DEMO}
      loop={false}
      typingSpeed={20}
      shouldAnimate
      onComplete={onComplete}
      hideHeader
    />
  );
}

function JsonContent() {
  return (
    <div className={STYLES.content}>
      <pre className="text-sm leading-relaxed text-base-content">
        <code>{PACKAGE_JSON}</code>
      </pre>
    </div>
  );
}

export function CodeBlockToggle({
  shouldAnimate = false,
  onComplete = () => undefined,
}: CodeBlockToggleProps) {
  const [activeTab, setActiveTab] = useState("cli");
  const cliContent = <CliContent shouldAnimate={shouldAnimate} onComplete={onComplete} />;
  const content = activeTab === "cli" ? cliContent : <JsonContent />;

  return (
    <TerminalWindow
      className={`${STYLES.window} ${STYLES.windowMaxWidth}`}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      minHeight="350px"
    >
      {content}
    </TerminalWindow>
  );
}
