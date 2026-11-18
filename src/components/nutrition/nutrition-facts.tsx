import { NUTRIENT_KEYS, NUTRIENTS, type Nutrition } from "@/lib/nutrition/types";
import { formatKcal, formatNutrient } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Calorias + nutrientes, marcando totais parciais (≥). Sem hooks: serve a server e client. */
export function NutritionFacts({
  nutrition,
  className,
  compact = false,
}: {
  nutrition: Nutrition;
  className?: string;
  compact?: boolean;
}) {
  const hasPartial = NUTRIENT_KEYS.some((k) => nutrition.incomplete.includes(k) && nutrition.nutrients[k] != null);
  return (
    <div className={className}>
      <p className={cn("font-semibold tabular-nums", compact ? "text-base" : "text-2xl")}>{formatKcal(nutrition.calories)}</p>
      <dl className={cn("mt-2 grid gap-x-4 gap-y-1 text-sm", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
        {NUTRIENT_KEYS.map((k) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{compact ? NUTRIENTS[k].short : NUTRIENTS[k].label}</dt>
            <dd className="tabular-nums">
              {formatNutrient(nutrition.nutrients[k], NUTRIENTS[k].unit, nutrition.incomplete.includes(k))}
            </dd>
          </div>
        ))}
      </dl>
      {hasPartial ? (
        <p className="mt-2 text-xs text-muted-foreground">
          ≥ total parcial: algum item não tem esse nutriente cadastrado. — = não cadastrado.
        </p>
      ) : null}
    </div>
  );
}

/** Linha curta: "176 kcal · Carb. 0,8 g · Prot. 12,7 g · Gord. 13,7 g" */
export function NutritionLine({ nutrition }: { nutrition: Nutrition }) {
  const parts = (["carbs_g", "protein_g", "fat_g"] as const)
    .filter((k) => nutrition.nutrients[k] != null)
    .map((k) => `${NUTRIENTS[k].short} ${formatNutrient(nutrition.nutrients[k], NUTRIENTS[k].unit, nutrition.incomplete.includes(k))}`);
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{formatKcal(nutrition.calories)}</span>
      {parts.length ? ` · ${parts.join(" · ")}` : null}
    </span>
  );
}
