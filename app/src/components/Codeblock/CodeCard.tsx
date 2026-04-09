import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CodeCardProps } from "./types";

export function CodeCard({
  children,
  variant = "light",
  className,
}: CodeCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg border",
        variant === "dark"
          ? "bg-slate-900 border-slate-700"
          : "bg-slate-50 border-slate-200",
        className,
      )}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
