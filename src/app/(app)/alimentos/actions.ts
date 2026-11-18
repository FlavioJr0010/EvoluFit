"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { uuidSchema } from "@/lib/validation/common";
import { FOOD_FORM_FIELDS, foodSchema } from "@/lib/validation/food";

function readFood(formData: FormData) {
  return Object.fromEntries(FOOD_FORM_FIELDS.map((f) => [f, formString(formData, f)]));
}

export async function saveFood(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readFood(formData);
  const id = formString(formData, "id") || null;
  const parsed = foodSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  if (id && !uuidSchema.safeParse(id).success) return { status: "error", message: "Alimento inválido.", values: raw };

  const { supabase } = await authed();
  const { error } = id
    ? await supabase.from("foods").update(parsed.data).eq("id", id)
    : await supabase.from("foods").insert(parsed.data);
  if (error) return { status: "error", message: dbErrorMessage(error), values: raw };

  redirect(formString(formData, "next") === "novo" ? "/alimentos/novo?salvo=1" : "/alimentos");
}

export async function setFoodArchived(id: string, archived: boolean): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Alimento inválido." };
  const { supabase } = await authed();
  const { error } = await supabase
    .from("foods")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  refresh();
  return { status: "success", message: archived ? "Alimento arquivado." : "Alimento restaurado." };
}

/** Só exclui alimentos nunca usados; os usados devem ser arquivados. */
export async function deleteFood(id: string): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Alimento inválido." };
  const { supabase } = await authed();
  const { error } = await supabase.from("foods").delete().eq("id", id);
  if (error?.code === "23503") {
    return { status: "error", message: "Este alimento já foi usado em receitas ou refeições. Arquive-o em vez de excluir." };
  }
  if (error) return { status: "error", message: dbErrorMessage(error) };
  redirect("/alimentos");
}
