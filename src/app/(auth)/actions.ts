"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/auth/schemas";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  const values = { email: formString(formData, "email") };

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar agora. Tente novamente em instantes.";
    return { status: "error", message, values };
  }

  redirect("/");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formString(formData, "email") });
  const values = { email: formString(formData, "email") };

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=/redefinir-senha` : undefined,
  });

  // Limite de envio é o único erro relevante a expor; os demais recebem a
  // mesma resposta genérica para não revelar se o e-mail tem conta.
  if (error?.code === "over_email_send_rate_limit") {
    return {
      status: "error",
      message: "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
      values,
    };
  }

  return {
    status: "success",
    message:
      "Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    const message =
      error.code === "same_password"
        ? "A nova senha deve ser diferente da atual."
        : error.code === "weak_password"
          ? "Senha fraca. Use pelo menos 8 caracteres com letras e números."
          : "Não foi possível alterar a senha. Solicite um novo link e tente novamente.";
    return { status: "error", message };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
