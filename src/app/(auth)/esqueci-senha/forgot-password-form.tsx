"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/forms";

import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
      {state.status !== "success" ? (
        <>
          <TextField
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
            errors={state.fieldErrors?.email}
          />
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Enviando…" : "Enviar link"}
          </Button>
        </>
      ) : null}
      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
