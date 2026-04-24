import React from "react";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Copy, Check } from "lucide-react";

const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: {
    idle: { on: { COPY: "copied" } },
    copied: { after: { 800: "idle" } },
  },
});

const styles = {
  button:
    "btn btn-ghost btn-sm size-9 shrink-0 rounded-xl border border-base-content/10 bg-base-100/70 hover:bg-base-200/80",
  icon: "h-5 w-5 pointer-events-none",
  iconSuccess: "h-5 w-5 pointer-events-none text-green-500",
};

export function CopyButton() {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const codeEl = e.currentTarget
      .closest("figure, div")
      ?.querySelector("code");
    if (!codeEl) return;
    try {
      await navigator.clipboard.writeText(codeEl.textContent ?? "");
      send({ type: "COPY" });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <Check className={styles.iconSuccess} />
      ) : (
        <Copy className={styles.icon} />
      )}
    </button>
  );
}
