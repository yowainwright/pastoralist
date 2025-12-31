import { lazy, Suspense, type ReactElement } from "react";
import type { PreProps } from "./types";

const Mermaid = lazy(() =>
  import("../Mermaid").then((m) => ({ default: m.Mermaid })),
);

export function Pre({ children, ...props }: PreProps) {
  const child = children as ReactElement<{
    className?: string;
    children?: string;
  }>;
  const className = child?.props?.className || "";
  const isMermaid = className.includes("language-mermaid");

  if (isMermaid) {
    const chart = child?.props?.children || "";
    return (
      <Suspense
        fallback={
          <div className="my-6 flex justify-center animate-pulse">
            <div className="h-32 w-full max-w-md bg-base-content/10 rounded" />
          </div>
        }
      >
        <Mermaid chart={chart} />
      </Suspense>
    );
  }

  return <pre {...props}>{children}</pre>;
}
