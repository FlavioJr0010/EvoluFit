"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta tela. Verifique sua conexão e tente novamente.
      </p>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </div>
  );
}
