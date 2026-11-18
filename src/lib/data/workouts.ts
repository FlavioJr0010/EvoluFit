import "server-only";

import type { DateRange } from "@/lib/dates";
import type { MuscleGroup } from "@/lib/training/labels";
import type { ExerciseSession, SetData } from "@/lib/training/stats";

import { authed } from "./context";

export type Exercise = {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
  notes: string | null;
  archived_at: string | null;
};

const EXERCISE_COLUMNS = "id, name, muscle_group, equipment, notes, archived_at";

export async function listExercises({ archived = false }: { archived?: boolean } = {}): Promise<Exercise[]> {
  const { supabase } = await authed();
  let query = supabase.from("exercises").select(EXERCISE_COLUMNS).order("name");
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data } = await query.limit(500);
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("exercises").select(EXERCISE_COLUMNS).eq("id", id).maybeSingle();
  return data;
}

export async function getExerciseUsage(id: string) {
  const { supabase } = await authed();
  const { count } = await supabase
    .from("workout_exercises")
    .select("id", { count: "exact", head: true })
    .eq("exercise_id", id);
  return { workouts: count ?? 0 };
}

export type WorkoutSet = SetData & { id: string; set_number: number; notes: string | null };

export type WorkoutExercise = {
  id: string;
  position: number;
  notes: string | null;
  exercise: Pick<Exercise, "id" | "name" | "muscle_group" | "archived_at">;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  date: string;
  title: string;
  notes: string | null;
  created_at: string;
  exercises: WorkoutExercise[];
};

const WORKOUT_SELECT = `id, date, title, notes, created_at,
  workout_exercises ( id, position, notes,
    exercises ( id, name, muscle_group, archived_at ),
    exercise_sets ( id, set_number, load_kg, reps, is_warmup, notes ) )`;

type WorkoutRow = {
  id: string;
  date: string;
  title: string;
  notes: string | null;
  created_at: string;
  workout_exercises: {
    id: string;
    position: number;
    notes: string | null;
    exercises: WorkoutExercise["exercise"];
    exercise_sets: { id: string; set_number: number; load_kg: number | null; reps: number; is_warmup: boolean; notes: string | null }[];
  }[];
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    notes: row.notes,
    created_at: row.created_at,
    exercises: [...row.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((we) => ({
        id: we.id,
        position: we.position,
        notes: we.notes,
        exercise: we.exercises,
        sets: [...we.exercise_sets]
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({ ...s, load_kg: s.load_kg == null ? null : Number(s.load_kg) })),
      })),
  };
}

const newestFirst = (a: Workout, b: Workout) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);

export async function listWorkouts({ range, limit = 100 }: { range?: DateRange; limit?: number } = {}): Promise<Workout[]> {
  const { supabase } = await authed();
  let query = supabase.from("workouts").select(WORKOUT_SELECT).order("date", { ascending: false }).order("created_at", { ascending: false });
  if (range) query = query.gte("date", range.from).lte("date", range.to);
  const { data } = await query.limit(limit);
  return ((data ?? []) as unknown as WorkoutRow[]).map(toWorkout).sort(newestFirst);
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("workouts").select(WORKOUT_SELECT).eq("id", id).maybeSingle();
  return data ? toWorkout(data as unknown as WorkoutRow) : null;
}

export async function getLastWorkout(): Promise<Workout | null> {
  return (await listWorkouts({ limit: 1 }))[0] ?? null;
}

/** Sessões por exercício (uma por treino), do mais antigo ao mais recente. */
export function sessionsByExercise(workouts: Workout[]): Map<string, ExerciseSession[]> {
  const map = new Map<string, ExerciseSession[]>();
  for (const w of [...workouts].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const we of w.exercises) {
      const list = map.get(we.exercise.id) ?? [];
      list.push({ date: w.date, sets: we.sets });
      map.set(we.exercise.id, list);
    }
  }
  return map;
}
