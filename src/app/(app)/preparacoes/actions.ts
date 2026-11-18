"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { uuidSchema } from "@/lib/validation/common";
import { recipeSchema } from "@/lib/validation/food";

export async function saveRecipe(_prev: FormState, formData: FormData): Promise<FormState> {
  let payload: unknown;
  try {
    payload = JSON.parse(formString(formData, "payload"));
  } catch {
    return { status: "error", message: "Dados inválidos." };
  }
  const parsed = recipeSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), message: parsed.error.issues[0]?.message };

  const { supabase } = await authed();
  const r = parsed.data;
  const { data: id, error } = await supabase.rpc("save_recipe", {
    p_id: r.id as string,
    p_name: r.name,
    p_servings: r.servings,
    p_notes: r.notes as string,
    p_items: r.items,
  });
  if (error || !id) return { status: "error", message: dbErrorMessage(error) };
  redirect(`/preparacoes/${id}`);
}

export async function setRecipeArchived(id: string, archived: boolean): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Preparação inválida." };
  const { supabase } = await authed();
  const { error } = await supabase
    .from("recipes")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  refresh();
  return { status: "success", message: archived ? "Preparação arquivada." : "Preparação restaurada." };
}

export async function deleteRecipe(id: string): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Preparação inválida." };
  const { supabase } = await authed();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error?.code === "23503") {
    return { status: "error", message: "Esta preparação já foi usada em refeições. Arquive-a em vez de excluir." };
  }
  if (error) return { status: "error", message: dbErrorMessage(error) };
  redirect("/preparacoes");
}
