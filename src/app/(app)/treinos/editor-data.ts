import "server-only";

import { listExercises, listWorkouts, sessionsByExercise, type Workout } from "@/lib/data/workouts";
import { summarizeSets } from "@/lib/training/format";

import type { LastSession } from "./workout-editor";

/**
 * Exercícios disponíveis (ativos + os do treino, mesmo arquivados) e a
 * última sessão de cada um, para servir de referência ao registrar.
 */
export async function loadWorkoutEditorData(current?: Workout) {
  const [exercises, recent] = await Promise.all([listExercises(), listWorkouts({ limit: 60 })]);
  const all = new Map(exercises.map((e) => [e.id, { id: e.id, name: e.name, muscle_group: e.muscle_group, archived_at: e.archived_at }]));
  current?.exercises.forEach((we) => all.set(we.exercise.id, we.exercise));

  const lastSessions: Record<string, LastSession> = {};
  const sessions = sessionsByExercise(recent.filter((w) => w.id !== current?.id));
  for (const [exerciseId, list] of sessions) {
    const last = list.at(-1);
    if (last) lastSessions[exerciseId] = { date: last.date, summary: summarizeSets(last.sets) || "só aquecimento" };
  }
  return { exercises: [...all.values()], lastSessions };
}
