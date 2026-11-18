import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Resumo do dia" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Resumo do dia</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await getCurrentUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tudo pronto</CardTitle>
        <CardDescription>
          Peso, água, refeições e treinos aparecerão aqui à medida que os módulos forem
          implementados.
        </CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
