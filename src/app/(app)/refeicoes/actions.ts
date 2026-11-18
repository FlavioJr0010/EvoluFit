"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { getMeal, listMealsByDate, loadSources } from "@/lib/data/meals";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { buildMealPayload, MissingSourceError, type MealItemInput } from "@/lib/nutrition/meals";
import { UnitConversionError } from "@/lib/nutrition/calc";
import { uuidSchema } from "@/lib/validation/common";
import { duplicateMealsSchema, mealSchema } from "@/lib/validation/meal";

const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => v != null))];

export async function saveMeal(_prev: FormState, formData: FormData): Promise<FormState> {
  let payload: unknown;
  try {
    payload = JSON.parse(formString(formData, "payload"));
  } catch {
    return { status: "error", message: "Dados inválidos." };
  }
  const parsed = mealSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), message: parsed.error.issues[0]?.message };
  }
  const meal = parsed.data;

  const stored = meal.id ? await getMeal(meal.id) : null;
  if (meal.id && !stored) return { status: "error", message: "Refeição não encontrada." };

  let items;
  try {
    const { foods, recipes } = await loadSources(unique(meal.items.map((i) => i.food_id)), unique(meal.items.map((i) => i.recipe_id)));
    items = buildMealPayload(meal.items as MealItemInput[], (stored?.items ?? []) as (MealItemInput & { id: string })[], foods, recipes);
  } catch (error) {
    if (error instanceof MissingSourceError || error instanceof UnitConversionError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  const { supabase } = await authed();
  const { error } = await supabase.rpc("save_meal", {
    p_id: meal.id as string,
    p_date: meal.date,
    p_meal_type: meal.meal_type,
    p_custom_name: meal.custom_name as string,
    p_items: items,
  });
  if (error) return { status: "error", message: dbErrorMessage(error) };

  redirect(`/refeicoes?data=${meal.date}`);
}

export async function deleteMeal(id: string): Promise<FormState> {
  if (!uuidSchema.safeParse(id).success) return { status: "error", message: "Refeição inválida." };
  const { supabase } = await authed();
  const { error } = await supabase.from("daily_meals").delete().eq("id", id);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  refresh();
  return { status: "success", message: "Refeição excluída." };
}

/**
 * Copia refeições de uma data para outra, recalculando os itens com os
 * cadastros atuais. Itens de alimentos/receitas arquivados são copiados
 * e geram aviso.
 */
export async function duplicateMeals(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = duplicateMealsSchema.safeParse({
    source_date: formString(formData, "source_date"),
    target_date: formString(formData, "target_date"),
    meal_ids: formData.getAll("meal_ids").map(String),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { source_date, target_date, meal_ids } = parsed.data;

  const source = (await listMealsByDate(source_date)).filter((m) => meal_ids.includes(m.id));
  if (source.length === 0) return { status: "error", message: "Nenhuma refeição encontrada na data de origem." };

  const allItems = source.flatMap((m) => m.items);
  const { foods, recipes, archived } = await loadSources(unique(allItems.map((i) => i.food_id)), unique(allItems.map((i) => i.recipe_id)));
  const { supabase } = await authed();

  let copied = 0;
  for (const meal of source) {
    let items;
    try {
      items = buildMealPayload(
        meal.items.map((i) => ({ id: null, food_id: i.food_id, recipe_id: i.recipe_id, quantity: i.quantity, unit: i.unit })),
        [],
        foods,
        recipes,
      );
    } catch (error) {
      if (error instanceof MissingSourceError || error instanceof UnitConversionError) {
        return { status: "error", message: `${copied} refeição(ões) copiada(s). Falha em uma refeição: ${error.message}` };
      }
      throw error;
    }
    const { error } = await supabase.rpc("save_meal", {
      p_id: null as unknown as string,
      p_date: target_date,
      p_meal_type: meal.meal_type,
      p_custom_name: meal.custom_name as string,
      p_items: items,
    });
    if (error) return { status: "error", message: `${copied} refeição(ões) copiada(s). ${dbErrorMessage(error)}` };
    copied++;
  }

  const archivedCount = allItems.filter((i) => archived.has(i.food_id ?? i.recipe_id ?? "")).length;
  const warning = archivedCount ? `aviso=${archivedCount}&` : "";
  redirect(`/refeicoes?${warning}copiadas=${copied}&data=${target_date}`);
}
