import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Stat } from "@/components/app/stat";
import { PeriodSelector } from "@/components/charts/period-selector";
import { TimeChart } from "@/components/charts/time-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getToday } from "@/lib/data/context";
import { param } from "@/lib/data/search-params";
import { getExercise, listWorkouts, sessionsByExercise } from "@/lib/data/workouts";
import { formatDate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { previousRange, resolvePeriod } from "@/lib/period";
import { formatVolume, summarizeSets } from "@/lib/training/format";
import { muscleGroupLabel } from "@/lib/training/labels";
import { sessionSeries } from "@/lib/training/report";
import { comparePeriods, exerciseStats, MIN_SESSIONS_TO_COMPARE } from "@/lib/training/stats";
import { uuidSchema } from "@/lib/validation/common";

import { ComparisonCell } from "../../comparison-cell";

export const metadata: Metadata = { title: "Evolução do exercício" };

export default function ExerciseEvolutionPage({ params, searchParams }: PageProps<"/evolucao/exercicio/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px]" />}>
      <ExerciseEvolution params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ExerciseEvolution({ params, searchParams }: PageProps<"/evolucao/exercicio/[id]">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const sp = await searchParams;
  const today = await getToday();
  const period = resolvePeriod({ periodo: param(sp, "periodo") ?? "90", de: param(sp, "de"), ate: param(sp, "ate") }, today);
  const previous = previousRange(period.range);

  const [exercise, workouts] = await Promise.all([
    getExercise(id),
    listWorkouts({ range: { from: previous.from, to: period.range.to }, limit: 1000 }),
  ]);
  if (!exercise) notFound();

  const sessions = sessionsByExercise(workouts).get(id) ?? [];
  const series = sessionSeries(sessions, period.range);
  const comparison = comparePeriods(sessions, previous, period.range);
  const loads = series.map((s) => s.maxLoad).filter((l): l is number => l != null);
  const hasLoad = loads.length > 0;
  const workoutByDate = new Map(workouts.map((w) => [w.date, w.id]));

  return (
    <>
      <PageHeader
        title={exercise.name}
        description={`${muscleGroupLabel(exercise.muscle_group)}${exercise.equipment ? ` · ${exercise.equipment}` : ""}`}
        backHref="/evolucao"
      />
      <PeriodSelector basePath={`/evolucao/exercicio/${id}`} period={period} />

      {series.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma sessão deste exercício no período.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Sessões" value={String(series.length)} />
            <Stat label="Maior carga" value={hasLoad ? `${formatNumber(Math.max(...loads), 2)} kg` : "—"} />
            <Stat label="Séries" value={String(series.reduce((s, p) => s + p.sets, 0))} />
            <Stat label="Volume total" value={hasLoad ? formatVolume(series.reduce((s, p) => s + p.volume, 0)) : "—"} />
          </dl>

          <Card>
            <CardHeader>
              <CardTitle>Comparação com o período anterior</CardTitle>
              <CardDescription>
                {formatDate(previous.from)} a {formatDate(previous.to)} vs. {formatDate(period.range.from)} a {formatDate(period.range.to)}. Exige ao menos{" "}
                {MIN_SESSIONS_TO_COMPARE} sessões em cada período; indica a direção dos números, sem concluir que houve melhora.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ComparisonCell comparison={comparison} />
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Sessões (antes → agora)" value={`${comparison.a.sessions} → ${comparison.b.sessions}`} />
                <Stat
                  label="Maior carga"
                  value={`${comparison.a.maxLoad != null ? formatNumber(comparison.a.maxLoad, 2) : "—"} → ${comparison.b.maxLoad != null ? formatNumber(comparison.b.maxLoad, 2) : "—"} kg`}
                />
                <Stat label="Volume médio/sessão" value={`${formatNumber(comparison.a.avgVolume, 0)} → ${formatNumber(comparison.b.avgVolume, 0)} kg`} />
                <Stat label="Reps médias/sessão" value={`${formatNumber(comparison.a.avgReps, 1)} → ${formatNumber(comparison.b.avgReps, 1)}`} />
              </dl>
            </CardContent>
          </Card>

          {hasLoad ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Maior carga por sessão</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeChart data={series.map((p) => ({ date: p.date, maxLoad: p.maxLoad }))} series={[{ key: "maxLoad", label: "Maior carga", kind: "line", color: "var(--chart-1)" }]} unit="kg" digits={2} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Volume por sessão</CardTitle>
                  <CardDescription>soma(carga × repetições) das séries válidas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeChart data={series.map((p) => ({ date: p.date, volume: p.volume }))} series={[{ key: "volume", label: "Volume", kind: "bar", color: "var(--chart-4)" }]} unit="kg" digits={0} zeroBased />
                </CardContent>
              </Card>
            </>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Repetições por sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeChart data={series.map((p) => ({ date: p.date, reps: p.reps }))} series={[{ key: "reps", label: "Repetições", kind: "bar", color: "var(--chart-2)" }]} unit="reps" digits={0} zeroBased />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Séries</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions
                    .filter((s) => s.date >= period.range.from && s.date <= period.range.to)
                    .reverse()
                    .map((s, i) => (
                      <TableRow key={`${s.date}-${i}`}>
                        <TableCell>
                          {workoutByDate.get(s.date) ? (
                            <Link href={`/treinos/${workoutByDate.get(s.date)}`} className="underline-offset-4 hover:underline">
                              {formatDate(s.date)}
                            </Link>
                          ) : (
                            formatDate(s.date)
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{summarizeSets(s.sets) || "só aquecimento"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {hasLoad ? formatVolume(exerciseStats(s.sets).volume) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
