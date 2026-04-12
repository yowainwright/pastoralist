import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CodeCardProps } from "./types";

export function CodeCard({
  children,
  variant = "light",
  className,
}: CodeCardProps) {
  const variantClasses =
    variant === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-slate-50 border-slate-200";
  const codeClasses = cn(
    "overflow-hidden rounded-lg border py-0 gap-0",
    variantClasses,
    className,
  );

  return (
    <Card className={codeClasses}>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
