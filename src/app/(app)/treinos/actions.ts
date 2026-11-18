"use server";

import { redirect } from "next/navigation";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { uuidSchema } from "@/lib/validation/common";
import { workoutSchema } from "@/lib/validation/workout";

export async function saveWorkout(_prev: FormState, formData: FormData): Promise<FormState> {
  let payload: unknown;
  try {
    payload = JSON.parse(formString(formData, "payload"));
  } catch {
    return { status: "error", message: "Dados inválidos." };
  }
  const parsed = workoutSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), message: parsed.error.issues[0]?.message };
  }
  const w = parsed.data;

  const { supabase } = await authed();
  const { data: id, error } = await supabase.rpc("save_workout", {
    p_id: w.id as string,
    p_date: w.date,
    p_title: w.title,
    p_notes: w.notes as string,
    p_exercises: w.exercises,
  });
  if (error || !id) return { status: "error", message: dbErrorMessage(error) };
  redirect(`/treinos/${id}`);
}

export async function deleteWorkout(id: string): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Treino inválido." };
  const { supabase } = await authed();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  redirect("/treinos");
}
