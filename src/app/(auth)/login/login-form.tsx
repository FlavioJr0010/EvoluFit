"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/forms";

import { login } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormMessage state={state} />
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
      <TextField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <Link
        href="/esqueci-senha"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </form>
  );
}
