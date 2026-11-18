import { Apple, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { NutritionLine } from "@/components/nutrition/nutrition-facts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listFoods } from "@/lib/data/foods";
import { param } from "@/lib/data/search-params";
import { foodNutrition } from "@/lib/nutrition/calc";
import { formatQuantity } from "@/lib/nutrition/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Alimentos" };

export default function FoodsPage({ searchParams }: PageProps<"/alimentos">) {
  return (
    <>
      <PageHeader
        title="Alimentos"
        description="Nutrientes registrados por quantidade-base."
        actions={
          <LinkButton href="/alimentos/novo" size="lg">
            <Plus /> Novo alimento
          </LinkButton>
        }
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <FoodList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FoodList({ searchParams }: Pick<PageProps<"/alimentos">, "searchParams">) {
  const params = await searchParams;
  const q = param(params, "q")?.trim() ?? "";
  const archived = param(params, "arquivados") === "1";
  const foods = await listFoods({ search: q || undefined, archived });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/alimentos" className="flex flex-1 gap-2" role="search">
          {archived ? <input type="hidden" name="arquivados" value="1" /> : null}
          <Input type="search" name="q" defaultValue={q} placeholder="Buscar alimento" aria-label="Buscar alimento" className="h-10 max-w-sm" />
          <Button type="submit" variant="outline" size="icon-lg" aria-label="Buscar">
            <Search />
          </Button>
        </form>
        <div className="inline-flex rounded-lg border p-0.5 text-sm">
          <Link href="/alimentos" className={cn("rounded-md px-3 py-1.5", !archived && "bg-muted font-medium")}>
            Ativos
          </Link>
          <Link href="/alimentos?arquivados=1" className={cn("rounded-md px-3 py-1.5", archived && "bg-muted font-medium")}>
            Arquivados
          </Link>
        </div>
      </div>

      {foods.length === 0 ? (
        <EmptyState
          icon={Apple}
          title={q ? "Nenhum alimento encontrado" : archived ? "Nenhum alimento arquivado" : "Nenhum alimento cadastrado"}
          description={q ? `Nada corresponde a “${q}”.` : archived ? undefined : "Cadastre alimentos como pão, ovo, arroz ou leite para montar suas refeições."}
          action={!archived ? <LinkButton href="/alimentos/novo">Cadastrar alimento</LinkButton> : undefined}
        />
      ) : (
        <Card className="gap-0 divide-y py-0">
          {foods.map((food) => (
            <Link key={food.id} href={`/alimentos/${food.id}`} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{food.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">por {formatQuantity(food.base_quantity, food.base_unit)}</span>
              </span>
              <NutritionLine nutrition={foodNutrition(food, food.base_quantity, food.base_unit)} />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
