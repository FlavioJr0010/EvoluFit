"use client";

import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function LinkErrorNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("erro") !== "link-invalido") return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>
        O link é inválido ou expirou. Solicite um novo link de recuperação de senha.
      </AlertDescription>
    </Alert>
  );
}
