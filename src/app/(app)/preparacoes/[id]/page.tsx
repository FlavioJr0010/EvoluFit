import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipe, getRecipeUsage, listFoods } from "@/lib/data/foods";
import { uuidSchema } from "@/lib/validation/common";

import { RecipeActions } from "../recipe-actions";
import { RecipeEditor } from "../recipe-editor";

export const metadata: Metadata = { title: "Preparação" };

export default function RecipePage({ params }: PageProps<"/preparacoes/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <RecipeContent params={params} />
    </Suspense>
  );
}

async function RecipeContent({ params }: Pick<PageProps<"/preparacoes/[id]">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [recipe, foods, usage] = await Promise.all([getRecipe(id), listFoods(), getRecipeUsage(id)]);
  if (!recipe) notFound();

  return (
    <>
      <PageHeader title={recipe.name} backHref="/preparacoes" actions={recipe.archived_at ? <Badge variant="secondary">Arquivada</Badge> : undefined} />
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
        <Card>
          <CardContent>
            <RecipeEditor foods={foods} recipe={recipe} />
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Uso</CardTitle>
            <CardDescription>
              {usage.meals > 0
                ? `Usada em ${usage.meals} item(ns) de refeições. Pode ser arquivada, não excluída. As refeições já registradas mantêm os valores da época.`
                : "Ainda não foi usada em refeições."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeActions id={recipe.id} archived={Boolean(recipe.archived_at)} used={usage.meals > 0} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
