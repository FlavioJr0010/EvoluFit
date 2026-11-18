import { TrendBadge } from "@/components/charts/trend-badge";
import type { PeriodComparison } from "@/lib/training/stats";

export function ComparisonCell({ comparison }: { comparison: PeriodComparison }) {
  if (comparison.status === "insufficient") {
    return (
      <span className="text-xs text-muted-foreground" title={`Sessões: ${comparison.a.sessions} antes, ${comparison.b.sessions} agora (mínimo 2 em cada)`}>
        Dados insuficientes para comparar
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      <TrendBadge trend={comparison.load} label="Carga" />
      <TrendBadge trend={comparison.volume} label="Volume" />
      <TrendBadge trend={comparison.reps} label="Reps" />
    </span>
  );
}
