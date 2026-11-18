import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { Trend } from "@/lib/training/stats";
import { cn } from "@/lib/utils";

const LABELS: Record<Trend, string> = { up: "subiu", down: "caiu", equal: "estável", "n/a": "não se aplica" };

/** Tendência sem juízo de valor: indica direção, não "melhora". */
export function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs",
        trend === "n/a" && "text-muted-foreground",
      )}
      title={`${label}: ${LABELS[trend]}`}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>
        {label} <span className="sr-only">{LABELS[trend]}</span>
      </span>
    </span>
  );
}
