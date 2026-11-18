import { Dumbbell } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { LinkButton } from "@/components/app/link-button";
import { Stat } from "@/components/app/stat";
import { TimeChart } from "@/components/charts/time-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sessionsByExercise, type Workout } from "@/lib/data/workouts";
import { formatDate, isWithin, type DateRange } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { formatVolume } from "@/lib/training/format";
import { exerciseReport } from "@/lib/training/report";
import { workoutVolume } from "@/lib/training/stats";

import { ComparisonCell } from "./comparison-cell";

/** `workouts` deve cobrir o período atual e o anterior (para comparação). */
export function TrainingSection({ workouts, range, previous }: { workouts: Workout[]; range: DateRange; previous: DateRange }) {
  const inPeriod = workouts.filter((w) => isWithin(w.date, range)).sort((a, b) => a.date.localeCompare(b.date));

  if (inPeriod.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Dumbbell} title="Sem treinos no período" action={<LinkButton href="/treinos/novo" variant="outline">Registrar treino</LinkButton>} />
        </CardContent>
      </Card>
    );
  }

  const names = new Map(workouts.flatMap((w) => w.exercises.map((e) => [e.exercise.id, e.exercise.name] as const)));
  const report = exerciseReport(sessionsByExercise(workouts), names, range, previous);
  const totalVolume = inPeriod.reduce((s, w) => s + workoutVolume(w.exercises), 0);

  // volume por dia (soma de treinos no mesmo dia)
  const volumeByDate = new Map<string, number>();
  for (const w of inPeriod) volumeByDate.set(w.date, (volumeByDate.get(w.date) ?? 0) + workoutVolume(w.exercises));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treinos</CardTitle>
        <CardDescription>
          Aquecimentos ficam fora dos totais. A comparação usa o período anterior de mesmo tamanho ({formatDate(previous.from)} a {formatDate(previous.to)}) e
          só aparece com ao menos 2 sessões em cada período.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Treinos" value={String(inPeriod.length)} />
          <Stat label="Volume total" value={formatVolume(totalVolume)} />
          <Stat label="Exercícios diferentes" value={String(report.length)} />
        </dl>
        {totalVolume > 0 ? (
          <TimeChart
            data={[...volumeByDate].map(([date, volume]) => ({ date, volume }))}
            series={[{ key: "volume", label: "Volume do treino", kind: "bar", color: "var(--chart-4)" }]}
            unit="kg"
            digits={0}
            zeroBased
          />
        ) : null}
        <div className="-mx-4 overflow-x-auto px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercício</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Séries</TableHead>
                <TableHead className="text-right">Reps</TableHead>
                <TableHead className="text-right">Maior carga</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Vs. período anterior</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.map((row) => (
                <TableRow key={row.exerciseId}>
                  <TableCell>
                    <Link href={`/evolucao/exercicio/${row.exerciseId}`} className="font-medium underline-offset-4 hover:underline">
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.sessions}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.sets}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.reps}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.maxLoad != null ? `${formatNumber(row.maxLoad, 2)} kg` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.volume > 0 ? formatVolume(row.volume) : "—"}</TableCell>
                  <TableCell>
                    <ComparisonCell comparison={row.comparison} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <h3 className="mt-2 text-sm font-medium">Histórico do período</h3>
        <ul className="flex flex-col divide-y rounded-lg border">
          {[...inPeriod].reverse().map((w) => (
            <li key={w.id}>
              <Link href={`/treinos/${w.id}`} className="flex items-baseline justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                <span>
                  <span className="font-medium">{w.title}</span>
                  <span className="text-muted-foreground"> · {w.exercises.length} exercício(s)</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{formatDate(w.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
