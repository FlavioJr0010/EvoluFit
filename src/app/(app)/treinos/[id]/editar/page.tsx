import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkout } from "@/lib/data/workouts";
import { uuidSchema } from "@/lib/validation/common";

import { loadWorkoutEditorData } from "../../editor-data";
import { WorkoutEditor } from "../../workout-editor";

export const metadata: Metadata = { title: "Editar treino" };

export default function EditWorkoutPage({ params }: PageProps<"/treinos/[id]/editar">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <EditWorkout params={params} />
    </Suspense>
  );
}

async function EditWorkout({ params }: Pick<PageProps<"/treinos/[id]/editar">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const workout = await getWorkout(id);
  if (!workout) notFound();
  const { exercises, lastSessions } = await loadWorkoutEditorData(workout);

  return (
    <>
      <PageHeader title="Editar treino" backHref={`/treinos/${id}`} />
      <Card className="max-w-3xl">
        <CardContent>
          <WorkoutEditor exercises={exercises} date={workout.date} workout={workout} lastSessions={lastSessions} />
        </CardContent>
      </Card>
    </>
  );
}
