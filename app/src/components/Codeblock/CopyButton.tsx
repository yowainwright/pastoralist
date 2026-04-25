import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Copy, Check } from "lucide-react";

const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: {
    idle: { on: { COPY: "copied" } },
    copied: { after: { 2000: "idle" } },
  },
});

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      send({ type: "COPY" });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      className="flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
