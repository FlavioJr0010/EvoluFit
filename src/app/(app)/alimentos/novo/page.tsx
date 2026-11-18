import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { param } from "@/lib/data/search-params";

import { FoodForm } from "../food-form";

export const metadata: Metadata = { title: "Novo alimento" };

export default function NewFoodPage({ searchParams }: PageProps<"/alimentos/novo">) {
  return (
    <>
      <PageHeader title="Novo alimento" backHref="/alimentos" />
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <SavedNotice searchParams={searchParams} />
          </Suspense>
          <FoodForm />
        </CardContent>
      </Card>
    </>
  );
}

async function SavedNotice({ searchParams }: Pick<PageProps<"/alimentos/novo">, "searchParams">) {
  if (param(await searchParams, "salvo") !== "1") return null;
  return (
    <Alert>
      <AlertDescription>Alimento salvo. Cadastre o próximo.</AlertDescription>
    </Alert>
  );
}
