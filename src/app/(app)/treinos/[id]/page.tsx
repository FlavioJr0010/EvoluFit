import { Copy, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWorkout } from "@/lib/data/workouts";
import { formatDateLong } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { formatVolume } from "@/lib/training/format";
import { muscleGroupLabel } from "@/lib/training/labels";
import { exerciseStats, workoutVolume } from "@/lib/training/stats";
import { uuidSchema } from "@/lib/validation/common";

import { Stat } from "@/components/app/stat";
import { DeleteWorkoutButton } from "../delete-workout-button";

export const metadata: Metadata = { title: "Treino" };

export default function WorkoutPage({ params }: PageProps<"/treinos/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <WorkoutDetail params={params} />
    </Suspense>
  );
}

async function WorkoutDetail({ params }: Pick<PageProps<"/treinos/[id]">, "params">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const stats = workout.exercises.map((we) => exerciseStats(we.sets));
  const totalSets = stats.reduce((s, x) => s + x.totalSets, 0);
  const totalReps = stats.reduce((s, x) => s + x.totalReps, 0);

  return (
    <>
      <PageHeader
        title={workout.title}
        description={<span className="capitalize">{formatDateLong(workout.date)}</span>}
        backHref="/treinos"
        actions={
          <>
            <LinkButton href={`/treinos/${id}/editar`} variant="outline" size="lg">
              <Pencil /> Editar
            </LinkButton>
            <LinkButton href={`/treinos/novo?de=${id}`} variant="outline" size="lg">
              <Copy /> Repetir treino
            </LinkButton>
            <DeleteWorkoutButton id={id} />
          </>
        }
      />
      <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Exercícios" value={String(workout.exercises.length)} />
        <Stat label="Séries válidas" value={String(totalSets)} />
        <Stat label="Repetições" value={String(totalReps)} />
        <Stat label="Volume total" value={formatVolume(workoutVolume(workout.exercises))} />
      </dl>
      {workout.notes ? <p className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">{workout.notes}</p> : null}
      <div className="flex flex-col gap-4">
        {workout.exercises.map((we, i) => {
          const s = stats[i];
          return (
            <Card key={we.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/evolucao/exercicio/${we.exercise.id}`} className="underline-offset-4 hover:underline">
                    {we.exercise.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {muscleGroupLabel(we.exercise.muscle_group)} · {s.totalSets} série(s) · {s.totalReps} reps
                  {s.avgRepsPerSet != null ? ` · média ${formatNumber(s.avgRepsPerSet, 1)} reps/série` : ""}
                  {s.maxLoad != null ? ` · máx. ${formatNumber(s.maxLoad, 2)} kg · volume ${formatVolume(s.volume)}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Série</TableHead>
                      <TableHead className="text-right">Carga</TableHead>
                      <TableHead className="text-right">Reps</TableHead>
                      <TableHead>Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {we.sets.map((set) => (
                      <TableRow key={set.id} className={set.is_warmup ? "text-muted-foreground" : undefined}>
                        <TableCell>
                          {set.set_number}
                          {set.is_warmup ? (
                            <Badge variant="outline" className="ml-2">
                              aquec.
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{set.load_kg != null ? `${formatNumber(set.load_kg, 2)} kg` : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{set.reps}</TableCell>
                        <TableCell className="text-sm">{set.notes ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {we.notes ? <p className="mt-2 text-sm text-muted-foreground">{we.notes}</p> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
