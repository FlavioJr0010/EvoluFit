import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nova senha" };

/**
 * Acessada pelo link de recuperação (/auth/confirm cria a sessão).
 * O proxy redireciona para /login quem chega sem sessão, e a Server
 * Action revalida a sessão antes de alterar a senha.
 */
export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>Use pelo menos 8 caracteres, com letras e números.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
