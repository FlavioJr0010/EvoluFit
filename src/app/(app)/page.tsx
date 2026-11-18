import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { WaterButtons } from "@/components/tracking/water-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCheckin, getLatestWeight } from "@/lib/data/checkins";
import { getToday } from "@/lib/data/context";
import { formatDate, formatDateLong } from "@/lib/dates";
import { formatKg } from "@/lib/format";

export const metadata: Metadata = { title: "Hoje" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

async function Dashboard() {
  const today = await getToday();
  const [checkin, latestWeight] = await Promise.all([getCheckin(today), getLatestWeight()]);

  return (
    <>
      <PageHeader title="Hoje" description={<span className="capitalize">{formatDateLong(today)}</span>} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Água</CardTitle>
          </CardHeader>
          <CardContent>
            <WaterButtons date={today} waterMl={checkin?.water_ml ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {latestWeight ? (
              <>
                <span className="text-2xl font-semibold tabular-nums">{formatKg(latestWeight.weight_kg)}</span>
                <span className="text-sm text-muted-foreground">
                  {latestWeight.date === today ? "Registrado hoje" : `Última pesagem em ${formatDate(latestWeight.date)}`}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma pesagem registrada.</span>
            )}
            <Link href="/acompanhamento" className="mt-2 text-sm font-medium underline-offset-4 hover:underline">
              {checkin?.weight_kg != null ? "Editar registro de hoje" : "Registrar peso de hoje"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
