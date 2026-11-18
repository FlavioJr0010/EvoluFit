import "server-only";

import type { DateRange } from "@/lib/dates";

import { authed } from "./context";

export type Checkin = {
  id: string;
  date: string;
  weight_kg: number | null;
  water_ml: number | null;
  notes: string | null;
};

const COLUMNS = "id, date, weight_kg, water_ml, notes";

export async function getCheckin(date: string): Promise<Checkin | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("daily_checkins").select(COLUMNS).eq("date", date).maybeSingle();
  return data;
}

export async function listCheckins(range: DateRange): Promise<Checkin[]> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("daily_checkins")
    .select(COLUMNS)
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date");
  return data ?? [];
}

export async function listRecentCheckins(limit: number): Promise<Checkin[]> {
  const { supabase } = await authed();
  const { data } = await supabase.from("daily_checkins").select(COLUMNS).order("date", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getLatestWeight(): Promise<{ date: string; weight_kg: number } | null> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("daily_checkins")
    .select("date, weight_kg")
    .not("weight_kg", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.weight_kg != null ? { date: data.date, weight_kg: data.weight_kg } : null;
}
