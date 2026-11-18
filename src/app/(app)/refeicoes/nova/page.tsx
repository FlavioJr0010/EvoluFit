import { Apple } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getToday } from "@/lib/data/context";
import { dateParam, param } from "@/lib/data/search-params";
import { MEAL_TYPES, type MealType } from "@/lib/nutrition/meals";

import { loadEditorOptions } from "../editor-data";
import { MealEditor } from "../meal-editor";

export const metadata: Metadata = { title: "Nova refeição" };

export default function NewMealPage({ searchParams }: PageProps<"/refeicoes/nova">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <NewMeal searchParams={searchParams} />
    </Suspense>
  );
}

async function NewMeal({ searchParams }: Pick<PageProps<"/refeicoes/nova">, "searchParams">) {
  const params = await searchParams;
  const date = dateParam(params, await getToday());
  const tipo = param(params, "tipo");
  const defaultType = MEAL_TYPES.some((t) => t.value === tipo) ? (tipo as MealType) : undefined;
  const { foods, recipes } = await loadEditorOptions();

  return (
    <>
      <PageHeader title="Nova refeição" backHref={`/refeicoes?data=${date}`} />
      {foods.length + recipes.length === 0 ? (
        <EmptyState
          icon={Apple}
          title="Cadastre alimentos primeiro"
          description="As refeições são montadas com seus alimentos e preparações."
          action={<LinkButton href="/alimentos/novo">Cadastrar alimento</LinkButton>}
        />
      ) : (
        <Card className="max-w-3xl">
          <CardContent>
            <MealEditor date={date} foods={foods} recipes={recipes} defaultType={defaultType} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
