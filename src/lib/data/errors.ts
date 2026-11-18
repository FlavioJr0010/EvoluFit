import type { PostgrestError } from "@supabase/supabase-js";

/** Traduz erros do banco em mensagens para o usuário. */
export function dbErrorMessage(error: PostgrestError | null, fallback = "Não foi possível salvar. Tente novamente."): string {
  if (!error) return fallback;
  switch (error.code) {
    case "23505":
      return "Já existe um registro para esta data.";
    case "23503":
      return "Este registro está em uso e não pode ser removido.";
    case "23514":
      // mensagens próprias dos triggers (ex.: unidade incompatível) já vêm em português
      return /incompatível/.test(error.message) ? error.message : "Algum valor está fora do permitido.";
    case "22023":
    case "P0002":
      return error.message;
    case "42501":
      return "Você não tem permissão para esta operação.";
    default:
      return fallback;
  }
}
