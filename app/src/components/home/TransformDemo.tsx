import React, { useState, useEffect, useRef } from "react";

type AnimationPhase = "idle" | "typing" | "checking" | "updating" | "complete";

export const TransformDemo: React.FC = () => {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [typedCommand, setTypedCommand] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appendixLines, setAppendixLines] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const command = "pastoralist";

  const appendixContent = [
    '  "pastoralist": {',
    '    "appendix": {',
    '      "lodash@4.17.21": {',
    '        "dependents": {',
    '          "express": "^4.18.0"',
    "        },",
    '        "ledger": {',
    '          "reason": "security",',
    '          "cve": "CVE-2020-8203"',
    "        }",
    "      }",
    "    }",
    "  }",
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startAnimation();
        }
      },
      { threshold: 0.3 },
    );

    const current = containerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  const startAnimation = () => {
    setPhase("typing");
    setTypedCommand("");
    setShowSpinner(false);
    setShowSuccess(false);
    setAppendixLines(0);

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < command.length) {
        setTypedCommand(command.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setPhase("checking");
          setShowSpinner(true);
          setTimeout(() => {
            setPhase("updating");
            setShowSpinner(false);
            animateAppendix();
          }, 1500);
        }, 300);
      }
    }, 80);
  };

  const animateAppendix = () => {
    let lineIndex = 0;
    const lineInterval = setInterval(() => {
      if (lineIndex < appendixContent.length) {
        setAppendixLines(lineIndex + 1);
        lineIndex++;
      } else {
        clearInterval(lineInterval);
        setTimeout(() => {
          setPhase("complete");
          setShowSuccess(true);
        }, 300);
      }
    }, 120);
  };

  return (
    <div ref={containerRef} className="grid md:grid-cols-2 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6 lg:gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base-content/60 text-sm">
              Execute the pastoralist cli
            </span>
            <span className="badge badge-primary badge-lg">CLI</span>
          </div>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
            </div>
            <div
              className="terminal-content text-sm"
              style={{ height: "auto", padding: "0.75rem 1rem" }}
            >
              <div className="terminal-line">
                <span className="terminal-prefix">$</span>
                <span>{typedCommand}</span>
                {phase === "typing" && <span className="cursor" />}
              </div>
              {showSpinner && (
                <div className="terminal-line text-cyan-400">
                  <span className="inline-block animate-spin mr-2">⠋</span>
                  checking herd...
                </div>
              )}
              {showSuccess && (
                <div className="terminal-line text-success">
                  👩🏽‍🌾 the herd is safe!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base-content/60 text-sm">
              Documented overrides
            </span>
            <span className="badge badge-success badge-lg">After</span>
          </div>
          <div
            className="terminal-window flex-1"
            style={{ minHeight: "420px" }}
          >
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-3 text-slate-400 text-xs">package.json</span>
            </div>
            <div
              className="terminal-content text-sm"
              style={{ height: "auto" }}
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
                {appendixLines > 0 ? "," : ""}
              </div>
              {appendixContent.slice(0, appendixLines).map((line, index) => (
                <div key={index} className="terminal-line json-added">
                  {line.includes('"pastoralist"') ||
                  line.includes('"appendix"') ||
                  line.includes('"lodash@') ||
                  line.includes('"dependents"') ||
                  line.includes('"express"') ||
                  line.includes('"ledger"') ||
                  line.includes('"reason"') ||
                  line.includes('"cve"') ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(
                            /"([^"]+)":/g,
                            '<span class="text-primary">"$1"</span>:',
                          )
                          .replace(
                            /: "([^"]+)"/g,
                            ': <span class="text-success">"$1"</span>',
                          ),
                      }}
                    />
                  ) : (
                    line
                  )}
                </div>
              ))}
              {appendixLines < appendixContent.length &&
                Array.from({
                  length: appendixContent.length - appendixLines,
                }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="terminal-line">
                    &nbsp;
                  </div>
                ))}
              <div className="terminal-line text-base-content/50">{"}"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base-content/60 text-sm">
            Undocumented overrides
          </span>
          <span
            className="badge badge-lg text-white"
            style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
          >
            Before
          </span>
        </div>
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
            <span className="ml-3 text-slate-400 text-xs">package.json</span>
          </div>
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
            <div className="terminal-line">&nbsp;</div>
            <div className="terminal-line text-base-content/40 italic">
              // Why is this here?
            </div>
            <div className="terminal-line text-base-content/40 italic">
              // Who depends on it?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
