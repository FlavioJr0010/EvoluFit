import { CookingPot, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { NutritionLine } from "@/components/nutrition/nutrition-facts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listRecipes } from "@/lib/data/foods";
import { param } from "@/lib/data/search-params";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Preparações" };

export default function RecipesPage({ searchParams }: PageProps<"/preparacoes">) {
  return (
    <>
      <PageHeader
        title="Preparações"
        description="Receitas compostas por alimentos. Os valores vêm sempre dos ingredientes."
        actions={
          <LinkButton href="/preparacoes/nova" size="lg">
            <Plus /> Nova preparação
          </LinkButton>
        }
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <RecipeList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RecipeList({ searchParams }: Pick<PageProps<"/preparacoes">, "searchParams">) {
  const archived = param(await searchParams, "arquivadas") === "1";
  const recipes = await listRecipes({ archived });
  return (
    <>
      <div className="mb-4 inline-flex rounded-lg border p-0.5 text-sm">
        <Link href="/preparacoes" className={cn("rounded-md px-3 py-1.5", !archived && "bg-muted font-medium")}>
          Ativas
        </Link>
        <Link href="/preparacoes?arquivadas=1" className={cn("rounded-md px-3 py-1.5", archived && "bg-muted font-medium")}>
          Arquivadas
        </Link>
      </div>
      {recipes.length === 0 ? (
        <EmptyState
          icon={CookingPot}
          title={archived ? "Nenhuma preparação arquivada" : "Nenhuma preparação cadastrada"}
          description={archived ? undefined : "Monte receitas como “ovo mexido” a partir dos seus alimentos."}
          action={!archived ? <LinkButton href="/preparacoes/nova">Criar preparação</LinkButton> : undefined}
        />
      ) : (
        <Card className="gap-0 divide-y py-0">
          {recipes.map((r) => (
            <Link key={r.id} href={`/preparacoes/${r.id}`} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.items.length} ingrediente(s) · rende {formatNumber(r.servings, 2)} porção(ões)
                </span>
              </span>
              <NutritionLine nutrition={r.perServing} />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
