"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SearchPicker } from "@/components/forms/search-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Exercise, Workout } from "@/lib/data/workouts";
import { formatDate } from "@/lib/dates";
import { formatNumber, toInputValue } from "@/lib/format";
import { initialFormState } from "@/lib/forms";
import { formatVolume } from "@/lib/training/format";
import { muscleGroupLabel } from "@/lib/training/labels";
import { exerciseStats } from "@/lib/training/stats";
import { parseDecimalPtBR } from "@/lib/validation/decimal";

import { saveWorkout } from "./actions";

type SetRow = { key: string; load: string; reps: string; warmup: boolean; notes: string; showNotes: boolean };
type ExerciseRow = { key: string; exercise_id: string; notes: string; sets: SetRow[] };

let seq = 0;
const key = () => `k-${++seq}`;

const emptySet = (from?: SetRow): SetRow => ({
  key: key(),
  load: from?.load ?? "",
  reps: from?.reps ?? "",
  warmup: false,
  notes: "",
  showNotes: false,
});

function fromWorkout(workout: Workout): ExerciseRow[] {
  return workout.exercises.map((we) => ({
    key: key(),
    exercise_id: we.exercise.id,
    notes: we.notes ?? "",
    sets: we.sets.map((s) => ({
      key: key(),
      load: toInputValue(s.load_kg),
      reps: String(s.reps),
      warmup: s.is_warmup,
      notes: s.notes ?? "",
      showNotes: Boolean(s.notes),
    })),
  }));
}

export type LastSession = { date: string; summary: string };

export function WorkoutEditor({
  exercises,
  date,
  workout,
  template,
  lastSessions,
}: {
  exercises: Pick<Exercise, "id" | "name" | "muscle_group" | "archived_at">[];
  date: string;
  /** Treino sendo editado. */
  workout?: Workout;
  /** Treino anterior usado como modelo (duplicar). */
  template?: Workout;
  lastSessions: Record<string, LastSession>;
}) {
  const [state, action, pending] = useActionState(saveWorkout, initialFormState);
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const source = workout ?? template;

  const [workoutDate, setWorkoutDate] = useState(workout?.date ?? date);
  const [title, setTitle] = useState(source?.title ?? "");
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [rows, setRows] = useState<ExerciseRow[]>(() => (source ? fromWorkout(source) : []));

  const updateExercise = (k: string, fn: (r: ExerciseRow) => ExerciseRow) => setRows((rs) => rs.map((r) => (r.key === k ? fn(r) : r)));
  const updateSet = (ek: string, sk: string, patch: Partial<SetRow>) =>
    updateExercise(ek, (r) => ({ ...r, sets: r.sets.map((s) => (s.key === sk ? { ...s, ...patch } : s)) }));
  const move = (index: number, delta: number) =>
    setRows((rs) => {
      const next = [...rs];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const parsedSets = (r: ExerciseRow) =>
    r.sets.map((s) => {
      const load = s.load.trim() === "" ? null : parseDecimalPtBR(s.load);
      const reps = /^\d+$/.test(s.reps.trim()) ? Number(s.reps) : NaN;
      return { load_kg: load, reps, is_warmup: s.warmup, validLoad: s.load.trim() === "" || (load != null && load >= 0), validReps: reps >= 1 };
    });

  const allValid =
    rows.length > 0 &&
    title.trim() !== "" &&
    rows.every((r) => r.sets.length > 0 && parsedSets(r).every((s) => s.validLoad && s.validReps));

  const workoutVolume = rows.reduce((sum, r) => {
    const sets = parsedSets(r).filter((s) => s.validLoad && s.validReps);
    return sum + exerciseStats(sets).volume;
  }, 0);

  const payload = JSON.stringify({
    id: workout?.id ?? null,
    date: workoutDate,
    title,
    notes,
    exercises: rows.map((r) => ({
      exercise_id: r.exercise_id,
      notes: r.notes,
      sets: r.sets.map((s) => ({ load_kg: s.load, reps: s.reps, is_warmup: s.warmup, notes: s.notes })),
    })),
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="payload" value={payload} />
      <FormMessage state={state} />
      {template ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          Modelo: treino de {formatDate(template.date)}. Cargas e repetições foram copiadas; ajuste o que mudou.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <Field>
          <FieldLabel htmlFor="workout-title">Título</FieldLabel>
          <Input id="workout-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="ex.: Treino de pernas" className="h-10" />
        </Field>
        <Field>
          <FieldLabel htmlFor="workout-date">Data</FieldLabel>
          <Input id="workout-date" type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)} className="h-10" />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <SearchPicker
          label="Adicionar exercício"
          placeholder="Buscar exercício para adicionar"
          emptyText="Nenhum exercício encontrado."
          options={exercises
            .filter((e) => !e.archived_at)
            .map((e) => ({ value: e.id, label: e.name, group: muscleGroupLabel(e.muscle_group) }))}
          onPick={(o) => setRows((rs) => [...rs, { key: key(), exercise_id: o.value, notes: "", sets: [emptySet()] }])}
        />
        <Link href="/exercicios/novo?voltar=treino" className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline">
          Cadastrar novo exercício (sai desta tela)
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum exercício adicionado.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {rows.map((row, index) => {
            const exercise = byId.get(row.exercise_id);
            const parsed = parsedSets(row);
            const stats = exerciseStats(parsed.filter((s) => s.validLoad && s.validReps));
            const last = lastSessions[row.exercise_id];
            return (
              <li key={row.key} className="rounded-lg border">
                <div className="flex items-start justify-between gap-2 border-b p-3">
                  <div>
                    <p className="font-medium">
                      {index + 1}. {exercise?.name ?? "Exercício"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exercise ? muscleGroupLabel(exercise.muscle_group) : ""}
                      {last ? ` · Última vez (${formatDate(last.date)}): ${last.summary}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ChevronUp />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Mover para baixo" disabled={index === rows.length - 1} onClick={() => move(index, 1)}>
                      <ChevronDown />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${exercise?.name ?? "exercício"}`} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3">
                  <div className="grid grid-cols-[2rem_1fr_1fr_auto_auto] items-center gap-2 text-xs text-muted-foreground">
                    <span>Série</span>
                    <span>Carga total (kg)</span>
                    <span>Repetições</span>
                    <span>Aquec.</span>
                    <span className="sr-only">Ações</span>
                  </div>
                  {row.sets.map((set, si) => {
                    const p = parsed[si];
                    return (
                      <div key={set.key} className="flex flex-col gap-1">
                        <div className="grid grid-cols-[2rem_1fr_1fr_auto_auto] items-center gap-2">
                          <span className="text-center text-sm tabular-nums text-muted-foreground">{si + 1}</span>
                          <Input
                            aria-label={`Carga da série ${si + 1}`}
                            inputMode="decimal"
                            placeholder="sem carga"
                            value={set.load}
                            onChange={(e) => updateSet(row.key, set.key, { load: e.target.value })}
                            aria-invalid={!p.validLoad || undefined}
                            className="h-10"
                          />
                          <Input
                            aria-label={`Repetições da série ${si + 1}`}
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(row.key, set.key, { reps: e.target.value })}
                            aria-invalid={(set.reps !== "" && !p.validReps) || undefined}
                            className="h-10"
                          />
                          <input
                            type="checkbox"
                            aria-label={`Série ${si + 1} é aquecimento`}
                            checked={set.warmup}
                            onChange={(e) => updateSet(row.key, set.key, { warmup: e.target.checked })}
                            className="size-5 accent-primary"
                          />
                          <div className="flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Observação da série ${si + 1}`}
                              aria-pressed={set.showNotes}
                              onClick={() => updateSet(row.key, set.key, { showNotes: !set.showNotes })}
                              className="text-xs"
                            >
                              obs
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remover série ${si + 1}`}
                              disabled={row.sets.length === 1}
                              onClick={() => updateExercise(row.key, (r) => ({ ...r, sets: r.sets.filter((s) => s.key !== set.key) }))}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                        {set.showNotes ? (
                          <Input
                            aria-label={`Observação da série ${si + 1}`}
                            placeholder="ex.: falha muscular, dor, técnica"
                            value={set.notes}
                            maxLength={500}
                            onChange={(e) => updateSet(row.key, set.key, { notes: e.target.value })}
                            className="ml-10 h-9 w-auto"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => updateExercise(row.key, (r) => ({ ...r, sets: [...r.sets, emptySet(r.sets.at(-1))] }))}
                  >
                    <Plus /> Série
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalSets} série(s) válida(s) · {stats.totalReps} reps
                    {stats.maxLoad != null ? ` · máx. ${formatNumber(stats.maxLoad, 2)} kg · volume ${formatVolume(stats.volume)}` : ""}
                  </p>
                  <Textarea
                    aria-label={`Observação de ${exercise?.name ?? "exercício"}`}
                    placeholder="Observação do exercício (opcional)"
                    value={row.notes}
                    maxLength={1000}
                    rows={1}
                    onChange={(e) => updateExercise(row.key, (r) => ({ ...r, notes: e.target.value }))}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs text-muted-foreground">
        Carga = peso total movimentado (ex.: dois halteres de 10 kg = 20 kg). Deixe em branco para exercícios sem carga. Séries de
        aquecimento ficam no histórico, mas fora dos totais, do volume e da progressão.
      </p>

      <Field>
        <FieldLabel htmlFor="workout-notes">Observação do treino (opcional)</FieldLabel>
        <Textarea id="workout-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending || !allValid}>
          {pending ? "Salvando…" : "Salvar treino"}
        </Button>
        <span className="text-sm text-muted-foreground">Volume total: {formatVolume(workoutVolume)}</span>
      </div>
    </form>
  );
}
