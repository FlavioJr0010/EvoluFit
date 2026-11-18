import { Scale } from "lucide-react";

import { Stat } from "@/components/app/stat";
import { TimeChart } from "@/components/charts/time-chart";
import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Checkin } from "@/lib/data/checkins";
import { formatDate } from "@/lib/dates";
import { averageWater, MOVING_AVERAGE_MIN_POINTS, weightChange, weightMovingAverage } from "@/lib/tracking/checkins";
import { formatKg, formatSignedKg, formatWater } from "@/lib/format";
import { eachDay, isWithin, type DateRange } from "@/lib/dates";

/**
 * `checkins` deve incluir os 6 dias anteriores ao período, para que a média
 * móvel do início do período considere a janela completa.
 */
export function WeightSection({ checkins, range }: { checkins: Checkin[]; range: DateRange }) {
  const all = checkins
    .filter((c) => c.weight_kg != null)
    .map((c) => ({ date: c.date, weight: Number(c.weight_kg) }));
  const series = weightMovingAverage(all).filter((p) => isWithin(p.date, range));
  const points = all.filter((p) => isWithin(p.date, range));
  const change = weightChange(points);
  const hasAverage = series.some((p) => p.average != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peso corporal</CardTitle>
        <CardDescription>
          A média móvel de 7 dias mostra a tendência: o peso diário oscila com hidratação, sal e alimentação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Sem pesagens no período"
            action={<LinkButton href="/acompanhamento" variant="outline">Registrar peso</LinkButton>}
          />
        ) : (
          <>
            <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Última pesagem" value={formatKg(points.at(-1)!.weight)} hint={formatDate(points.at(-1)!.date)} />
              <Stat
                label="Diferença no período"
                value={change ? formatSignedKg(change.diff) : "—"}
                hint={change ? `${formatDate(change.first.date)} → ${formatDate(change.last.date)}` : "Precisa de 2 pesagens"}
              />
              <Stat label="Pesagens" value={String(points.length)} />
            </dl>
            <TimeChart
              data={series.map((p) => ({ date: p.date, weight: p.weight, average: p.average }))}
              series={[
                { key: "weight", label: "Peso", kind: "line", color: "var(--chart-2)" },
                ...(hasAverage
                  ? [{ key: "average", label: "Média móvel (7 dias)", kind: "line" as const, color: "var(--chart-1)", dashed: true }]
                  : []),
              ]}
              unit="kg"
              digits={2}
            />
            {!hasAverage ? (
              <p className="mt-2 text-xs text-muted-foreground">
                A média móvel aparece quando houver ao menos {MOVING_AVERAGE_MIN_POINTS} pesagens em 7 dias.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function WaterSection({ checkins, range }: { checkins: Checkin[]; range: DateRange }) {
  const values = checkins.filter((c) => c.water_ml != null && isWithin(c.date, range)).map((c) => ({ date: c.date, water_ml: c.water_ml! }));
  const avg = averageWater(values);
  const byDate = new Map(values.map((v) => [v.date, v.water_ml]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hidratação</CardTitle>
        <CardDescription>Sem meta automática: a necessidade de água depende de avaliação individual.</CardDescription>
      </CardHeader>
      <CardContent>
        {values.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Sem registros de água no período"
            action={<LinkButton href="/acompanhamento" variant="outline">Registrar água</LinkButton>}
          />
        ) : (
          <>
            <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Média por dia registrado" value={formatWater(avg!)} />
              <Stat label="Dias com registro" value={String(values.length)} />
            </dl>
            <TimeChart
              data={eachDay(range).map((date) => ({ date, water: byDate.get(date) ?? null }))}
              series={[{ key: "water", label: "Água", kind: "bar", color: "var(--chart-3)" }]}
              unit="ml"
              digits={0}
              zeroBased
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
