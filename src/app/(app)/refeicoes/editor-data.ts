import "server-only";

import { listFoods, listRecipes } from "@/lib/data/foods";

/** Alimentos e preparações ativos para o editor de refeição. */
export async function loadEditorOptions() {
  const [foods, recipes] = await Promise.all([listFoods(), listRecipes()]);
  return { foods, recipes };
}
