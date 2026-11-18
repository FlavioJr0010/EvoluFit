import { Dumbbell, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listWorkouts } from "@/lib/data/workouts";
import { formatDate } from "@/lib/dates";
import { formatVolume } from "@/lib/training/format";
import { workoutVolume } from "@/lib/training/stats";

export const metadata: Metadata = { title: "Treinos" };

export default function WorkoutsPage() {
  return (
    <>
      <PageHeader
        title="Treinos"
        description="Histórico de treinos por data."
        actions={
          <>
            <LinkButton href="/exercicios" variant="outline" size="lg">
              Exercícios
            </LinkButton>
            <LinkButton href="/treinos/novo" size="lg">
              <Plus /> Registrar treino
            </LinkButton>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <WorkoutList />
      </Suspense>
    </>
  );
}

async function WorkoutList() {
  const workouts = await listWorkouts({ limit: 100 });
  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Nenhum treino registrado"
        description="Registre exercícios e séries com carga e repetições."
        action={<LinkButton href="/treinos/novo">Registrar treino</LinkButton>}
      />
    );
  }
  return (
    <Card className="gap-0 divide-y py-0">
      {workouts.map((w) => {
        const volume = workoutVolume(w.exercises);
        return (
          <Link key={w.id} href={`/treinos/${w.id}`} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{w.title}</span>
              <span className="shrink-0 text-sm text-muted-foreground">{formatDate(w.date)}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              {w.exercises.map((e) => e.exercise.name).join(", ")}
              {volume > 0 ? ` · volume ${formatVolume(volume)}` : ""}
            </span>
          </Link>
        );
      })}
    </Card>
  );
}
