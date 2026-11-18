import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { param } from "@/lib/data/search-params";

import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = { title: "Novo exercício" };

export default function NewExercisePage({ searchParams }: PageProps<"/exercicios/novo">) {
  return (
    <>
      <PageHeader title="Novo exercício" backHref="/exercicios" />
      <Card className="max-w-xl">
        <CardContent>
          <Suspense fallback={<ExerciseForm />}>
            <Form searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/exercicios/novo">, "searchParams">) {
  return <ExerciseForm back={param(await searchParams, "voltar") === "treino" ? "treino" : undefined} />;
}
