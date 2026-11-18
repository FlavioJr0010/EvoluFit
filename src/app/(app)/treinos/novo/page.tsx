import { Dumbbell } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getToday } from "@/lib/data/context";
import { dateParam, param } from "@/lib/data/search-params";
import { getWorkout } from "@/lib/data/workouts";
import { uuidSchema } from "@/lib/validation/common";

import { loadWorkoutEditorData } from "../editor-data";
import { WorkoutEditor } from "../workout-editor";

export const metadata: Metadata = { title: "Registrar treino" };

export default function NewWorkoutPage({ searchParams }: PageProps<"/treinos/novo">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <NewWorkout searchParams={searchParams} />
    </Suspense>
  );
}

async function NewWorkout({ searchParams }: Pick<PageProps<"/treinos/novo">, "searchParams">) {
  const params = await searchParams;
  const date = dateParam(params, await getToday());
  const de = param(params, "de");
  const template = de && uuidSchema.safeParse(de).success ? await getWorkout(de) : null;
  const { exercises, lastSessions } = await loadWorkoutEditorData(template ?? undefined);

  return (
    <>
      <PageHeader title={template ? "Repetir treino" : "Registrar treino"} backHref="/treinos" />
      {exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Cadastre exercícios primeiro"
          action={<LinkButton href="/exercicios/novo?voltar=treino">Cadastrar exercício</LinkButton>}
        />
      ) : (
        <Card className="max-w-3xl">
          <CardContent>
            <WorkoutEditor exercises={exercises} date={date} template={template ?? undefined} lastSessions={lastSessions} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
