"use server";

import { refresh } from "next/cache";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { addWaterSchema, checkinSchema } from "@/lib/validation/checkin";
import { dateSchema } from "@/lib/validation/common";

/** Cria ou atualiza o registro do dia (nunca duplica a data). */
export async function saveCheckin(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    date: formString(formData, "date"),
    weight_kg: formString(formData, "weight_kg"),
    water: formString(formData, "water"),
    water_unit: formString(formData, "water_unit") || "ml",
    notes: formString(formData, "notes"),
  };
  const parsed = checkinSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  }

  const { supabase, user } = await authed();
  const { error } = await supabase
    .from("daily_checkins")
    .upsert({ ...parsed.data, user_id: user.id }, { onConflict: "user_id,date" });
  if (error) return { status: "error", message: dbErrorMessage(error), values: raw };

  refresh();
  return { status: "success", message: "Registro salvo." };
}

/** Soma (ou subtrai) água ao total do dia. */
export async function addWater(date: string, amountMl: number): Promise<FormState> {
  const parsed = addWaterSchema.safeParse({ date, amount_ml: amountMl });
  if (!parsed.success) return { status: "error", message: "Quantidade inválida." };

  const { supabase, user } = await authed();
  const { data: current } = await supabase
    .from("daily_checkins")
    .select("water_ml, weight_kg")
    .eq("date", parsed.data.date)
    .maybeSingle();

  const water = Math.min(20000, Math.max(0, (current?.water_ml ?? 0) + parsed.data.amount_ml));
  const { error } = await supabase
    .from("daily_checkins")
    .upsert({ user_id: user.id, date: parsed.data.date, water_ml: water }, { onConflict: "user_id,date" });
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success" };
}

export async function deleteCheckin(date: string): Promise<FormState> {
  if (!dateSchema.safeParse(date).success) return { status: "error", message: "Data inválida." };
  const { supabase } = await authed();
  const { error } = await supabase.from("daily_checkins").delete().eq("date", date);
  if (error) return { status: "error", message: dbErrorMessage(error) };
  refresh();
  return { status: "success", message: "Registro excluído." };
}
