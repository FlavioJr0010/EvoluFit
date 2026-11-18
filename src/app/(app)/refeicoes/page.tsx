import { Copy, Pencil, Plus, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DateNav } from "@/components/app/date-nav";
import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { NutritionFacts, NutritionLine } from "@/components/nutrition/nutrition-facts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getToday } from "@/lib/data/context";
import { listMealsByDate } from "@/lib/data/meals";
import { dateParam, param } from "@/lib/data/search-params";
import { formatKcal } from "@/lib/format";
import { formatQuantity } from "@/lib/nutrition/labels";
import { mealLabel } from "@/lib/nutrition/meals";
import { sumNutrition } from "@/lib/nutrition/calc";

import { DeleteMealButton } from "./delete-meal-button";

export const metadata: Metadata = { title: "Refeições" };

export default function MealsPage({ searchParams }: PageProps<"/refeicoes">) {
  return (
    <>
      <PageHeader title="Refeições" description="Organize e calcule o que você registrou. Não substitui orientação de nutricionista." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <MealsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MealsContent({ searchParams }: Pick<PageProps<"/refeicoes">, "searchParams">) {
  const params = await searchParams;
  const today = await getToday();
  const date = dateParam(params, today);
  const meals = await listMealsByDate(date);
  const dayTotal = sumNutrition(meals.map((m) => m.totals));
  const copied = Number(param(params, "copiadas") ?? 0);
  const archivedWarning = Number(param(params, "aviso") ?? 0);

  return (
    <>
      <DateNav date={date} today={today} />
      {copied > 0 ? (
        <Alert className="mb-4">
          <AlertDescription>
            {copied} refeição(ões) copiada(s) com os valores atuais dos cadastros.
            {archivedWarning > 0 ? ` Atenção: ${archivedWarning} item(ns) usa(m) alimento ou preparação arquivado.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <LinkButton href={`/refeicoes/nova?data=${date}`} size="lg">
          <Plus /> Nova refeição
        </LinkButton>
        <LinkButton href={`/refeicoes/duplicar?data=${date}`} variant="outline" size="lg">
          <Copy /> Duplicar de outra data
        </LinkButton>
      </div>

      {meals.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Nenhuma refeição neste dia" description="Registre o que você comeu para ver o total do dia." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
          <div className="flex flex-col gap-4">
            {meals.map((meal) => {
              const label = mealLabel(meal);
              return (
                <Card key={meal.id}>
                  <CardHeader>
                    <CardTitle>{label}</CardTitle>
                    <CardAction className="flex items-center gap-1">
                      <span className="mr-2 text-sm font-medium tabular-nums">{formatKcal(meal.totals.calories)}</span>
                      <Link href={`/refeicoes/${meal.id}`} aria-label={`Editar ${label}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="size-4" />
                      </Link>
                      <DeleteMealButton id={meal.id} label={label} />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <ul className="flex flex-col gap-1.5">
                      {meal.items.map((item) => (
                        <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                          <span>
                            {item.name} <span className="text-muted-foreground">· {formatQuantity(item.quantity, item.unit)}</span>
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{formatKcal(item.nutrition.calories)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t pt-2">
                      <NutritionLine nutrition={meal.totals} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="self-start lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Total do dia</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionFacts nutrition={dayTotal} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
