import { UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getToday } from "@/lib/data/context";
import { listMealsByDate } from "@/lib/data/meals";
import { dateParam, param } from "@/lib/data/search-params";
import { addDays, formatDate, isDateString } from "@/lib/dates";
import { formatKcal } from "@/lib/format";
import { mealLabel } from "@/lib/nutrition/meals";

import { DuplicateForm } from "./duplicate-form";

export const metadata: Metadata = { title: "Duplicar refeições" };

export default function DuplicatePage({ searchParams }: PageProps<"/refeicoes/duplicar">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Duplicate searchParams={searchParams} />
    </Suspense>
  );
}

async function Duplicate({ searchParams }: Pick<PageProps<"/refeicoes/duplicar">, "searchParams">) {
  const params = await searchParams;
  const target = dateParam(params, await getToday());
  const origem = param(params, "origem");
  const source = origem && isDateString(origem) ? origem : addDays(target, -1);
  const meals = await listMealsByDate(source);

  return (
    <>
      <PageHeader title="Duplicar refeições" description={`Copiar para ${formatDate(target)}.`} backHref={`/refeicoes?data=${target}`} />
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-5">
          <form action="/refeicoes/duplicar" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="data" value={target} />
            <label className="flex flex-col gap-1 text-sm font-medium">
              Data de origem
              <Input type="date" name="origem" defaultValue={source} className="h-10 w-auto" required />
            </label>
            <Button type="submit" variant="outline" size="lg">
              Ver refeições
            </Button>
          </form>
          {source === target ? (
            <p className="text-sm text-muted-foreground">Escolha uma data diferente do destino.</p>
          ) : meals.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title={`Nenhuma refeição em ${formatDate(source)}`} />
          ) : (
            <DuplicateForm
              key={source}
              sourceDate={source}
              targetDate={target}
              meals={meals.map((m) => ({
                id: m.id,
                label: mealLabel(m),
                summary: `${m.items.map((i) => i.name).join(", ")} · ${formatKcal(m.totals.calories)}`,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
