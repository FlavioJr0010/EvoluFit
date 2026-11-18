import { Scale } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DateNav } from "@/components/app/date-nav";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { WaterButtons } from "@/components/tracking/water-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCheckin, listRecentCheckins } from "@/lib/data/checkins";
import { getToday } from "@/lib/data/context";
import { dateParam } from "@/lib/data/search-params";
import { formatDate } from "@/lib/dates";
import { formatKg, formatWater } from "@/lib/format";

import { CheckinForm } from "./checkin-form";
import { DeleteCheckinButton } from "./delete-checkin-button";

export const metadata: Metadata = { title: "Peso e água" };

export default function CheckinPage({ searchParams }: PageProps<"/acompanhamento">) {
  return (
    <>
      <PageHeader title="Peso e água" description="Um registro por dia. Corrigir o peso ou a água atualiza o mesmo dia." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CheckinContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CheckinContent({ searchParams }: Pick<PageProps<"/acompanhamento">, "searchParams">) {
  const today = await getToday();
  const date = dateParam(await searchParams, today);
  const [checkin, recent] = await Promise.all([getCheckin(date), listRecentCheckins(14)]);

  return (
    <>
      <DateNav date={date} today={today} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Água</CardTitle>
          </CardHeader>
          <CardContent>
            <WaterButtons date={date} waterMl={checkin?.water_ml ?? null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registro do dia</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <CheckinForm date={date} checkin={checkin} />
            {checkin ? <DeleteCheckinButton date={date} /> : null}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Últimos registros</h2>
      {recent.length === 0 ? (
        <EmptyState icon={Scale} title="Nenhum registro ainda" description="Registre seu peso ou a água de hoje." />
      ) : (
        <Card className="gap-0 divide-y py-0">
          {recent.map((c) => (
            <Link
              key={c.id}
              href={`/acompanhamento?data=${c.date}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">{formatDate(c.date)}</span>
              <span className="flex gap-4 tabular-nums text-muted-foreground">
                <span>{c.weight_kg != null ? formatKg(c.weight_kg) : "—"}</span>
                <span className="w-16 text-right">{c.water_ml != null ? formatWater(c.water_ml) : "—"}</span>
              </span>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
