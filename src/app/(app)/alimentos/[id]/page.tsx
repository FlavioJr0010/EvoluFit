import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getFood, getFoodUsage } from "@/lib/data/foods";
import { uuidSchema } from "@/lib/validation/common";

import { FoodActions } from "../food-actions";
import { FoodCalculator } from "../food-calculator";
import { FoodForm } from "../food-form";

export const metadata: Metadata = { title: "Editar alimento" };

export default function FoodPage({ params }: PageProps<"/alimentos/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <FoodContent params={params} />
    </Suspense>
  );
}

async function FoodContent({ params }: Pick<PageProps<"/alimentos/[id]">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [food, usage] = await Promise.all([getFood(id), getFoodUsage(id)]);
  if (!food) notFound();
  const used = usage.recipes + usage.meals > 0;

  return (
    <>
      <PageHeader
        title={food.name}
        backHref="/alimentos"
        actions={food.archived_at ? <Badge variant="secondary">Arquivado</Badge> : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Card>
          <CardContent>
            <FoodForm food={food} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Calcular porção</CardTitle>
              <CardDescription>Valores proporcionais à quantidade.</CardDescription>
            </CardHeader>
            <CardContent>
              <FoodCalculator food={food} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Uso</CardTitle>
              <CardDescription>
                {used
                  ? `Usado em ${usage.recipes} ingrediente(s) de preparações e ${usage.meals} item(ns) de refeições. Alimentos usados não podem ser excluídos, apenas arquivados.`
                  : "Ainda não foi usado. Pode ser excluído."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FoodActions id={food.id} archived={Boolean(food.archived_at)} used={used} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
