import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listFoods } from "@/lib/data/foods";
import { Apple } from "lucide-react";

import { RecipeEditor } from "../recipe-editor";

export const metadata: Metadata = { title: "Nova preparação" };

export default function NewRecipePage() {
  return (
    <>
      <PageHeader title="Nova preparação" backHref="/preparacoes" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <NewRecipe />
      </Suspense>
    </>
  );
}

async function NewRecipe() {
  const foods = await listFoods();
  if (foods.length === 0) {
    return (
      <EmptyState
        icon={Apple}
        title="Cadastre alimentos primeiro"
        description="Preparações são compostas por alimentos cadastrados."
        action={<LinkButton href="/alimentos/novo">Cadastrar alimento</LinkButton>}
      />
    );
  }
  return (
    <Card className="max-w-3xl">
      <CardContent>
        <RecipeEditor foods={foods} />
      </CardContent>
    </Card>
  );
}
