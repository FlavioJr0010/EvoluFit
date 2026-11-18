"use client";

import { Droplets } from "lucide-react";
import { useState, useTransition } from "react";

import { addWater } from "@/app/(app)/acompanhamento/actions";
import { Button } from "@/components/ui/button";
import { formatWater } from "@/lib/format";

/** Botões rápidos +250 ml / +500 ml (e desfazer −250 ml). */
export function WaterButtons({ date, waterMl }: { date: string; waterMl: number | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const add = (amount: number) =>
    startTransition(async () => {
      const result = await addWater(date, amount);
      setError(result.status === "error" ? (result.message ?? "Erro ao salvar.") : null);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Droplets className="size-5 text-sky-600" aria-hidden />
        <span className="text-2xl font-semibold tabular-nums" aria-live="polite">
          {formatWater(waterMl ?? 0)}
        </span>
        <span className="text-sm text-muted-foreground">de água</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="lg" disabled={pending} onClick={() => add(250)}>
          +250 ml
        </Button>
        <Button type="button" variant="secondary" size="lg" disabled={pending} onClick={() => add(500)}>
          +500 ml
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={pending || !waterMl}
          onClick={() => add(-250)}
          aria-label="Remover 250 ml"
        >
          −250 ml
        </Button>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
