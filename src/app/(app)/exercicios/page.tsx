import { Dumbbell, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { param } from "@/lib/data/search-params";
import { listExercises } from "@/lib/data/workouts";
import { MUSCLE_GROUPS } from "@/lib/training/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Exercícios" };

export default function ExercisesPage({ searchParams }: PageProps<"/exercicios">) {
  return (
    <>
      <PageHeader
        title="Exercícios"
        description="Seu catálogo pessoal de exercícios."
        actions={
          <LinkButton href="/exercicios/novo" size="lg">
            <Plus /> Novo exercício
          </LinkButton>
        }
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ExerciseList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ExerciseList({ searchParams }: Pick<PageProps<"/exercicios">, "searchParams">) {
  const archived = param(await searchParams, "arquivados") === "1";
  const exercises = await listExercises({ archived });
  const groups = MUSCLE_GROUPS.map((g) => ({ ...g, items: exercises.filter((e) => e.muscle_group === g.value) })).filter((g) => g.items.length);

  return (
    <>
      <div className="mb-4 inline-flex rounded-lg border p-0.5 text-sm">
        <Link href="/exercicios" className={cn("rounded-md px-3 py-1.5", !archived && "bg-muted font-medium")}>
          Ativos
        </Link>
        <Link href="/exercicios?arquivados=1" className={cn("rounded-md px-3 py-1.5", archived && "bg-muted font-medium")}>
          Arquivados
        </Link>
      </div>
      {groups.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={archived ? "Nenhum exercício arquivado" : "Nenhum exercício cadastrado"}
          description={archived ? undefined : "Cadastre exercícios como leg press, supino ou puxada alta."}
          action={!archived ? <LinkButton href="/exercicios/novo">Cadastrar exercício</LinkButton> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.value} aria-labelledby={`grupo-${g.value}`}>
              <h2 id={`grupo-${g.value}`} className="mb-2 text-sm font-medium text-muted-foreground">
                {g.label}
              </h2>
              <Card className="gap-0 divide-y py-0">
                {g.items.map((e) => (
                  <Link key={e.id} href={`/exercicios/${e.id}`} className="flex items-baseline justify-between gap-2 px-4 py-3 hover:bg-muted/50">
                    <span className="font-medium">{e.name}</span>
                    {e.equipment ? <span className="text-sm text-muted-foreground">{e.equipment}</span> : null}
                  </Link>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
