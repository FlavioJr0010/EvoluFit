import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { todayInTimeZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const DEFAULT_TIMEZONE = "America/Bahia";

/**
 * Ponto de entrada de toda leitura/escrita de dados: valida a sessão e
 * devolve o client do Supabase (com RLS do usuário).
 */
export async function authed() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  return { user, supabase };
}

export async function getProfile() {
  const { supabase, user } = await authed();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .maybeSingle();
  return {
    displayName: data?.display_name ?? null,
    timezone: data?.timezone ?? DEFAULT_TIMEZONE,
  };
}

/** "Hoje" no fuso do usuário. */
export async function getToday(): Promise<string> {
  const { timezone } = await getProfile();
  return todayInTimeZone(timezone);
}
