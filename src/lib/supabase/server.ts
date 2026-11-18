import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Client do Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a chave publicável + a sessão do usuário (cookies), então todas as
 * consultas passam pelo RLS.
 */
export async function createClient() {
  // O client do Supabase lê o relógio (Date.now) ao iniciar a sessão; com
  // Cache Components isso só pode acontecer no momento da requisição.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components não podem gravar cookies. O proxy já
            // renova a sessão a cada requisição, então é seguro ignorar.
          }
        },
      },
    },
  );
}
