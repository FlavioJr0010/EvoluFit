"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import type { MuscleGroup } from "@/lib/training/labels";
import { uuidSchema } from "@/lib/validation/common";
import { exerciseSchema } from "@/lib/validation/workout";

export async function saveExercise(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: formString(formData, "name"),
    muscle_group: formString(formData, "muscle_group"),
    equipment: formString(formData, "equipment"),
    notes: formString(formData, "notes"),
  };
  const id = formString(formData, "id") || null;
  const parsed = exerciseSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  if (id && !uuidSchema.safeParse(id).success) return { status: "error", message: "Exercício inválido." };

  const data = { ...parsed.data, muscle_group: parsed.data.muscle_group as MuscleGroup };
  const { supabase } = await authed();
  const { error } = id ? await supabase.from("exercises").update(data).eq("id", id) : await supabase.from("exercises").insert(data);
  if (error) return { status: "error", message: dbErrorMessage(error), values: raw };

  const back = formString(formData, "back");
  redirect(back === "treino" ? "/treinos/novo" : "/exercicios");
}

export async function setExerciseArchived(id: string, archived: boolean): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Exercício inválido." };
  const { supabase } = await authed();
  const { error } = await supabase
    .from("exercises")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  refresh();
  return { status: "success", message: archived ? "Exercício arquivado." : "Exercício restaurado." };
}

export async function deleteExercise(id: string): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Exercício inválido." };
  const { supabase } = await authed();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error?.code === "23503") {
    return { status: "error", message: "Este exercício já foi usado em treinos. Arquive-o em vez de excluir." };
  }
  if (error) return { status: "error", message: dbErrorMessage(error) };
  redirect("/exercicios");
}
