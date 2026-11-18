import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/forms";

/** Mensagem geral do formulário (erro ou sucesso), anunciada a leitores de tela. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  return (
    <Alert variant={state.status === "error" ? "destructive" : "default"} aria-live="polite">
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
