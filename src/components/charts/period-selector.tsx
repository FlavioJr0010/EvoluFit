import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERIOD_PRESETS, type ResolvedPeriod } from "@/lib/period";
import { cn } from "@/lib/utils";

/** Seleção de período via query string (funciona sem JavaScript). */
export function PeriodSelector({ basePath, period, extra = {} }: { basePath: string; period: ResolvedPeriod; extra?: Record<string, string> }) {
  const query = (params: Record<string, string>) => `${basePath}?${new URLSearchParams({ ...extra, ...params })}`;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Período">
        {PERIOD_PRESETS.map((p) => (
          <Link
            key={p.value}
            href={query({ periodo: p.value })}
            aria-current={period.preset === p.value ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              period.preset === p.value && "bg-muted font-medium text-foreground",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <form action={basePath} className="flex flex-wrap items-end gap-2">
        {Object.entries(extra).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="periodo" value="personalizado" />
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          De
          <Input type="date" name="de" defaultValue={period.range.from} required className="h-9 w-auto" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Até
          <Input type="date" name="ate" defaultValue={period.range.to} required className="h-9 w-auto" />
        </label>
        <Button type="submit" variant={period.preset === "personalizado" ? "default" : "outline"} size="lg">
          Aplicar
        </Button>
      </form>
    </div>
  );
}
