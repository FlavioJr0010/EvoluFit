import type { Metadata } from "next";
import { Suspense } from "react";

import { PeriodSelector } from "@/components/charts/period-selector";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listCheckins } from "@/lib/data/checkins";
import { listMealsInRange } from "@/lib/data/meals";
import { listWorkouts } from "@/lib/data/workouts";
import { getToday } from "@/lib/data/context";
import { param } from "@/lib/data/search-params";
import { addDays } from "@/lib/dates";
import { previousRange, resolvePeriod } from "@/lib/period";

import { FoodSection } from "./food-section";
import { TrainingSection } from "./training-section";
import { WaterSection, WeightSection } from "./weight-section";

export const metadata: Metadata = { title: "Evolução" };

export default function EvolutionPage({ searchParams }: PageProps<"/evolucao">) {
  return (
    <>
      <PageHeader title="Evolução" description="Peso, hidratação, alimentação e treinos no período." />
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <EvolutionContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EvolutionContent({ searchParams }: Pick<PageProps<"/evolucao">, "searchParams">) {
  const params = await searchParams;
  const today = await getToday();
  const period = resolvePeriod(
    { periodo: param(params, "periodo"), de: param(params, "de"), ate: param(params, "ate") },
    today,
  );
  // 6 dias antes do período para a janela da média móvel
  const previous = previousRange(period.range);
  const [checkins, meals, workouts] = await Promise.all([
    listCheckins({ from: addDays(period.range.from, -6), to: period.range.to }),
    listMealsInRange(period.range),
    listWorkouts({ range: { from: previous.from, to: period.range.to }, limit: 1000 }),
  ]);

  return (
    <>
      <PeriodSelector basePath="/evolucao" period={period} />
      <div className="flex flex-col gap-4">
        <WeightSection checkins={checkins} range={period.range} />
        <WaterSection checkins={checkins} range={period.range} />
        <FoodSection meals={meals} range={period.range} />
        <TrainingSection workouts={workouts} range={period.range} previous={previous} />
      </div>
    </>
  );
}
