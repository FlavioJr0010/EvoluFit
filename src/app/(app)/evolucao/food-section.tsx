import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

import { TimeChart } from "@/components/charts/time-chart";
import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Meal } from "@/lib/data/meals";
import { eachDay, formatDate, type DateRange } from "@/lib/dates";
import { formatKcal, formatNutrient } from "@/lib/format";
import { sumNutrition } from "@/lib/nutrition/calc";
import { MEAL_TYPES } from "@/lib/nutrition/meals";
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrition/types";

import { Stat } from "@/components/app/stat";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const TABLE_NUTRIENTS: NutrientKey[] = ["carbs_g", "protein_g", "fat_g", "fiber_g", "sodium_mg"];

export function FoodSection({ meals, range }: { meals: Meal[]; range: DateRange }) {
  if (meals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={UtensilsCrossed} title="Sem refeições no período" action={<LinkButton href="/refeicoes" variant="outline">Registrar refeição</LinkButton>} />
        </CardContent>
      </Card>
    );
  }

  const byDay = new Map<string, Meal[]>();
  for (const m of meals) byDay.set(m.date, [...(byDay.get(m.date) ?? []), m]);
  const days = [...byDay.keys()].sort();
  const dayTotals = days.map((d) => ({ date: d, total: sumNutrition(byDay.get(d)!.map((m) => m.totals)) }));
  const avg = dayTotals.reduce((s, d) => s + d.total.calories, 0) / dayTotals.length;

  const chart = eachDay(range).map((date) => {
    const point: Record<string, number | null | string> = { date };
    for (const t of MEAL_TYPES) {
      const kcal = (byDay.get(date) ?? []).filter((m) => m.meal_type === t.value).reduce((s, m) => s + m.totals.calories, 0);
      point[t.value] = kcal || null;
    }
    return point as { date: string } & Record<string, number | null>;
  });
  const usedTypes = MEAL_TYPES.filter((t) => meals.some((m) => m.meal_type === t.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alimentação</CardTitle>
        <CardDescription>Calorias por dia, por refeição. Nutrientes com ≥ são totais parciais: algum alimento não tem o dado cadastrado.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Média por dia registrado" value={formatKcal(avg)} />
          <Stat label="Dias com refeições" value={String(days.length)} />
          <Stat label="Refeições" value={String(meals.length)} />
        </dl>
        <TimeChart
          data={chart}
          series={usedTypes.map((t, i) => ({ key: t.value, label: t.label, kind: "bar" as const, color: COLORS[i % COLORS.length], stackId: "kcal" }))}
          unit="kcal"
          digits={0}
          zeroBased
        />
        <div className="-mx-4 overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead className="text-right">Calorias</TableHead>
                {TABLE_NUTRIENTS.map((k) => (
                  <TableHead key={k} className="text-right">
                    {NUTRIENTS[k].short}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dayTotals].reverse().map(({ date, total }) => (
                <TableRow key={date}>
                  <TableCell>
                    <Link href={`/refeicoes?data=${date}`} className="underline-offset-4 hover:underline">
                      {formatDate(date)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatKcal(total.calories)}</TableCell>
                  {TABLE_NUTRIENTS.map((k) => (
                    <TableCell key={k} className="text-right tabular-nums">
                      {formatNutrient(total.nutrients[k], NUTRIENTS[k].unit, total.incomplete.includes(k))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
