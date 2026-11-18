import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMeal } from "@/lib/data/meals";
import { mealLabel } from "@/lib/nutrition/meals";
import { uuidSchema } from "@/lib/validation/common";

import { loadEditorOptions } from "../editor-data";
import { MealEditor } from "../meal-editor";

export const metadata: Metadata = { title: "Editar refeição" };

export default function EditMealPage({ params }: PageProps<"/refeicoes/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <EditMeal params={params} />
    </Suspense>
  );
}

async function EditMeal({ params }: Pick<PageProps<"/refeicoes/[id]">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [meal, { foods, recipes }] = await Promise.all([getMeal(id), loadEditorOptions()]);
  if (!meal) notFound();

  return (
    <>
      <PageHeader title={`Editar ${mealLabel(meal).toLowerCase()}`} backHref={`/refeicoes?data=${meal.date}`} />
      <Card className="max-w-3xl">
        <CardContent>
          <MealEditor date={meal.date} foods={foods} recipes={recipes} meal={meal} />
        </CardContent>
      </Card>
    </>
  );
}
