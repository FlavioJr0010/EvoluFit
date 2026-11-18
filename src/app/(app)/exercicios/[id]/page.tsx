import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getExercise, getExerciseUsage } from "@/lib/data/workouts";
import { uuidSchema } from "@/lib/validation/common";

import { ExerciseActions } from "../exercise-actions";
import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = { title: "Exercício" };

export default function ExercisePage({ params }: PageProps<"/exercicios/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ExerciseContent params={params} />
    </Suspense>
  );
}

async function ExerciseContent({ params }: Pick<PageProps<"/exercicios/[id]">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [exercise, usage] = await Promise.all([getExercise(id), getExerciseUsage(id)]);
  if (!exercise) notFound();

  return (
    <>
      <PageHeader title={exercise.name} backHref="/exercicios" actions={exercise.archived_at ? <Badge variant="secondary">Arquivado</Badge> : undefined} />
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
        <Card>
          <CardContent>
            <ExerciseForm exercise={exercise} />
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Uso</CardTitle>
            <CardDescription>
              {usage.workouts > 0 ? `Usado em ${usage.workouts} treino(s). Pode ser arquivado, não excluído.` : "Ainda não foi usado em treinos."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {usage.workouts > 0 ? (
              <Link href={`/evolucao/exercicio/${exercise.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                Ver evolução deste exercício
              </Link>
            ) : null}
            <ExerciseActions id={exercise.id} archived={Boolean(exercise.archived_at)} used={usage.workouts > 0} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
